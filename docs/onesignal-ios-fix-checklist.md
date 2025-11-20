# OneSignal iOS Bildirim Sorun Giderme Checklist

## Hızlı Kontrol Listesi

### ✅ 1. Player ID ile Test Bildirimi Gönder

**OneSignal Dashboard:**
1. Messages → New Push
2. **Target Audience:** "Send to Specific Users"
3. **Player ID'yi girin:** `3cf0f9f5-fa07-4c20-af84-14b220633160` (log'lardan)
   - ⚠️ **ÖNEMLİ:** External ID değil, Player ID kullanın!
4. Mesaj gönder

### ✅ 2. OneSignal Dashboard'da Cihazı Kontrol Et

1. Audience → Devices
2. External ID ile arayın: `da9ed634-9b37-4812-b12d-ed9333c7310f`
3. Cihazınız listede görünüyor mu?
4. Push Subscription aktif mi? (Status: Subscribed)

### ✅ 3. iOS APNs Yapılandırması

**OneSignal Dashboard:**
1. Settings → Platforms → iOS
2. **APNs Authentication Key** veya **APNs Certificate** yapılandırılmış mı?
3. Eğer yoksa:
   - Apple Developer Portal'dan APNs Key oluşturun
   - OneSignal'e yükleyin

### ✅ 4. Build Type Kontrolü

**Development build'de APNs çalışmayabilir:**
- Production build'de test edin:
  ```bash
  eas build --platform ios --profile production
  ```

### ✅ 5. Notification Permission

**iOS Settings:**
1. Settings → Geliom → Notifications
2. "Allow Notifications" açık mı?
3. "Lock Screen", "Notification Center", "Banners" açık mı?

### ✅ 6. Uygulama Durumu

**iOS'ta bildirimler:**
- Uygulama arka plandayken gelir
- Uygulama kapalıyken gelir
- Uygulama açıkken (foreground) gelmeyebilir (NotificationHandler log'larını kontrol edin)

### ✅ 7. OneSignal API Response Kontrolü

**OneSignal Dashboard:**
1. Messages → Delivery Reports
2. Gönderdiğiniz bildirimin durumunu kontrol edin
3. Hata mesajı var mı?
4. "Delivered" sayısı > 0 mı?

## Test Adımları

### Adım 1: Player ID'yi Doğrula

Log'lardan Player ID'yi alın:
```
✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160
```

### Adım 2: OneSignal Dashboard'dan Test

1. Messages → New Push
2. "Send to Specific Users" → Player ID'yi yapıştır
3. "Test" mesajı gönder
4. Delivery Reports'ta durumu kontrol et

### Adım 3: Uygulama Durumunu Kontrol Et

- Uygulamayı arka plana alın (home button'a basın)
- Bildirim gelmeli
- Notification Center'ı kontrol edin

### Adım 4: Console Log'larını Kontrol Et

Uygulama açıkken bildirim gelirse:
```
🔔 OneSignal notification received in foreground: ...
```

Uygulama kapalıyken bildirim gelirse:
- Notification Center'da görünmeli
- Bildirime tıklayınca uygulama açılmalı

## Yaygın Sorunlar

### Sorun 1: "Invalid Player ID"
- **Çözüm:** Player ID'yi doğru kopyaladığınızdan emin olun
- Log'lardan: `✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160`

### Sorun 2: "No devices found"
- **Çözüm:** 
  - Audience → Devices'da cihazı kontrol edin
  - External ID ile arayın: `da9ed634-9b37-4812-b12d-ed9333c7310f`
  - Push Subscription aktif mi kontrol edin

### Sorun 3: iOS'ta bildirim gelmiyor
- **Çözüm:**
  1. APNs sertifikası yapılandırılmış mı kontrol edin
  2. Production build'de test edin
  3. Settings → Geliom → Notifications kontrol edin
  4. Uygulamayı arka plana alın

### Sorun 4: Bildirim gönderiliyor ama gelmiyor
- **Çözüm:**
  1. Delivery Reports'ta durumu kontrol edin
  2. Hata mesajı var mı kontrol edin
  3. Uygulama durumunu kontrol edin (arka planda mı?)
  4. Internet bağlantısı var mı kontrol edin

## Hızlı Test

1. **Player ID'yi al:** `3cf0f9f5-fa07-4c20-af84-14b220633160`
2. **OneSignal Dashboard:** Messages → New Push → "Send to Specific Users" → Player ID
3. **Mesaj gönder:** "Test bildirimi"
4. **Uygulamayı arka plana al**
5. **Bildirim gelmeli**

## Debug Komutları

### Player ID'yi Console'da Görmek

Uygulama açıkken console'da:
```
✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160
```

### OneSignal Subscription Durumunu Kontrol Etmek

OneSignal Dashboard:
- Audience → Devices
- External ID ile arayın: `da9ed634-9b37-4812-b12d-ed9333c7310f`
- Push Subscription durumunu kontrol edin

