# Bildirim Sistemi - Geliom

## 📋 Genel Bakış

Geliom projesinde bildirimler **OneSignal** kullanılarak gönderilir. Bildirimler grup bazlıdır ve her bildirimde grup bilgisi bulunur.

## 🎯 Bildirim Formatı

### Title Formatı
```
[Grup Adı] - [Bildirim Başlığı]
```

**Örnek:**
- `Aile Grubu - Yeni Katılma İsteği`
- `İş Arkadaşları - Durum Güncellendi`

### Body Formatı
```
[Grup Adı] grubundan: [Mesaj]
```

**Örnek:**
- `Aile Grubu grubundan: Ahmet grubunuza katılmak istiyor`
- `İş Arkadaşları grubundan: Mehmet durumunu "Toplantıda" olarak güncelledi`

### Additional Data
Her bildirimde şu bilgiler gönderilir:
```json
{
  "group_id": "uuid",
  "group_name": "Grup Adı",
  "type": "join_request" | "join_request_status" | "status_update" | "mood_update" | "event_reminder"
}
```

## 🔔 Bildirim Türleri

### 1. Katılma İsteği (join_request)
- **Gönderen:** İstek yapan kullanıcı
- **Alıcı:** Grup sahibi
- **Başlık:** `Yeni Katılma İsteği`
- **Mesaj:** `[Kullanıcı Adı] grubunuza katılmak istiyor`

### 2. Katılma İsteği Durumu (join_request_status)
- **Gönderen:** Grup sahibi
- **Alıcı:** İstek yapan kullanıcı
- **Başlık:** `Katılma İsteği Onaylandı` veya `Katılma İsteği Reddedildi`
- **Mesaj:** `[Grup Adı] grubuna katılma isteğiniz onaylandı!` veya `[Grup Adı] grubuna katılma isteğiniz reddedildi.`

### 3. Durum Güncellemesi (status_update)
- **Gönderen:** Durum güncelleyen kullanıcı
- **Alıcı:** Grup üyeleri
- **Başlık:** `Durum Güncellendi`
- **Mesaj:** `[Kullanıcı Adı] durumunu "[Durum]" olarak güncelledi`

### 4. Mood Güncellemesi (mood_update)
- **Gönderen:** Mood güncelleyen kullanıcı
- **Alıcı:** Grup üyeleri
- **Başlık:** `Mood Güncellendi`
- **Mesaj:** `[Kullanıcı Adı] mood'unu "[Mood]" olarak güncelledi`

### 5. Etkinlik Hatırlatıcısı (event_reminder)
- **Gönderen:** Sistem (zamanlanmış)
- **Alıcı:** Grup üyeleri
- **Başlık:** `Etkinlik Hatırlatıcısı`
- **Mesaj:** `[Etkinlik Adı] için 1 saat kaldı!`

## 📱 Bildirime Tıklama Davranışı

Kullanıcı bir bildirime tıkladığında:

1. **NotificationHandler** component'i bildirimi yakalar
2. `additionalData`'dan `group_id` ve `group_name` alınır
3. **GroupContext** kullanılarak ilgili grup seçilir
4. Kullanıcı **ana sayfaya** (`/(drawer)/home`) yönlendirilir
5. Seçili grup otomatik olarak gösterilir

## 🏗️ Mimari

### 1. OneSignal Servisi (`services/onesignal.ts`)
- OneSignal SDK initialize
- Player ID alma
- Login/Logout işlemleri
- Tag yönetimi

### 2. Notification Handler (`components/NotificationHandler.tsx`)
- Bildirim tıklama event'lerini dinler
- Grup seçimi ve navigation yapar
- GroupContext ve Router kullanır

### 3. Bildirim API (`api/notifications.ts`)
- Supabase Edge Function'ı çağırır
- Farklı bildirim türleri için helper fonksiyonlar
- Type-safe bildirim gönderme

### 4. Supabase Edge Function (`supabase/functions/send-notification/index.ts`)
- OneSignal REST API'yi çağırır
- Bildirim formatını oluşturur
- CORS desteği

## 🔧 Entegrasyon Noktaları

### Grup Katılma İsteği
- **Dosya:** `api/groups.ts`
- **Hook:** `useCreateJoinRequest`
- **Bildirim:** Grup sahibine katılma isteği bildirimi

### İstek Onaylama/Reddetme
- **Dosya:** `api/groups.ts`
- **Hook'lar:** `useApproveJoinRequest`, `useRejectJoinRequest`
- **Bildirim:** İstek yapan kullanıcıya durum bildirimi

## ⚙️ Kurulum

### 1. OneSignal App ID
`app.json` dosyasında tanımlı:
```json
{
  "extra": {
    "oneSignalAppId": "dbee675a-f056-44f4-8cfc-77075183897d"
  }
}
```

### 2. Supabase Edge Function Environment Variables
```bash
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-rest-api-key
```

### 3. Edge Function Deploy
```bash
supabase functions deploy send-notification
```

## 📝 Notlar

- Bildirim gönderme işlemleri **non-blocking**'dir (hata olsa bile uygulama çalışmaya devam eder)
- Player ID'ler kullanıcı giriş yaptığında otomatik olarak kaydedilir
- Bildirimler grup bazlıdır, her bildirimde grup bilgisi bulunur
- Bildirime tıklandığında kullanıcı ilgili gruba yönlendirilir

