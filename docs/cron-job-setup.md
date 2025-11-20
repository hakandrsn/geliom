# Supabase Cron Job Kurulumu

## Process Pending Notifications Cron Job

`process-pending-notifications` Edge Function'ını her dakika çalıştırmak için Supabase cron job kurulumu:

### 1. Supabase Dashboard'dan Kurulum

1. Supabase Dashboard → Database → Cron Jobs
2. "New Cron Job" butonuna tıkla
3. Aşağıdaki ayarları yap:

**Job Name:** `process-pending-notifications`

**Schedule:** `* * * * *` (Her dakika)

**Command:**
```sql
SELECT net.http_post(
  url := 'https://jtqmntczxkdmftoqspdx.supabase.co/functions/v1/process-pending-notifications',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

**NOT:** 
- `YOUR_PROJECT_REF` → Supabase proje referansınız
- `YOUR_SERVICE_ROLE_KEY` → Supabase Service Role Key (Settings → API)

### 2. Alternatif: pg_cron Extension Kullanımı

Eğer Supabase Dashboard'da cron job özelliği yoksa, `pg_cron` extension'ını kullanabilirsiniz:

```sql
-- pg_cron extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron job oluştur
SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *', -- Her dakika
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-pending-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 3. Cron Job Kontrolü

Cron job'un çalışıp çalışmadığını kontrol etmek için:

```sql
-- Aktif cron job'ları listele
SELECT * FROM cron.job;

-- Cron job geçmişini görüntüle
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-pending-notifications')
ORDER BY start_time DESC 
LIMIT 10;
```

### 4. Cron Job'u Durdurma

```sql
-- Cron job'u durdur
SELECT cron.unschedule('process-pending-notifications');
```

### 5. Test

Cron job'un çalıştığını test etmek için:

1. Bir kullanıcı status'unu değiştir
2. `pending_notifications` tablosunda kayıt oluştuğunu kontrol et
3. 1 dakika sonra kaydın silindiğini ve bildirimin gönderildiğini kontrol et

### 6. Edge Function URL

Edge Function URL'ini bulmak için:
- Supabase Dashboard → Edge Functions → `process-pending-notifications`
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-pending-notifications`

