# OneSignal Sorun Giderme Checklist

## Sorun 1: Edge Function 403 Forbidden Hatası

### Hata
```
Access denied. Please include an 'Authorization: ...' header with a valid API key
```

### Çözüm

1. **OneSignal Dashboard'dan REST API Key'i al:**
   - OneSignal Dashboard → Settings → Keys & IDs
   - **REST API Key**'i kopyala (uzun bir string, örn: `YjA3...`)

2. **Supabase Dashboard'a git:**
   - Supabase Dashboard → Project → Edge Functions → Settings → Secrets

3. **Secret ekle/güncelle:**
   - **Name:** `ONESIGNAL_REST_API_KEY`
   - **Value:** OneSignal REST API Key (kopyaladığın değer)
   - **Save**

4. **Edge Function'ı yeniden deploy et:**
   ```bash
   supabase functions deploy send-notification
   ```

5. **Kontrol:**
   - Edge Function log'larında `ONESIGNAL_REST_API_KEY: ✅ Set` görünmeli
   - `ONESIGNAL_REST_API_KEY_LENGTH` 0'dan büyük olmalı

### Not
- REST API Key, OneSignal App ID'den farklıdır
- REST API Key, OneSignal Dashboard → Settings → Keys & IDs'den alınır
- Secret'ı ekledikten sonra Edge Function'ı yeniden deploy etmek gerekebilir

## Sorun 2: OneSignal Dashboard'da User Görünmüyor

### Kontrol Listesi

1. **OneSignal SDK Initialize Edildi mi?**
   - Console'da `✅ OneSignal SDK initialize edildi` görünmeli
   - Eğer görünmüyorsa, app'i yeniden başlat

2. **Permission Verildi mi?**
   - Console'da `✅ OneSignal permission granted: true` görünmeli
   - Eğer `false` ise, cihaz ayarlarından bildirim izni ver

3. **Player ID Oluştu mu?**
   - Console'da `✅ OneSignal Player ID hazır: <id>` görünmeli
   - Eğer görünmüyorsa, permission verildikten sonra 2-3 saniye bekle

4. **Login Yapıldı mı?**
   - Console'da `✅ OneSignal login başarılı, external ID ayarlandı: <id>` görünmeli
   - Eğer görünmüyorsa, app'i yeniden başlat veya logout/login yap

5. **OneSignal Dashboard'da Kontrol:**
   - OneSignal Dashboard → Audience → All Users
   - External ID ile ara (Supabase auth ID)
   - Veya Player ID ile ara

### Debug Adımları

1. **App'i tamamen kapat ve yeniden aç**
2. **Login yap**
3. **Console log'larını kontrol et:**
   ```
   🔵 OneSignal initialize ediliyor
   ✅ OneSignal SDK initialize edildi
   ✅ OneSignal permission granted: true
   ✅ OneSignal Player ID hazır: <id>
   🔵 OneSignal login yapılıyor, external ID: <id>
   ✅ OneSignal login başarılı
   ✅ OneSignal alias eklendi
   ✅ OneSignal tags eklendi
   ```

4. **Eğer Player ID görünmüyorsa:**
   - Permission verildikten sonra 2-3 saniye bekle
   - Push subscription change listener çalışacak
   - Console'da `🔔 OneSignal push subscription changed` görünmeli

5. **Eğer login yapılmıyorsa:**
   - `pendingExternalId` mekanizması çalışıyor olmalı
   - Subscription oluşunca otomatik login yapılacak
   - Console'da `🔵 Bekleyen external ID var, otomatik login yapılıyor` görünmeli

### iOS Özel Notlar

- iOS'ta permission verildikten sonra subscription oluşması biraz zaman alabilir
- Test cihazında APNs sertifikası doğru yapılandırılmış olmalı
- Development build'de sandbox APNs kullanılır, production build'de production APNs

### Android Özel Notlar

- Android'de FCM (Firebase Cloud Messaging) yapılandılmış olmalı
- `google-services.json` dosyası doğru yapılandırılmış olmalı
- OneSignal App ID ve FCM Server Key doğru yapılandırılmış olmalı

## Test

1. **Edge Function Test:**
   - Supabase Dashboard → Edge Functions → `send-notification` → Test
   - Body'ye test payload'ı ekle
   - Invoke et
   - Log'ları kontrol et

2. **OneSignal Dashboard Test:**
   - OneSignal Dashboard → Messages → New Push
   - Test kullanıcısına bildirim gönder
   - Bildirim geliyorsa, user oluşmuş demektir

