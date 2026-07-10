import { appConfig } from "@/config/app.config";
import { useAppStore } from "@/store/useAppStore";
import { AppState, type NativeEventSubscription } from "react-native";
import { io, Socket } from "socket.io-client";
import { groupKeys } from "./keys";
import { queryClient } from "./queryClient";
import {
  PremiumUpdatePayload,
  PresenceUpdatePayload,
  SessionClosedPayload,
  SessionState,
  SessionUpdatePayload,
  SocketAck,
  StatusEntry,
  StatusUpdateInput,
} from "./types";

/**
 * Socket.io Session Katmanı (mobile_api_doc.md §4)
 *
 * - Grup ekranına girerken `openSession(groupId)` çağrılır; tüm grup verisi
 *   tek seferde gelir ve store'daki `session`'a yazılır.
 * - Sonraki değişiklikler `session:update` patch'leriyle canlı akar.
 * - Status güncelleme REST'ten değil, SADECE `updateStatus()` (socket) ile yapılır.
 */

let socket: Socket | null = null;
let tokenProvider: (() => Promise<string>) | null = null;
/** Açık tutulmak istenen session'ın grubu (reconnect'te yeniden açılır). */
let activeGroupId: string | null = null;
/**
 * Aynı grubun session'ını birden fazla ekran kullanabilir (home + üye listesi gibi).
 * Ref-count sıfıra inmeden session gerçekten kapatılmaz.
 */
let sessionRefCount = 0;
let appStateSubscription: NativeEventSubscription | null = null;

const emitSessionOpen = (groupId: string) => {
  if (!socket?.connected) return;
  socket.emit(
    "session:open",
    { groupId },
    (res: SocketAck<SessionState>) => {
      if (!res.ok) {
        console.warn("session:open başarısız:", res.error);
        return;
      }
      // Kullanıcı ack gelene kadar başka gruba geçmiş olabilir
      if (activeGroupId !== groupId) return;
      useAppStore.getState().setSession({
        group: res.group,
        version: res.version,
        onlineUserIds: res.onlineUserIds,
      });
    },
  );
};

/**
 * Socket bağlantısını kurar. Firebase ID token ~1 saatte expire olduğu için
 * token sabit string değil, her (re)connect'te çağrılan bir provider olarak verilir.
 */
export const initSocket = (getToken: () => Promise<string>) => {
  tokenProvider = getToken;
  if (socket) return; // Prevent multiple connections

  socket = io(appConfig.socketUrl, {
    auth: (cb) => {
      tokenProvider?.()
        .then((token) => cb({ token })) // Bearer prefix YOK
        .catch((err) => {
          console.error("Socket token alınamadı:", err);
          cb({});
        });
    },
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    // Reconnect sonrası session otomatik geri gelmez — tekrar aç
    if (activeGroupId) emitSessionOpen(activeGroupId);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket?.connect();
    }
  });

  // session:open sonrası tam state (ack ile aynı içerik)
  socket.on("session:state", (state: SessionState) => {
    if (!activeGroupId || state.group.id !== activeGroupId) return;
    useAppStore.getState().setSession(state);
  });

  // Gruptaki her değişim
  socket.on("session:update", (update: SessionUpdatePayload) => {
    const applied = useAppStore.getState().applySessionUpdate(update);
    if (!applied && activeGroupId) {
      // Version atlandı → güncelleme kaçırıldı, tam state'i yeniden al
      console.warn("session:update version atladı, session yeniden açılıyor");
      emitSessionOpen(activeGroupId);
    }
  });

  // Bir üye session'a girip çıktığında
  socket.on("presence:update", ({ userId, online }: PresenceUpdatePayload) => {
    useAppStore.getState().setPresence(userId, online);
  });

  // Session sunucu tarafından kapatıldığında
  socket.on("session:closed", ({ reason }: SessionClosedPayload) => {
    console.log("session:closed:", reason);
    switch (reason) {
      case "removed":
      case "deleted":
        // Gruptan çıkarıldık veya grup silindi → session'ı kapat, listeyi yenile
        useAppStore.getState().clearSession();
        if (activeGroupId) {
          const { groups, setGroups, setCurrentGroup } = useAppStore.getState();
          const remaining = groups.filter((g) => g.id !== activeGroupId);
          setGroups(remaining);
          // Boş ekrana düşürme — varsa kalan ilk gruba geç
          setCurrentGroup(remaining[0]?.id ?? null);
          activeGroupId = null;
          sessionRefCount = 0;
        }
        queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        break;
      case "switched":
        // Başka grupta session açıldı; yeni state zaten geliyor — dokunma
        break;
      case "server":
        // Sunucu kaynaklı kapanış → yeniden dene
        useAppStore.getState().clearSession();
        if (activeGroupId) emitSessionOpen(activeGroupId);
        break;
    }
  });

  // Kendi premium durumun değiştiğinde (session gerekmez)
  socket.on("premium:update", ({ isPremium }: PremiumUpdatePayload) => {
    useAppStore.getState().setPremium(isPremium);
  });

  // Uygulama yaşam döngüsü:
  // - Arka plan: session'ı sunucu tarafında kapat — kullanıcı "session'da" görünürse
  //   status push'ları ona hiç gitmez (dökümandaki öneri).
  // - Öne dönüş: session'ı tam state ile yeniden aç ve grup listesini tazele.
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener("change", (state) => {
      if (!socket) return;
      if (state === "background") {
        if (activeGroupId && socket.connected) {
          socket.emit("session:close", {}, () => {});
        }
      } else if (state === "active") {
        if (activeGroupId) emitSessionOpen(activeGroupId);
        queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      }
    });
  }
};

/** Grup ekranına girerken çağrılır. Kullanıcı başına tek aktif session vardır. */
export const openSession = (groupId: string) => {
  if (activeGroupId === groupId) {
    sessionRefCount += 1;
    return;
  }
  activeGroupId = groupId;
  sessionRefCount = 1;
  emitSessionOpen(groupId);
};

/** Grup ekranından çıkarken çağrılır (arka plana düşünce de önerilir). */
export const closeSession = () => {
  sessionRefCount = Math.max(0, sessionRefCount - 1);
  if (sessionRefCount > 0) return; // Session'ı kullanan başka ekran var

  activeGroupId = null;
  useAppStore.getState().clearSession();
  if (socket?.connected) {
    socket.emit("session:close", {}, () => {});
  }
};

/**
 * Durum paylaş — aktif session'daki gruba işlenir, groupId gönderilmez.
 * Rate limit: 10 istek / 10 sn. Önce session açık olmalıdır.
 */
export const updateStatus = (input: StatusUpdateInput): Promise<StatusEntry> =>
  new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error("Socket bağlantısı yok"));
      return;
    }
    socket.emit(
      "status:update",
      input,
      (res: SocketAck<{ status: StatusEntry }>) => {
        if (res.ok) resolve(res.status);
        else reject(new Error(res.error));
      },
    );
  });

export const disconnectSocket = () => {
  activeGroupId = null;
  sessionRefCount = 0;
  appStateSubscription?.remove();
  appStateSubscription = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  useAppStore.getState().clearSession();
};

export const getSocket = () => socket;
