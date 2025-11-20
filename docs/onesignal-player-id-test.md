# OneSignal Player ID Test Rehberi

## Durum

OneSignal Dashboard'da:
- **OneSignal ID:** `b1616121-90b5-4cb0-a3ee-9e18f2d6907c` (Dashboard'dan)
- **External ID:** Görünmüyor (bu normal, kod güncellendi, bir sonraki login'de görünecek)

Log'lardan:
- **Player ID:** `3cf0f9f5-fa07-4c20-af84-14b220633160` (Uygulama log'larından)

## Önemli Not

**Player ID'ler farklı olabilir!** Bu normal çünkü:
- Her cihaz/abonelik için farklı Player ID oluşur
- Uygulama yeniden yüklendiğinde yeni Player ID oluşabilir
- Her zaman **en güncel Player ID'yi kullanın**

## Test Bildirimi Gönderme

### Yöntem 1: OneSignal Dashboard'dan (Player ID ile)

1. **OneSignal Dashboard → Messages → New Push**
2. **Target Audience:** "Send to Specific Users"
3. **Player ID'yi girin:**
   - Dashboard'dan: `b1616121-90b5-4cb0-a3ee-9e18f2d6907c`
   - Veya log'lardan: `3cf0f9f5-fa07-4c20-af84-14b220633160`
4. **Mesaj gönder**

### Yöntem 2: En Güncel Player ID'yi Bulma

**Uygulama açıkken console'da:**
```
✅ OneSignal Player ID: 3cf0f9f5-fa07-4c20-af84-14b220633160
```

**Supabase'den:**
```sql
SELECT id, display_name, onesignal_player_id 
FROM users 
WHERE id = 'da9ed634-9b37-4812-b12d-ed9333c7310f';
```

**OneSignal Dashboard:**
- Audience → Devices
- Cihazınızı bulun
- Player ID'yi kopyalayın

## External ID Görünmüyor - Çözüm

Kod güncellendi, artık:
1. `OneSignal.login()` async olarak çalışıyor
2. `OneSignal.User.addAlias()` ile alias ekleniyor
3. Bir sonraki login'de external ID görünecek

**Test için:**
1. Uygulamayı kapatın
2. Tekrar açın ve login olun
3. OneSignal Dashboard → Audience → Devices
4. External ID görünmeli: `da9ed634-9b37-4812-b12d-ed9333c7310f`

## Hızlı Test

1. **En güncel Player ID'yi al:**
   - Console log'larından: `3cf0f9f5-fa07-4c20-af84-14b220633160`
   - Veya Supabase'den: `onesignal_player_id` kolonunu kontrol et

2. **OneSignal Dashboard:**
   - Messages → New Push
   - "Send to Specific Users" → Player ID'yi yapıştır
   - "Test" mesajı gönder

3. **Uygulamayı arka plana al** (iOS'ta bildirimler arka plandayken gelir)

4. **Bildirim gelmeli**

## Sorun Devam Ediyorsa

1. **Player ID'yi doğrula:**
   - Console log'larından en güncel Player ID'yi al
   - Supabase'de `onesignal_player_id` kolonunu kontrol et
   - OneSignal Dashboard'da cihazı bul ve Player ID'yi kontrol et

2. **OneSignal Dashboard → Delivery Reports:**
   - Bildirimin durumunu kontrol et
   - Hata mesajı var mı?
   - "Delivered" sayısı > 0 mı?

3. **iOS APNs yapılandırması:**
   - OneSignal Dashboard → Settings → Platforms → iOS
   - APNs Authentication Key veya Certificate yapılandırılmış mı?

4. **Build type:**
   - Development build'de APNs çalışmayabilir
   - Production build'de test et

