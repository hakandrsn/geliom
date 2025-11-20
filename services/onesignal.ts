import Constants from 'expo-constants';
import { OneSignal } from 'react-native-onesignal';

// OneSignal App ID - app.json'dan al
const ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.oneSignalAppId;

// OneSignal initialization state
let isOneSignalInitialized = false;
let pendingExternalId: string | null = null; // Subscription oluşunca login yapmak için bekleyen external ID
let initializationPromise: Promise<void> | null = null;

// OneSignal'i initialize et (Promise döndürür)
export const initializeOneSignal = async (): Promise<void> => {
  // Eğer zaten initialize edildiyse, mevcut promise'i döndür
  if (isOneSignalInitialized && initializationPromise) {
    return initializationPromise;
  }

  // Yeni initialization promise'i oluştur
  initializationPromise = (async () => {
    try {
      console.log('🔵 OneSignal initialize ediliyor, App ID:', ONESIGNAL_APP_ID);
      
      // OneSignal'i initialize et
      OneSignal.initialize(ONESIGNAL_APP_ID);
      console.log('✅ OneSignal SDK initialize edildi');
      isOneSignalInitialized = true;

      // Notification permission iste
      const granted = await OneSignal.Notifications.requestPermission(false);
      console.log('✅ OneSignal permission granted:', granted);
      
      if (granted) {
        // Permission verildiyse Player ID'yi kontrol et
        // Biraz bekle, subscription oluşması için (iOS'ta özellikle gerekli)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const playerId = await getOneSignalPlayerId();
        if (playerId) {
          console.log('✅ OneSignal Player ID hazır:', playerId);
          
          // Push subscription bilgilerini log'la
          try {
            const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
            const pushToken = await OneSignal.User.pushSubscription.getTokenAsync();
            console.log('✅ OneSignal Push Subscription ID:', subscriptionId);
            console.log('✅ OneSignal Push Token:', pushToken ? 'Mevcut' : 'Yok');
            
            // Eğer bekleyen bir external ID varsa, hemen login yap
            if (pendingExternalId) {
              console.log('🔵 Permission verildi, bekleyen external ID ile login yapılıyor:', pendingExternalId);
              const externalId = pendingExternalId;
              pendingExternalId = null; // Temizle
              try {
                await performOneSignalLogin(externalId, playerId, 3, 1000);
              } catch (error) {
                console.error('❌ Otomatik login hatası (permission sonrası):', error);
                // Hata olsa bile pendingExternalId'yi tekrar set et, subscription change listener tekrar denesin
                pendingExternalId = externalId;
              }
            }
          } catch (subError) {
            console.warn('⚠️ OneSignal subscription bilgileri alınamadı:', subError);
          }
        } else {
          console.log('⏳ OneSignal Player ID henüz hazır değil, subscription oluşması bekleniyor...');
        }
      } else {
        console.warn('⚠️ OneSignal permission reddedildi - bildirimler çalışmayacak');
      }

    // Notification açıldığında (kullanıcı bildirime tıkladığında)
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('🔔 OneSignal notification clicked:', event);
      // Burada navigation yapılabilir
      // event.notification.additionalData ile custom data'ya erişilebilir
    });

    // Notification alındığında (foreground'da)
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('🔔 OneSignal notification received in foreground:', event);
      // Bildirimi göster (otomatik gösterilir, burada sadece log)
    });

      // Push subscription değişikliklerini dinle
      OneSignal.User.pushSubscription.addEventListener('change', async (subscription) => {
        console.log('🔔 OneSignal push subscription changed');
        const playerId = await getOneSignalPlayerId();
        if (playerId) {
          console.log('✅ Yeni Player ID:', playerId);
          
          // Eğer bekleyen bir external ID varsa (kullanıcı login ama subscription henüz oluşmamışsa), login yap
          if (pendingExternalId) {
            console.log('🔵 Bekleyen external ID var, otomatik login yapılıyor:', pendingExternalId);
            const externalId = pendingExternalId;
            pendingExternalId = null; // Temizle
            try {
              await performOneSignalLogin(externalId, playerId, 3, 1000);
            } catch (error) {
              console.error('❌ Otomatik login hatası (subscription change):', error);
              // Hata olsa bile pendingExternalId'yi tekrar set et, bir sonraki subscription change'de tekrar denesin
              pendingExternalId = externalId;
            }
          }
        }
      });

      console.log('✅ OneSignal initialize tamamlandı');
    } catch (error) {
      console.error('❌ OneSignal initialize hatası:', error);
      isOneSignalInitialized = false;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

// Kullanıcının OneSignal Player ID'sini al (Push Subscription ID)
export const getOneSignalPlayerId = async (): Promise<string | null> => {
  try {
    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
    return subscriptionId;
  } catch (error) {
    console.error('Error getting OneSignal player ID:', error);
    return null;
  }
};

// Kullanıcıya tag ekle (segmentasyon için)
export const setOneSignalTags = (tags: Record<string, string>) => {
  try {
    OneSignal.User.addTags(tags);
  } catch (error) {
    console.error('Error setting OneSignal tags:', error);
  }
};

// Kullanıcı tag'lerini güncelle
export const updateOneSignalTags = (tags: Record<string, string>) => {
  try {
    OneSignal.User.addTags(tags);
  } catch (error) {
    console.error('Error updating OneSignal tags:', error);
  }
};

// OneSignal login işlemini gerçekleştir (internal helper function)
// Retry mekanizması ile login başarı kontrolü yapar
const performOneSignalLogin = async (
  externalId: string, 
  playerId: string | null,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<void> => {
  console.log('🔵 OneSignal login işlemi başlatılıyor:', {
    externalId,
    playerId: playerId || 'Yok',
    maxRetries,
  });

  let lastError: Error | null = null;
  
  // Retry mekanizması ile login dene
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔵 OneSignal login denemesi ${attempt}/${maxRetries}...`);
      
      // OneSignal.login() async bir işlem olabilir, await edelim
      await OneSignal.login(externalId);
      
      // Login sonrası external ID'yi doğrula (OneSignal SDK v5'te getExternalId mevcut)
      // Biraz bekle, SDK'nın internal state'ini güncellemesi için
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const currentExternalId = await OneSignal.User.getExternalId();
        if (currentExternalId === externalId) {
          console.log('✅ OneSignal login başarılı, external ID doğrulandı:', externalId);
        } else {
          console.warn(`⚠️ OneSignal login yapıldı ama external ID eşleşmedi. Beklenen: ${externalId}, Mevcut: ${currentExternalId || 'Yok'}`);
          // Eşleşmese bile devam et, belki SDK henüz güncellemedi
        }
      } catch (verifyError) {
        console.warn('⚠️ External ID doğrulama hatası (non-blocking):', verifyError);
        // Doğrulama hatası olsa bile devam et
      }
      
      // External ID'yi alias olarak da ekleyelim (Dashboard'da görünmesi için)
      // OneSignal SDK v5'te external ID'yi alias olarak eklemek daha güvenilir
      try {
        await OneSignal.User.addAlias('supabase_auth_id', externalId);
        console.log('✅ OneSignal alias eklendi (supabase_auth_id):', externalId);
      } catch (aliasError) {
        console.warn('⚠️ OneSignal alias ekleme hatası (non-blocking):', aliasError);
      }
      
      // User properties'leri de güncelle (Dashboard'da görünmesi için)
      try {
        await OneSignal.User.addTags({
          'supabase_auth_id': externalId,
          'player_id': playerId || 'unknown',
        });
        console.log('✅ OneSignal tags eklendi');
      } catch (tagsError) {
        console.warn('⚠️ OneSignal tags ekleme hatası (non-blocking):', tagsError);
      }
      
      // Push subscription bilgilerini log'la
      try {
        const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
        const pushToken = await OneSignal.User.pushSubscription.getTokenAsync();
        console.log('✅ OneSignal Push Subscription ID:', subscriptionId);
        console.log('✅ OneSignal Push Token:', pushToken ? 'Mevcut' : 'Yok');
      } catch (subError) {
        console.warn('⚠️ OneSignal subscription bilgileri alınamadı:', subError);
      }
      
      console.log('✅ OneSignal login işlemi tamamlandı');
      return; // Başarılı, çık
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ OneSignal login denemesi ${attempt}/${maxRetries} başarısız:`, error);
      
      // Son deneme değilse, bekle ve tekrar dene
      if (attempt < maxRetries) {
        console.log(`⏳ ${retryDelay}ms sonra tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  // Tüm denemeler başarısız oldu
  console.error('❌ OneSignal login tüm denemeler başarısız oldu:', lastError);
  throw new Error(`OneSignal login başarısız (${maxRetries} deneme): ${lastError?.message || 'Bilinmeyen hata'}`);
};

// Kullanıcıyı OneSignal'e login et (external ID ile - Supabase auth ID)
// Player ID hazır olana kadar bekler (push subscription oluşmalı)
export const loginOneSignal = async (externalId: string, maxRetries: number = 10, delay: number = 1000): Promise<void> => {
  try {
    console.log('🔵 OneSignal login yapılıyor, external ID (Supabase auth ID):', externalId);
    
    // OneSignal'in initialize edilip edilmediğini kontrol et
    if (!isOneSignalInitialized) {
      console.log('⏳ OneSignal henüz initialize edilmemiş, bekleniyor...');
      await initializeOneSignal();
    }
    
    // Player ID hazır olana kadar bekle (push subscription oluşmalı)
    let playerId: string | null = null;
    for (let i = 0; i < maxRetries; i++) {
      playerId = await getOneSignalPlayerId();
      if (playerId) {
        console.log('✅ OneSignal Player ID hazır:', playerId);
        break;
      }
      console.log(`⏳ OneSignal Player ID henüz hazır değil, ${delay}ms sonra tekrar deneniyor... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (!playerId) {
      console.warn('⚠️ OneSignal Player ID alınamadı, subscription oluşması bekleniyor...');
      // Player ID yoksa, subscription oluşunca login yapmak için external ID'yi kaydet
      pendingExternalId = externalId;
      console.log('⏳ Subscription oluşunca otomatik login yapılacak');
      return; // Subscription change listener login yapacak
    }
    
    // Player ID hazırsa, login yap (retry mekanizması performOneSignalLogin içinde)
    await performOneSignalLogin(externalId, playerId, 3, 1000);
    
    // Login başarılı olduktan sonra external ID'yi tekrar doğrula
    try {
      const verifiedExternalId = await OneSignal.User.getExternalId();
      if (verifiedExternalId === externalId) {
        console.log('✅ OneSignal login ve external ID doğrulama başarılı');
      } else {
        console.warn(`⚠️ OneSignal login yapıldı ama external ID doğrulama başarısız. Beklenen: ${externalId}, Mevcut: ${verifiedExternalId || 'Yok'}`);
      }
    } catch (verifyError) {
      console.warn('⚠️ OneSignal external ID doğrulama hatası (non-blocking):', verifyError);
    }
  } catch (error) {
    console.error('❌ OneSignal login hatası:', error);
    throw error;
  }
};

// Kullanıcıyı OneSignal'den logout et
export const logoutOneSignal = () => {
  try {
    OneSignal.logout();
  } catch (error) {
    console.error('Error logging out OneSignal:', error);
  }
};

