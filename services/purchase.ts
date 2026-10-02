import { apiClient } from "@/api/client";
import type { User } from "@/api/types";
import { appConfig } from "@/config/app.config";
import { useAppStore } from "@/store/useAppStore";
import NetInfo from "@react-native-community/netinfo";
import { Linking } from "react-native";
import { FIRST_SUBSCRIPTION_PLACEMENT } from "@/constants/adapty";
import { adapty, createPaywallView } from "react-native-adapty";

// const FIRST_SUBSCRIPTION_PLACEMENT = "PLACEMENT_ID"; // If constant file missing

let isAdaptyActivated = false;
let isAdaptyActivating = false;
let activationPromise: Promise<void> | null = null;
// let paywallViewRef: any | null = null;

export const activateAdapty = async (): Promise<void> => {
  if (isAdaptyActivated) return;
  if (isAdaptyActivating && activationPromise) return activationPromise;

  isAdaptyActivating = true;

  activationPromise = (async () => {
    const key = appConfig.adaptySdkKey;
    if (!key) {
      console.warn("Adapty key missing");
      isAdaptyActivating = false;
      return;
    }

    try {
      await adapty.activate(key, { lockMethodsUntilReady: false });
      isAdaptyActivated = true;
      console.log("✅ Adapty activated");
    } catch (error) {
      // Native SDK zaten aktif (Metro yeniden yüklemesi JS bayrağını sıfırlar,
      // native taraf aktif kalır) — bu bir hata değil, aktif say.
      if ((error as { adaptyCode?: string })?.adaptyCode === "activateOnceError") {
        isAdaptyActivated = true;
      } else {
        console.error("Adapty activation error", error);
      }
    } finally {
      isAdaptyActivating = false;
    }
  })();

  return activationPromise;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Premium'un TEK kaynağı Adapty'dir; sunucu onu `/users/me/premium/sync` ile
 * Adapty server API'sinden okuyup users.isPremium'a ve sahibi olunan gruplara
 * yazar. Mobil premium'a kendi karar vermez — her zaman sunucunun döndürdüğü
 * kullanıcıyı store'a koyar (drawer, paywall kapısı, sunucu limitleri aynı
 * değeri görür).
 *
 * `expectPremium`: satın alma / geri yükleme sonrası Adapty'nin sunucu
 * tarafına yansıması birkaç saniye sürebilir; bu sürede yeniden denenir.
 */
export const syncPremiumFromBackend = async (
  retries = 5,
  delayMs = 2000,
  expectPremium = true,
): Promise<boolean> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data } = await apiClient.post<User>("/users/me/premium/sync");
      useAppStore.getState().setUser(data);
      if (data.isPremium || !expectPremium) return data.isPremium;
    } catch (error) {
      console.error("Premium sync error", error);
    }
    if (attempt < retries - 1) await sleep(delayMs);
  }
  return !!useAppStore.getState().user?.isPremium;
};

/**
 * Adapty profilini Firebase UID'ye bağlar. Webhook'lar `customer_user_id`
 * alanıyla gelir; sunucu kullanıcıyı buradan tanır. Bu çağrı olmadan satın
 * alma ya da panelden verilen erişim sunucuda premium'u AÇMAZ.
 */
export const identifyAdapty = async (userId: string): Promise<void> => {
  if (!isAdaptyActivated) await activateAdapty();
  if (!isAdaptyActivated) return;
  try {
    await adapty.identify(userId);
  } catch (error) {
    console.warn("Adapty identify başarısız", error);
  }
};

/** Çıkışta profili ayır — sonraki kullanıcı öncekinin aboneliğini görmesin. */
export const logoutAdapty = async (): Promise<void> => {
  if (!isAdaptyActivated) return;
  try {
    await adapty.logout();
  } catch (error) {
    console.warn("Adapty logout başarısız", error);
  }
};

/** Açılışta: sunucuyu Adapty ile eşitle (tek istek, bekleme yok). */
export const checkSubscription = async (): Promise<boolean> =>
  syncPremiumFromBackend(1, 0, false);

export type RestoreStatus = "restored" | "none" | "pending" | "offline" | "error";

export interface RestoreResult {
  status: RestoreStatus;
  /** "error" durumunda gerçek sebep (geliştirmede kullanıcıya gösterilir) */
  error?: unknown;
}

/**
 * Her sonuç ayrı döner — kullanıcıya yanlış sebep söylenmesin:
 *  - none:    mağaza da Adapty de aktif erişim görmüyor
 *  - pending: mağaza/Adapty aktif diyor ama sunucu henüz işlemedi
 *  - offline: bağlantı yok
 *  - error:   SDK / mağaza hatası (sebep `error`da)
 */
export const restorePurchases = async (): Promise<RestoreResult> => {
  const net = await NetInfo.fetch();
  // isInternetReachable ilk anda null/false gelebilir; yalnızca bağlantı yoksa çevrimdışı say
  if (net.isConnected === false) return { status: "offline" };

  try {
    if (!isAdaptyActivated) await activateAdapty();
    if (!isAdaptyActivated) return { status: "error", error: new Error("Adapty etkin değil") };

    const profile = await adapty.restorePurchases();
    const storeActive = Object.values(profile.accessLevels || {}).some((l) => l.isActive);

    // Sunucu her durumda Adapty ile eşitlenir — panelden verilen erişim de buradan gelir
    const backendPremium = await syncPremiumFromBackend(storeActive ? 5 : 1, 2000, storeActive);
    if (backendPremium) return { status: "restored" };
    return { status: storeActive ? "pending" : "none" };
  } catch (error) {
    console.error("Restore error", error);
    // Mağaza hatası olsa bile sunucu Adapty'den premium görebilir
    if (await syncPremiumFromBackend(1, 0, false)) return { status: "restored" };
    return { status: "error", error };
  }
};

// Simplified showPaywall for now
export interface ShowPaywallOptions {
  placementId?: string;
  onSuccess?: (purchase: any) => void;
  /** Satın alma başladıktan sonra başarısız oldu */
  onFailure?: (error: any) => void;
  /** Paywall hiç gösterilemedi (SDK key yok / aktivasyon veya yükleme hatası) */
  onUnavailable?: (error: unknown) => void;
}

export const showPaywall = async (options: ShowPaywallOptions = {}) => {
  const {
    placementId = FIRST_SUBSCRIPTION_PLACEMENT,
    onSuccess,
    onFailure,
    onUnavailable,
  } = options;

  try {
    if (!isAdaptyActivated) await activateAdapty();
    if (!isAdaptyActivated) {
      // Key yok veya aktivasyon başarısız — paywall açılamaz
      throw new Error("Adapty etkin değil");
    }

    const paywall = await adapty.getPaywall(placementId);
    const view = await createPaywallView(paywall);
    // paywallViewRef = view;

    view.setEventHandlers({
      onPurchaseCompleted: (purchase, product) => {
        (async () => {
          try {
            // Satın alma Adapty'de tamam; sunucunun webhook'u işlemesini bekle.
            // Sunucu premium'u görmeden onSuccess çağrılırsa aksiyon 409 alır.
            const backendPremium = await syncPremiumFromBackend();
            if (backendPremium) {
              onSuccess?.(purchase);
            } else {
              onFailure?.(
                new Error(
                  "Satın alma alındı, premium birkaç saniye içinde aktif olacak.",
                ),
              );
            }
          } catch (e) {
            console.error("Purchase handling error", e);
            onFailure?.(e);
          }
          view.dismiss();
        })();
        return true; // or whatever the expected return type is, often void or boolean
      },
      // Paywall çizilemedi ya da ürünler (fiyatlar) yüklenemedi — simülatörde,
      // ürünler App Store Connect'te hazır değilken ya da Paid Apps Agreement
      // eksikken olur. Boş paywall'u açık bırakmak yerine kapat ve sebebi bildir.
      onRenderingFailed: (error) => {
        console.warn("Paywall çizilemedi", error);
        onUnavailable?.(error);
        return true;
      },
      onLoadingProductsFailed: (error) => {
        console.warn("Paywall ürünleri yüklenemedi", error);
        onUnavailable?.(error);
        return true;
      },
      onPurchaseFailed: (error) => {
        onFailure?.(error);
        view.dismiss();
      },
      onPaywallClosed: () => {
        view.dismiss();
      },
      onUrlPress: (url) => {
        Linking.openURL(url);
        return false;
      },
    });

    await view.present();
  } catch (error) {
    console.warn("Paywall gösterilemedi", error);
    (onUnavailable ?? onFailure)?.(error);
  }
};
