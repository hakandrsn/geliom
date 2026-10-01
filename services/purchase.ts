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
 * Premium'un TEK doğruluk kaynağı backend'deki user.isPremium'dur (Adapty
 * webhook'u ile güncellenir; sunucu limitleri buna göre uygular). Adapty
 * profili yalnızca "webhook gecikti mi?" sinyali olarak kullanılır: Adapty
 * aktif diyor ama backend değilse backend birkaç kez yoklanır.
 */
export const syncPremiumFromBackend = async (
  retries = 5,
  delayMs = 2000,
): Promise<boolean> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data } = await apiClient.get<User>("/users/me");
      useAppStore.getState().setUser(data);
      if (data.isPremium) return true;
    } catch (error) {
      console.error("Premium sync error", error);
    }
    if (attempt < retries - 1) await sleep(delayMs);
  }
  return false;
};

const adaptyHasActiveAccess = async (): Promise<boolean> => {
  const profile = await adapty.getProfile();
  return Object.values(profile.accessLevels || {}).some((l) => l.isActive);
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

export const checkSubscription = async (): Promise<boolean> => {
  if (!isAdaptyActivated && !isAdaptyActivating) {
    await activateAdapty();
  }

  try {
    const adaptyActive = await adaptyHasActiveAccess();
    const backendPremium = !!useAppStore.getState().user?.isPremium;

    if (adaptyActive && !backendPremium) {
      // Webhook henüz işlenmemiş olabilir — backend'i kısa süre yokla
      return syncPremiumFromBackend(3, 2000);
    }
    return backendPremium;
  } catch (error) {
    console.error("Check subscription error", error);
    return !!useAppStore.getState().user?.isPremium;
  }
};

export type RestoreResult = "restored" | "none" | "offline" | "error";

/**
 * "Bulunamadı" ile "kontrol edilemedi" ayrı döner: bağlantı hatasında
 * kullanıcıya yanlışlıkla "aboneliğin yok" denmesin.
 */
export const restorePurchases = async (): Promise<RestoreResult> => {
  const net = await NetInfo.fetch();
  if (net.isConnected === false || net.isInternetReachable === false) {
    return "offline";
  }

  try {
    if (!isAdaptyActivated) await activateAdapty();
    if (!isAdaptyActivated) return "error";

    const profile = await adapty.restorePurchases();
    const storeActive = Object.values(profile.accessLevels || {}).some(
      (l) => l.isActive,
    );
    if (!storeActive) return "none";

    // Mağaza aboneliği doğruladı; sunucuya yansımasını bekle
    return (await syncPremiumFromBackend()) ? "restored" : "error";
  } catch (error) {
    console.error("Restore error", error);
    return "error";
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
