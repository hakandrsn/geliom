# OneSignal Test Bildirimi Gönderme Rehberi

## Önemli Notlar

### 1. Player ID vs External ID

**OneSignal Dashboard'dan test bildirimi gönderirken:**
- **Player ID kullanın** (External ID değil!)
- Player ID: `3cf0f9f5-fa07-4c20-af84-14b220633160` (log'lardan)
- External ID: `da9ed634-9b37-4812-b12d-ed9333c7310f` (Supabase auth ID - bu sadece kullanıcıyı bulmak için)

### 2. Test Bildirimi Gönderme Adımları

1. **OneSignal Dashboard'a gidin:**
   - https://dashboard.onesignal.com/
   - App'ınızı seçin

2. **Messages → New Push** tıklayın

3. **Target Audience:**
   - "Send to Specific Users" seçin
   - **Player ID'yi girin** (External ID değil!)
   - Player ID'yi bulmak için:
     - Log'lardan: `✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160`
     - Veya Supabase `users` tablosundan `onesignal_player_id` kolonunu kontrol edin

4. **Message:**
   - Başlık ve içerik girin
   - Test mesajı: "Test bildirimi"

5. **Send** butonuna tıklayın

### 3. iOS için Özel Kontroller

**iOS'ta bildirim gelmiyorsa:**

1. **APNs Sertifikası:**
   - OneSignal Dashboard → Settings → Platforms → iOS
   - APNs Authentication Key veya APNs Certificate yapılandırılmış olmalı
   - Production sertifikası kullanılıyorsa, production build'de test edin

2. **Build Type:**
   - Development build'de APNs çalışmayabilir
   - Production build'de test edin:
     ```bash
     eas build --platform ios --profile production
     ```

3. **Entitlements:**
   - `app.json` içinde `aps-environment: production` olmalı ✅ (zaten var)

4. **Notification Permission:**
   - Log'larda `✅ OneSignal permission granted: true` görünüyor ✅
   - Ama Settings → Geliom → Notifications kontrol edin

### 4. Debug Adımları

1. **Player ID'yi kontrol edin:**
   ```typescript
   // Console'da çalıştırın
   import { getOneSignalPlayerId } from '@/services/onesignal';
   getOneSignalPlayerId().then(console.log);
   ```

2. **OneSignal Dashboard'da cihazı kontrol edin:**
   - Audience → Devices
   - Cihazınız listede görünüyor mu?
   - Push Subscription aktif mi?

3. **OneSignal API Response'unu kontrol edin:**
   - Messages → Delivery Reports
   - Bildirimin durumunu kontrol edin
   - Hata mesajı var mı?

4. **Edge Function log'larını kontrol edin:**
   - Supabase Dashboard → Edge Functions → Logs
   - `send-notification` fonksiyonunun log'larını kontrol edin
   - OneSignal API response'unu kontrol edin

### 5. Yaygın Sorunlar

#### Sorun 1: "Invalid Player ID"
- **Çözüm:** Player ID'yi doğru kopyaladığınızdan emin olun
- Log'lardan Player ID'yi alın: `✅ OneSignal Player ID: ...`

#### Sorun 2: "No devices found"
- **Çözüm:** 
  - Cihazın OneSignal'e kayıtlı olduğundan emin olun
  - Audience → Devices'da cihazı kontrol edin
  - Push Subscription aktif mi kontrol edin

#### Sorun 3: iOS'ta bildirim gelmiyor
- **Çözüm:**
  - APNs sertifikası yapılandırılmış mı kontrol edin
  - Production build'de test edin
  - Settings → Geliom → Notifications → Allow Notifications

#### Sorun 4: Bildirim gönderiliyor ama gelmiyor
- **Çözüm:**
  - Internet bağlantısı var mı kontrol edin
  - Uygulama arka planda mı? (iOS'ta bildirimler arka planda gelir)
  - Notification Center'ı kontrol edin

### 6. Test Senaryoları

#### Senaryo 1: OneSignal Dashboard'dan Test
1. Player ID'yi log'lardan al
2. OneSignal Dashboard → Messages → New Push
3. "Send to Specific Users" → Player ID'yi gir
4. Mesaj gönder
5. Bildirim gelmeli

#### Senaryo 2: Edge Function'dan Test
1. Supabase Dashboard → Edge Functions → `send-notification`
2. Test butonuna tıkla
3. Body'ye şunu ekle:
   ```json
   {
     "user_ids": ["3cf0f9f5-fa07-4c20-af84-14b220633160"],
     "group_id": "test-group-id",
     "group_name": "Test Grubu",
     "title": "Test",
     "message": "Test bildirimi",
     "type": "status_update"
   }
   ```
4. Invoke et
5. Log'ları kontrol et
6. Bildirim gelmeli

### 7. Player ID'yi Bulma

**Yöntem 1: Log'lardan**
- Console'da: `✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160`

**Yöntem 2: Supabase'den**
```sql
SELECT id, display_name, onesignal_player_id 
FROM users 
WHERE id = 'da9ed634-9b37-4812-b12d-ed9333c7310f';
```

**Yöntem 3: OneSignal Dashboard**
- Audience → Devices
- External ID ile arayın: `da9ed634-9b37-4812-b12d-ed9333c7310f`
- Player ID'yi görün

### 8. Hızlı Test

1. **Player ID'yi al:**
   - Log'lardan: `3cf0f9f5-fa07-4c20-af84-14b220633160`

2. **OneSignal Dashboard:**
   - Messages → New Push
   - "Send to Specific Users" → Player ID'yi yapıştır
   - "Test" mesajı gönder

3. **Beklenen sonuç:**
   - Bildirim gelmeli
   - Console'da: `🔔 OneSignal notification received in foreground:` veya
   - Notification Center'da bildirim görünmeli

