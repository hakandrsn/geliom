# Rate Limiting Implementasyonu - Tamamlandı ✅

## 📋 Yapılanlar

### 1. Veritabanı
- ✅ `notification_rate_limits` tablosu SQL migration dosyası oluşturuldu
- ✅ `check_rate_limit` database function oluşturuldu
- ✅ `cleanup_old_rate_limits` temizleme function'ı oluşturuldu
- ✅ Index'ler eklendi (performans için)

**Dosya:** `docs/database-rate-limiting-migration.sql`

### 2. Edge Function
- ✅ `send-notification` Edge Function'a rate limiting eklendi
- ✅ Supabase client entegrasyonu
- ✅ Rate limit kontrolü (her alıcı için)
- ✅ HTTP 429 (Too Many Requests) response
- ✅ Bekleme süresi bilgisi döndürülüyor

**Dosya:** `supabase/functions/send-notification/index.ts`

### 3. API Layer
- ✅ `api/notifications.ts` güncellendi
- ✅ `sender_id` ve `receiver_ids` parametreleri eklendi
- ✅ Rate limit hatası handling eklendi
- ✅ `api/groups.ts`'deki bildirim çağrıları güncellendi

**Dosyalar:**
- `api/notifications.ts`
- `api/groups.ts`

## 🚀 Kurulum Adımları

### 1. Veritabanı Migration'ı Çalıştır
Supabase SQL Editor'de `docs/database-rate-limiting-migration.sql` dosyasını çalıştır:

```sql
-- Tablo oluştur
-- Function'lar oluştur
-- Index'ler oluştur
```

### 2. Edge Function Environment Variables
Supabase Dashboard'da Edge Function environment variables ekle:

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

(Bu değişkenler genellikle otomatik olarak mevcuttur)

### 3. Edge Function Deploy
```bash
supabase functions deploy send-notification
```

## ⏱️ Rate Limit Kuralları

| Bildirim Tipi | Limit | Süre |
|--------------|-------|------|
| `join_request` | 1 istek | 5 dakika |
| `join_request_status` | 1 bildirim | 1 dakika |
| `direct_invite` | 1 davet | 10 dakika |
| `status_update` | 1 bildirim | 1 dakika |
| `mood_update` | 1 bildirim | 1 dakika |
| `event_reminder` | 1 bildirim | 60 dakika |

## 🔧 Nasıl Çalışır?

1. **Bildirim Gönderme İsteği:**
   - Client `sendNotification` fonksiyonunu çağırır
   - `sender_id` ve `receiver_ids` parametreleri gönderilir

2. **Edge Function Kontrolü:**
   - `check_rate_limit` database function'ı çağrılır
   - Son gönderim zamanı kontrol edilir
   - Limit aşıldıysa HTTP 429 döndürülür

3. **Rate Limit Aşıldığında:**
   - HTTP 429 (Too Many Requests) response
   - `wait_until` ve `wait_seconds` bilgisi döndürülür
   - Client'da hata mesajı gösterilir

4. **Rate Limit Aşılmadığında:**
   - Bildirim gönderilir
   - `notification_rate_limits` tablosu güncellenir
   - Başarılı response döndürülür

## 📝 Notlar

- Rate limiting sadece `sender_id` ve `receiver_ids` gönderildiğinde aktif
- Sistem bildirimleri (event_reminder) için rate limiting daha uzun (60 dakika)
- Eski kayıtlar 24 saat sonra otomatik temizlenir
- Rate limit kontrolü non-blocking (hata olsa bile bildirim gönderilmeye çalışılır)

## 🧪 Test

1. Aynı kullanıcıya 2 kez hızlıca bildirim gönder
2. İkinci istekte HTTP 429 hatası alınmalı
3. Bekleme süresi sonrası tekrar denemeli

## 🔄 Sonraki Adımlar

- [ ] Realtime güncellemeleri ekle
- [ ] Client-side'da rate limit hatası için UI iyileştirmesi
- [ ] Rate limit aşımı için analytics/logging

