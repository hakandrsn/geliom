import Constants from "expo-constants";
import { OneSignal } from "react-native-onesignal";

// OneSignal App ID - app.json'dan al
const ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.oneSignalAppId;

// OneSignal initialization state
let isOneSignalInitialized = false;
let isOneSignalSDKInitialized = false; // SDK initialize edildi mi (synchronous)
let pendingExternalId: string | null = null; // Subscription oluşunca login yapmak için bekleyen external ID
let initializationPromise: Promise<void> | null = null;

// OneSignal SDK'yı synchronous olarak initialize et (Permission istenmeden önce)
export const initializeOneSignalSDK = (): void => {
  if (isOneSignalSDKInitialized) {
    return; // Zaten initialize edilmiş, sessizce dön
  }

  try {
    if (!ONESIGNAL_APP_ID) {
      console.warn("⚠️ OneSignal App ID bulunamadı!");
      return;
    }

    OneSignal.initialize(ONESIGNAL_APP_ID);
    isOneSignalSDKInitialized = true;
    console.log("✅ OneSignal başlatıldı");
  } catch (error) {
    console.error("❌ OneSignal başlatma hatası:", error);
  }
};

// OneSignal'i tam olarak initialize et (Permission + Event listeners)
export const initializeOneSignal = async (): Promise<void> => {
  // SDK'yı önce initialize et
  initializeOneSignalSDK();

  // Eğer zaten tam initialization yapıldıysa, mevcut promise'i döndür
  if (isOneSignalInitialized && initializationPromise) {
    return initializationPromise;
  }

  // Yeni initialization promise'i oluştur
  initializationPromise = (async () => {
    try {
      // Notification permission iste
      const granted = await OneSignal.Notifications.requestPermission(false);

      if (granted) {
        // Permission verildiyse Player ID'yi kontrol et
        // Biraz bekle, subscription oluşması için (iOS'ta özellikle gerekli)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const playerId = await getOneSignalPlayerId();
        if (playerId) {
          // Eğer bekleyen bir external ID varsa, hemen login yap
          if (pendingExternalId) {
            console.log(
              "🔵 Permission verildi, bekleyen external ID ile login yapılıyor:",
              pendingExternalId,
            );
            const externalId = pendingExternalId;
            pendingExternalId = null; // Temizle
            try {
              await performOneSignalLogin(externalId, playerId, 3, 1000);
            } catch (error) {
              console.error(
                "❌ Otomatik login hatası (permission sonrası):",
                error,
              );
              // Hata olsa bile pendingExternalId'yi tekrar set et, subscription change listener tekrar denesin
              pendingExternalId = externalId;
            }
          }
        }
      } else {
        console.warn(
          "⚠️ OneSignal permission reddedildi - bildirimler çalışmayacak",
        );
      }

      // NOT: Notification click listener NotificationHandler component'inde yönetiliyor
      // Burada duplicate listener eklemiyoruz

      // Notification alındığında (foreground'da)
      OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        (event: any) => {
          console.log(
            "🔔 OneSignal notification received in foreground:",
            event,
          );
          // Bildirimi göster (otomatik gösterilir, burada sadece log)
        },
      );

      // Push subscription değişikliklerini dinle
      OneSignal.User.pushSubscription.addEventListener(
        "change",
        async (subscription) => {
          const playerId = await getOneSignalPlayerId();
          if (playerId) {
            // Eğer bekleyen bir external ID varsa, login yap
            if (pendingExternalId) {
              const externalId = pendingExternalId;
              pendingExternalId = null; // Temizle
              try {
                await performOneSignalLogin(externalId, playerId, 3, 1000);
              } catch (error) {
                console.error(
                  "❌ Otomatik login hatası (subscription change):",
                  error,
                );
                // Hata olsa bile pendingExternalId'yi tekrar set et, bir sonraki subscription change'de tekrar denesin
                pendingExternalId = externalId;
              }
            }
          }
        },
      );

      // Başarıyla initialize edildi
      isOneSignalInitialized = true;
    } catch (error) {
      console.error("❌ OneSignal initialize hatası:", error);
      isOneSignalInitialized = false;
      initializationPromise = null;
      throw error;
    }
  })();
  return initializationPromise;
};

// OneSignal Player ID'yi al
export const getOneSignalPlayerId = async (): Promise<string | null> => {
  try {
    // Yeni API kullan: getIdAsync() - deprecated olmayan method
    const pushSubscriptionId =
      await OneSignal.User.pushSubscription.getIdAsync();
    return pushSubscriptionId || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ OneSignal Player ID alınamadı:", errorMessage);
    return null;
  }
};

// Kullanıcıya tag ekle (segmentasyon için)
export const setOneSignalTags = (tags: Record<string, string>) => {
  try {
    OneSignal.User.addTags(tags);
  } catch (error) {
    console.error("Error setting OneSignal tags:", error);
  }
};

// Kullanıcı tag'lerini güncelle
export const updateOneSignalTags = (tags: Record<string, string>) => {
  try {
    OneSignal.User.addTags(tags);
  } catch (error) {
    console.error("Error updating OneSignal tags:", error);
  }
};

// OneSignal login işlemini gerçekleştir (internal helper function)
// Retry mekanizması ile login başarı kontrolü yapar
const performOneSignalLogin = async (
  externalId: string,
  playerId: string | null,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<void> => {
  let lastError: Error | null = null;

  // Retry mekanizması ile login dene
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // OneSignal.login() async bir işlem olabilir, await edelim
      await OneSignal.login(externalId);

      // Login sonrası external ID'yi doğrula (OneSignal SDK v5'te getExternalId mevcut)
      // Biraz bekle, SDK'nın internal state'ini güncellemesi için
      await new Promise((resolve) => setTimeout(resolve, 500));

      // External ID'yi alias olarak ekle
      try {
        await OneSignal.User.addAlias("auth_id", externalId);
        await OneSignal.User.addTags({
          auth_id: externalId,
          player_id: playerId || "unknown",
        });
      } catch (error) {
        // Sessizce devam et
      }

      return; // Başarılı, çık
    } catch (error: any) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ OneSignal login denemesi ${attempt}/${maxRetries} başarısız:`,
        errorMessage,
      );

      // Son deneme değilse, bekle ve tekrar dene
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Tüm denemeler başarısız oldu
  console.error("❌ OneSignal login tüm denemeler başarısız oldu:", lastError);
  throw new Error(
    `OneSignal login başarısız (${maxRetries} deneme): ${lastError?.message || "Bilinmeyen hata"}`,
  );
};

// Kullanıcıyı OneSignal'e login et (external ID ile - Supabase auth ID)
// Player ID hazır olana kadar bekler (push subscription oluşmalı)
export const loginOneSignal = async (
  externalId: string,
  maxRetries: number = 10,
  delay: number = 1000,
): Promise<void> => {
  try {
    // OneSignal'in initialize edilip edilmediğini kontrol et
    if (!isOneSignalInitialized) {
      await initializeOneSignal();
    }

    // Player ID hazır olana kadar bekle
    let playerId: string | null = null;
    for (let i = 0; i < maxRetries; i++) {
      playerId = await getOneSignalPlayerId();
      if (playerId) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!playerId) {
      // Player ID yoksa, subscription oluşunca login yapmak için external ID'yi kaydet
      pendingExternalId = externalId;
      return;
    }

    // Player ID hazırsa, login yap
    await performOneSignalLogin(externalId, playerId, 3, 1000);
  } catch (error) {
    console.error("❌ OneSignal login hatası:", error);
    throw error;
  }
};

// Kullanıcıyı OneSignal'den logout et
export const logoutOneSignal = () => {
  try {
    OneSignal.logout();
  } catch (error) {
    console.error("Error logging out OneSignal:", error);
  }
};
