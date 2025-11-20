# Rate Limiting Planı - Bildirim Spam Önleme

## 🎯 Amaç
Kullanıcıların sürekli bildirim göndermesini önlemek ve sistem kaynaklarını korumak.

## 📋 Rate Limit Kuralları

### 1. Katılma İsteği Gönderme
- **Limit:** Aynı kullanıcı aynı gruba **5 dakikada bir** istek gönderebilir
- **Kontrol Yeri:** 
  - Client-side: `useCreateJoinRequest` hook'unda
  - Server-side: Database constraint (zaten var - UNIQUE constraint)
- **Hata Mesajı:** "Bu gruba yeni bir istek göndermek için 5 dakika beklemeniz gerekiyor"

### 2. Bildirim Gönderme (OneSignal)
- **Limit:** Aynı gönderen aynı alıcıya **1 dakikada bir** bildirim gönderebilir
- **Kontrol Yeri:** Edge Function (`send-notification`)
- **Hata Mesajı:** "Çok sık bildirim gönderiyorsunuz. Lütfen 1 dakika bekleyin"

### 3. Kullanıcı Arama ve Direkt Davet
- **Limit:** Aynı gönderen aynı alıcıya **10 dakikada bir** davet gönderebilir
- **Kontrol Yeri:** 
  - Client-side: `useCreateJoinRequest` hook'unda (davet gönderirken)
  - Server-side: Database'de rate limit kontrolü
- **Hata Mesajı:** "Bu kullanıcıya yeni bir davet göndermek için 10 dakika beklemeniz gerekiyor"

## 🗄️ Veritabanı Yapısı

### `notification_rate_limits` Tablosu
```sql
CREATE TABLE public.notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'join_request',
    'join_request_status',
    'direct_invite',
    'status_update',
    'mood_update',
    'event_reminder'
  )),
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id, group_id, notification_type)
);

-- Index'ler
CREATE INDEX idx_rate_limits_sender_receiver ON notification_rate_limits(sender_id, receiver_id);
CREATE INDEX idx_rate_limits_group ON notification_rate_limits(group_id);
CREATE INDEX idx_rate_limits_type ON notification_rate_limits(notification_type);
CREATE INDEX idx_rate_limits_last_sent ON notification_rate_limits(last_sent_at);
```

## 🔧 Implementasyon Stratejisi

### 1. Edge Function'da Rate Limiting
- `send-notification` Edge Function'ında kontrol
- Database'den son gönderim zamanını kontrol et
- Limit aşıldıysa hata döndür
- Limit aşılmadıysa kayıt güncelle/oluştur

### 2. Client-Side Kontrol (UX için)
- Hızlı geri bildirim için
- Server-side kontrolü geçemez (güvenlik için)

### 3. Database Function (Opsiyonel)
- Rate limit kontrolü için helper function
- Otomatik temizleme (eski kayıtları sil)

## ⏱️ Zaman Limitleri

| İşlem | Limit | Süre |
|-------|-------|------|
| Katılma İsteği | 1 istek | 5 dakika |
| Bildirim Gönderme | 1 bildirim | 1 dakika |
| Direkt Davet | 1 davet | 10 dakika |

## 🚨 Hata Yönetimi

### Rate Limit Aşıldığında
1. **Edge Function:** HTTP 429 (Too Many Requests) döndür
2. **Client:** Kullanıcıya anlaşılır mesaj göster
3. **Log:** Rate limit aşımını logla (analytics için)

### Kullanıcı Deneyimi
- Kalan süreyi göster (örn: "3 dakika 45 saniye sonra tekrar deneyebilirsiniz")
- Toast mesajı ile bilgilendir
- Buton'u disable et (kalan süre boyunca)

## 🔄 Temizleme Stratejisi

### Otomatik Temizleme
- 24 saatten eski kayıtları otomatik sil
- Cron job veya database function ile
- Performans için gerekli

## 📝 Notlar

- Rate limiting sadece bildirim gönderme için değil, spam önleme için de kullanılır
- Farklı bildirim tipleri için farklı limitler olabilir
- Premium kullanıcılar için daha yüksek limitler düşünülebilir (gelecekte)

