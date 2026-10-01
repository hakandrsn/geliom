import { apiClient } from "@/api/client";
import type { User } from "@/api/types";
import { useUserGroups } from "@/api/groups";
import { useTheme } from "@/contexts/ThemeContext";
import {
  connectUserServices,
  disconnectUserServices,
} from "@/services/connection";
import { applyCrashReportsEnabled, loadCrashReportsEnabled } from "@/services/privacy";
import { checkSubscription, identifyAdapty } from "@/services/purchase";
import { useAppStore } from "@/store/useAppStore";
import auth from "@react-native-firebase/auth";
import { useFonts } from "expo-font";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import PremiumWelcomeModal from "@/components/monetization/PremiumWelcomeModal";
import { useEmojiPrefetch } from "@/hooks/useEmojiPrefetch";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "react-native";
import Provider from "./Provider";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://7bd324fc8f5518b0a53f4553d12624b6@o4511013855887360.ingest.de.sentry.io/4511709727359056',
  // Geliştirmede Sentry'ye event gönderme
  enabled: !__DEV__,

  // IP, e-posta gibi kişisel verileri otomatik ekleme
  sendDefaultPii: false,

  // console.* çıktıları Sentry'ye log olarak GİTMEZ — auth akışında token ve
  // e-posta içeren loglar vardı. Hata raporları ve breadcrumb'lar yeterli.
  enableLogs: false,

  // Configure Session Replay — metin ve görseller maskelenir
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
  ],
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

interface SyncUser {
  uid: string;
  displayName?: string | null;
  getIdToken: () => Promise<string>;
}

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  // Use Zustand store instead of Context
  const {
    user,
    firebaseUser,
    isLoading: authLoading,
    hasCompletedOnboarding,
    setFirebaseUser,
    setUser,
    setLoading,
    setError,
  } = useAppStore();

  // Fetch groups once authenticated
  const { refetch: refetchGroups } = useUserGroups();

  // Emoji görselleri girişten hemen sonra arka planda insin — grup ekranı hazır olsun
  useEmojiPrefetch(!!user);
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isSyncing = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Yeniden deneme zamanlayıcısı fonksiyonun güncel haline ref üzerinden ulaşır
  const syncRef = useRef<((u: SyncUser) => Promise<void>) | null>(null);
  // Firebase ilk auth cevabını verip backend sync denemesi tamamlanana kadar
  // yönlendirme yapılmaz — aksi halde girişli kullanıcı bir anlığına login görür.
  const [authResolved, setAuthResolved] = useState(false);

  const [fontsLoaded] = useFonts({
    "Figtree-Light": require("@/assets/fonts/Figtree-Light.ttf"),
    "Figtree-Regular": require("@/assets/fonts/Figtree-Regular.ttf"),
    "Figtree-Medium": require("@/assets/fonts/Figtree-Medium.ttf"),
    "Figtree-SemiBold": require("@/assets/fonts/Figtree-SemiBold.ttf"),
    "Figtree-Bold": require("@/assets/fonts/Figtree-Bold.ttf"),
  });

  // Backend Sync: Lazy Sync pattern — ilk doğrulanmış istekte kullanıcı
  // backend'de otomatik oluşturulur. Ağ hatasında 5 sn aralıkla yeniden dener;
  // kullanıcı bu sırada login DEĞİL, index (bağlanıyor) ekranında bekler.
  const syncWithBackend = useCallback(
    async (currentUser: SyncUser) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
        const response = await apiClient.get<User>("/users/me");
        let backendUser = response.data;

        // Apple girişinde ad token'da gelmez; Firebase profilinde varsa taşı
        if (!backendUser.displayName && currentUser.displayName) {
          try {
            const patched = await apiClient.patch<User>("/users/me", {
              displayName: currentUser.displayName,
            });
            backendUser = patched.data;
          } catch {
            // Ad senkronu kritik değil — bir sonraki açılışta tekrar denenir
          }
        }

        setUser(backendUser);
        setError(null);

        // Kendi API'miz (axios 10 sn timeout); boş-grup ekranı yanıp sönmesin diye beklenir
        await refetchGroups();

        // Socket + push: kullanıcı oturumuna bağlı canlı servisler tek noktadan
        connectUserServices({
          userId: currentUser.uid,
          getToken: () => currentUser.getIdToken(),
        });

        // Adapty'nin timeout'u yok — açılışı (splash) ASLA bekletmez, arka planda
        // çalışır. Profili kullanıcıya bağla (webhook customer_user_id), sonra
        // Adapty ile backend'i karşılaştır; webhook gecikmişse yokla.
        void (async () => {
          try {
            await identifyAdapty(currentUser.uid);
            await checkSubscription();
          } catch (e) {
            console.warn("Adapty senkronu başarısız", e);
          }
        })();
      } catch (error: any) {
        // Sunucu cevap verdiyse (4xx/5xx) kullanıcıya nedenini göster;
        // ağ hatasında genel mesaj. Her durumda 5 sn sonra yeniden denenir,
        // index ekranı bu sırada "Çıkış yap" seçeneği sunar.
        const status = error?.response?.status as number | undefined;
        setError(
          status
            ? `Sunucu hatası (${status}). Yeniden deneniyor…`
            : "Sunucuya ulaşılamıyor. Yeniden deneniyor…",
        );
        retryTimer.current = setTimeout(() => {
          void syncRef.current?.(currentUser);
        }, 5000);
      } finally {
        isSyncing.current = false;
      }
    },
    [setUser, setError, refetchGroups],
  );

  useEffect(() => {
    syncRef.current = syncWithBackend;
  }, [syncWithBackend]);

  // Güvenlik ağı: auth/font/navigasyon zinciri beklenmedik şekilde takılırsa
  // splash yine de kapanır — kullanıcı sonsuza kadar logoda kalmaz.
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 10000);
    return () => clearTimeout(t);
  }, []);

  // Gizlilik tercihi: kullanıcı hata raporlarını kapattıysa Sentry sussun
  useEffect(() => {
    loadCrashReportsEnabled().then(applyCrashReportsEnabled);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      setFirebaseUser(currentUser);

      if (currentUser) {
        await syncWithBackend(currentUser);
      } else {
        setUser(null);
        setError(null);
        disconnectUserServices();
      }

      setLoading(false);
      setAuthResolved(true);
    });

    return () => {
      unsubscribe();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [setFirebaseUser, setUser, setLoading, setError, syncWithBackend]);

  // Onboarding durumu sadece cihazda tutulur (store persist) — bkz. useAppStore

  // authResolved: Firebase'in "girişli mi?" cevabı gelmeden yönlendirme yapma —
  // store'daki isLoading false başladığı için tek başına güvenilir değil.
  const isLoading = authLoading || !fontsLoaded || !authResolved;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    const checkAuth = async () => {
      // 1. Firebase user check
      if (!firebaseUser) {
        if (!inAuthGroup) {
          setTimeout(() => router.replace("/(auth)/login"), 0);
        }
      }
      // 2. User data check (wait for backend user)
      else if (user) {
        if (!hasCompletedOnboarding) {
          if (!inOnboarding) {
            setTimeout(() => router.replace("/onboarding"), 0);
          }
        } else {
          // User is fully authed and boarded
          if (inAuthGroup || inOnboarding || !segments[0]) {
            setTimeout(() => router.replace("/(drawer)/home"), 0);
          }
        }
      }
      // 3. Firebase girişli ama backend sync bekliyor/başarısız — login
      // gösterme; index ekranı "bağlanılıyor" durumunu gösterir.
      else if (inAuthGroup || inOnboarding) {
        setTimeout(() => router.replace("/"), 0);
      }

      // Hide splash screen once we know what to do
      await SplashScreen.hideAsync();
    };

    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    checkAuth();
  }, [
    isLoading,
    segments,
    router,
    rootNavigationState?.key,
    firebaseUser,
    user,
    hasCompletedOnboarding,
  ]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent
      />
      <Slot />
      {/* Abonelik yeni başladığında bir kez — kendi tetiğini store'dan dinler */}
      <PremiumWelcomeModal />
    </>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <Provider>
      <RootLayoutContent />
    </Provider>
  );
});
