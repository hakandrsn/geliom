# Supabase Edge Function Secrets Kurulumu

## OneSignal REST API Key Ekleme

Edge Function'ların çalışması için OneSignal REST API Key'i Supabase Secrets'a eklenmelidir.

### Adımlar

1. **OneSignal Dashboard'dan REST API Key'i al:**
   - OneSignal Dashboard → Settings → Keys & IDs
   - **REST API Key**'i kopyala

2. **Supabase Dashboard'a git:**
   - Supabase Dashboard → Edge Functions → Settings → Secrets

3. **Secret ekle:**
   - **Name:** `ONESIGNAL_REST_API_KEY`
   - **Value:** OneSignal REST API Key (kopyaladığın değer)
   - **Save**

4. **Diğer gerekli secrets:**
   - `ONESIGNAL_APP_ID` - OneSignal App ID (zaten var olabilir)
   - `SUPABASE_URL` - Otomatik eklenir
   - `SUPABASE_SERVICE_ROLE_KEY` - Otomatik eklenir

### Kontrol

Edge Function log'larında şu hata görünmemeli:
```
❌ ONESIGNAL_REST_API_KEY environment variable eksik!
```

Eğer görünüyorsa, secret'ı eklediğinden emin ol.

### Test

Edge Function'ı test et:
- Supabase Dashboard → Edge Functions → `send-notification` → Test
- Body'ye test payload'ı ekle
- Invoke et
- Log'ları kontrol et

## SQL Fonksiyonu Güncelleme

`check_rate_limit` fonksiyonunu güncellemek için:

1. Supabase Dashboard → SQL Editor
2. `docs/database-rate-limiting-migration.sql` dosyasındaki `check_rate_limit` fonksiyonunu çalıştır
3. Fonksiyon güncellenecek

### Değişiklikler

- `RETURNS TABLE`'dan `last_sent_at` kaldırıldı (ambiguous hatası için)
- Sadece `can_send` ve `wait_until` döndürüyor
- SELECT'te tablo alias kullanılıyor (`nrl.last_sent_at`)

