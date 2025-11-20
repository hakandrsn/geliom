# OneSignal Bildirim Sorun Giderme Rehberi

## Test Bildirimi Gelmiyorsa Kontrol Edilecekler

### 1. OneSignal SDK Initialization

**Kontrol:**
- Uygulama başladığında console'da şu log'lar görünmeli:
  - `🔵 OneSignal initialize ediliyor, App ID: ...`
  - `✅ OneSignal permission granted: true`
  - `✅ OneSignal Player ID: ...`

**Sorun:** Log'lar görünmüyorsa
- `app/Provider.tsx` içinde `initializeOneSignal()` çağrılıyor mu kontrol et
- `services/onesignal.ts` dosyasında hata var mı kontrol et

### 2. Player ID Kaydediliyor mu?

**Kontrol:**
- Kullanıcı login olduktan sonra console'da şu log görünmeli:
  - `✅ OneSignal Player ID kaydedildi: ...`
- Supabase `users` tablosunda `onesignal_player_id` kolonu dolu mu kontrol et

**Sorun:** Player ID kaydedilmiyorsa
- `contexts/AuthContext.tsx` içinde `savePlayerId` fonksiyonu çalışıyor mu kontrol et
- Retry mekanizması çalışıyor mu kontrol et (5 deneme, 1 saniye aralık)

### 3. OneSignal Dashboard'dan Test Bildirimi

**Kontrol:**
- OneSignal Dashboard → Messages → New Push
- **Target Audience:** 
  - "Send to Specific Users" seç
  - Player ID'yi manuel olarak gir (users tablosundan al)
- **Message:** Test mesajı
- **Send**

**Sorun:** Bildirim gelmiyorsa
- Player ID doğru mu kontrol et
- OneSignal App ID doğru mu kontrol et (`app.json` içinde)
- OneSignal REST API Key doğru mu kontrol et (Supabase Edge Function environment variable)

### 4. Edge Function'dan Bildirim Gönderme

**Kontrol:**
- Supabase Edge Function log'larını kontrol et:
  - `🔵 OneSignal API çağrısı yapılıyor: ...`
  - `✅ OneSignal bildirim gönderildi: ...`
- OneSignal API response'u kontrol et:
  - `recipients` sayısı > 0 olmalı
  - `errors` boş olmalı

**Sorun:** Edge Function hatası varsa
- OneSignal REST API Key doğru mu kontrol et
- Player ID'ler doğru mu kontrol et
- OneSignal App ID doğru mu kontrol et

### 5. Notification Permission

**Kontrol:**
- iOS: Settings → Geliom → Notifications → Allow Notifications
- Android: Settings → Apps → Geliom → Notifications → Allow

**Sorun:** Permission verilmemişse
- Uygulama ilk açıldığında permission isteği çıkmalı
- Eğer çıkmıyorsa, `services/onesignal.ts` içinde `requestPermission` çağrısı kontrol et

### 6. Device Token / Push Subscription

**Kontrol:**
- OneSignal Dashboard → Audience → Devices
- Cihazınız listede görünüyor mu?
- Push Subscription aktif mi?

**Sorun:** Cihaz listede yoksa
- OneSignal SDK düzgün initialize edilmiş mi kontrol et
- Permission verilmiş mi kontrol et
- Internet bağlantısı var mı kontrol et

### 7. Debug Log'ları

**Kontrol:**
- Console'da şu log'lar görünmeli:
  - `🔵 OneSignal initialize ediliyor...`
  - `✅ OneSignal permission granted: true`
  - `✅ OneSignal Player ID: ...`
  - `✅ OneSignal login yapıldı, external ID: ...`
  - `✅ OneSignal Player ID kaydedildi: ...`

**Sorun:** Log'lar görünmüyorsa
- Console'u açık tut
- Uygulamayı yeniden başlat
- Log'ları kontrol et

## Yaygın Sorunlar ve Çözümleri

### Sorun 1: Player ID null geliyor

**Çözüm:**
- OneSignal SDK'nın tam initialize olmasını bekle
- Retry mekanizması zaten var (5 deneme, 1 saniye aralık)
- Eğer hala null geliyorsa, permission verilmiş mi kontrol et

### Sorun 2: Bildirim gönderiliyor ama gelmiyor

**Çözüm:**
- OneSignal Dashboard → Messages → Delivery Reports kontrol et
- Hata mesajı var mı kontrol et
- Player ID doğru mu kontrol et
- Cihaz internet bağlantısı var mı kontrol et

### Sorun 3: Edge Function hatası

**Çözüm:**
- Supabase Edge Function log'larını kontrol et
- OneSignal REST API Key doğru mu kontrol et
- Environment variable'lar doğru mu kontrol et

### Sorun 4: iOS'ta bildirim gelmiyor

**Çözüm:**
- iOS entitlements doğru mu kontrol et (`app.json`)
- APNs sertifikası OneSignal'de yapılandırılmış mı kontrol et
- Production build'de test et (development build'de APNs çalışmayabilir)

### Sorun 5: Android'de bildirim gelmiyor

**Çözüm:**
- Google Services dosyası (`google-services.json`) doğru mu kontrol et
- Firebase Cloud Messaging (FCM) yapılandırılmış mı kontrol et
- OneSignal Dashboard'da Android platform aktif mi kontrol et

## Test Adımları

1. **Uygulamayı aç**
   - Console'da OneSignal initialize log'larını kontrol et
   - Permission isteği çıkmalı

2. **Login ol**
   - Console'da Player ID kaydedildi log'unu kontrol et
   - Supabase users tablosunda `onesignal_player_id` kontrol et

3. **OneSignal Dashboard'dan test bildirimi gönder**
   - Player ID'yi kullanarak manuel bildirim gönder
   - Bildirim gelmeli

4. **Edge Function'dan test bildirimi gönder**
   - `send-notification` Edge Function'ını çağır
   - Log'ları kontrol et
   - Bildirim gelmeli

## Debug Komutları

### Player ID'yi Console'da Görmek

```typescript
import { getOneSignalPlayerId } from '@/services/onesignal';

getOneSignalPlayerId().then((playerId) => {
  console.log('Player ID:', playerId);
});
```

### OneSignal Subscription Durumunu Kontrol Etmek

```typescript
import { OneSignal } from 'react-native-onesignal';

OneSignal.User.pushSubscription.getOptedInAsync().then((optedIn) => {
  console.log('Opted in:', optedIn);
});

OneSignal.User.pushSubscription.getIdAsync().then((id) => {
  console.log('Subscription ID:', id);
});
```

