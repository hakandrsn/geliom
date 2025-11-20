# Status Bildirim Sistemi

## Genel Bakış

Status değişikliğinde grup üyelerine bildirim gönderilir. Bildirimler kuyruğa alınır ve minimum 1 dakika sonra gönderilir.

## Özellikler

1. **Kuyruk Sistemi:** Status değişikliğinde bildirim hemen gönderilmez, kuyruğa alınır
2. **Debounce Pattern:** Kullanıcı sürekli status değiştirirse, sadece son status için bildirim gönderilir
3. **Mesaj Sistemi:** Her status için özelleştirilebilir mesajlar (messages array)
4. **Placeholder Desteği:** `{name}` ve `{group}` placeholder'ları desteklenir
5. **Rate Limiting:** 1 dakika içinde aynı alıcıya tekrar bildirim gönderilmez

## Veritabanı Yapısı

### statuses Tablosu
- `messages TEXT[]` - Bildirim mesajları (rastgele seçilecek)

### pending_notifications Tablosu
- `id UUID PK`
- `sender_id UUID FK` - Status değiştiren kullanıcı
- `receiver_ids UUID[]` - Grup üyeleri (kendisi hariç)
- `group_id UUID FK`
- `status_id INT FK`
- `scheduled_at TIMESTAMPTZ` - Gönderilecek zaman (created_at + 1 dakika)
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`
- Unique constraint: `(sender_id, group_id)` - Bir kullanıcının aynı grup için sadece 1 pending bildirimi

## Akış

1. **Status Değişikliği:**
   - Kullanıcı status'unu değiştirir
   - `useSetUserStatus` hook'u çalışır
   - Status güncellenir
   - Eğer `notifies: true` ise:
     - Grup üyeleri bulunur (kendisi hariç)
     - `pending_notifications` tablosuna kayıt eklenir/güncellenir
     - `scheduled_at = NOW() + 1 dakika`

2. **Bildirim Gönderme (Cron Job):**
   - Her dakika `process-pending-notifications` Edge Function çalışır
   - `scheduled_at <= NOW()` olan kayıtlar bulunur
   - Her kayıt için:
     - Status mesajlarından rastgele bir mesaj seçilir
     - Placeholder'lar değiştirilir (`{name}`, `{group}`)
     - `send-notification` Edge Function'ı çağrılır
     - Rate limiting kontrolü yapılır
     - Bildirim gönderilir
     - Kayıt silinir

## Mesaj Formatı

### Placeholder'lar
- `{name}` → Kullanıcı adı (display_name veya custom_user_id)
- `{group}` → Grup adı

### Örnek Mesajlar
```json
[
  "{name} artık müsait!",
  "{name} şimdi müsait durumda",
  "{name} {group} grubunda müsait oldu"
]
```

### Default Mesaj
Eğer `messages` array'i boşsa veya yoksa:
```
"{name} durumunu güncelledi"
```

## Debounce Mantığı

- Kullanıcı status değiştirdiğinde:
  - Eğer mevcut bir `pending_notification` varsa → UPDATE (scheduled_at güncellenir)
  - Yoksa → INSERT
- Unique constraint sayesinde bir kullanıcının aynı grup için sadece 1 pending bildirimi olabilir
- Sürekli status değiştirirse, sadece son status için bildirim gönderilir

## Rate Limiting

- `send-notification` Edge Function'ında rate limiting kontrolü yapılır
- Status update için 1 dakika limit
- Eğer rate limit aşıldıysa:
  - `scheduled_at` 1 dakika sonraya güncellenir
  - Bir sonraki cron job'da tekrar denenecek

## Dosyalar

- `docs/database-migration-status-notifications.sql` - Database migration
- `api/statuses.ts` - Status güncelleme ve pending notification oluşturma
- `supabase/functions/process-pending-notifications/index.ts` - Cron job Edge Function
- `supabase/functions/send-notification/index.ts` - Bildirim gönderme (mevcut)
- `types/database.ts` - TypeScript type tanımları
- `docs/cron-job-setup.md` - Cron job kurulum rehberi

## Test Senaryoları

1. ✅ Status değiştir → 1 dakika sonra bildirim gönder
2. ✅ Status değiştir → 30 saniye sonra tekrar değiştir → Sadece son status için bildirim gönder
3. ✅ Sürekli tıklama → Sadece son status için bildirim gönder
4. ✅ Mesaj placeholder'ları doğru değiştirilsin
5. ✅ `notifies: false` olan status'ler için bildirim gönderilmesin
6. ✅ Farklı gruplarda status değiştir → Her grup için ayrı bildirim

