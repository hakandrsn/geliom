# Faz 2: Grup Katılma Sistemi ve Bildirimler - Yapılacaklar Listesi

## 📋 Genel Bakış
Grup katılma onay sistemi ve bildirim altyapısını kurmak.

---

## 🗄️ 1. Veritabanı İşlemleri

### 1.1. `group_join_requests` Tablosu Oluşturma
- ✅ Supabase SQL Editor'de yeni tablo oluştur:
  ```sql
  CREATE TABLE public.group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, requester_id) -- Aynı kullanıcı aynı gruba tekrar istek gönderemez
  );
  ```
- [ ] RLS (Row Level Security) politikaları ekle:
  - [ ] Grup kurucusu tüm istekleri görebilir
  - [ ] İstek sahibi kendi isteklerini görebilir
  - [ ] İstek sahibi yeni istek oluşturabilir
  - [ ] Grup kurucusu istekleri onaylayıp reddedebilir
- [ ] Index'ler ekle (performans için):
  - [ ] `group_id` üzerinde index
  - [ ] `requester_id` üzerinde index
  - [ ] `status` üzerinde index

### 1.2. TypeScript Tipleri Güncelleme
- ✅ `types/database.ts` dosyasına `GroupJoinRequest` interface'i ekle
- ✅ `CreateGroupJoinRequest` ve `UpdateGroupJoinRequest` tiplerini ekle
- ✅ `GroupJoinRequestWithDetails` interface'i eklendi

---

## 🔍 2. Kullanıcı Arama ve Davet Sistemi

### 2.1. API Hook'ları
- ✅ `api/users.ts` dosyasına `useUserByCustomId` hook'u ekle (zaten mevcut)
- ✅ Custom user ID ile kullanıcı arama fonksiyonu yaz (zaten mevcut)

### 2.2. UI Component'leri
- ✅ **Ekran: Kullanıcı Arama Ekranı** (`app/(drawer)/(group)/search-user.tsx`)
  - ✅ Arama input'u (custom_user_id için)
  - ✅ Arama butonu
  - ✅ Bulunan kullanıcı kartı (display_name, custom_user_id, email)
  - ✅ Bulunan kullanıcıya davet gönderme butonu
  - ✅ Seçili grup bilgisi gösterimi
  - ✅ Grup seçilmedi uyarısı
  - ✅ Hata mesajları ve validasyon
- ✅ DashboardView'e "Kullanıcı Ara ve Davet Et" butonu eklendi (sadece owner için)

---

## 📝 3. Grup Katılma İsteği Gönderme

### 3.1. API Hook'ları
- ✅ `api/groups.ts` dosyasına şu hook'ları ekle:
  - ✅ `useCreateJoinRequest` - Katılma isteği gönderme
  - ✅ `useGroupJoinRequests` - Grup için bekleyen istekleri getirme
  - ✅ `useMyJoinRequests` - Kullanıcının gönderdiği istekleri getirme

### 3.2. UI Component'leri
- ✅ **Ekran: Grup Katılma Ekranı** (`app/(drawer)/(group)/join-group.tsx`)
  - ✅ Davet kodu input'u
  - ✅ "Katılma İsteği Gönder" butonu
  - ✅ Grup bilgisi gösterimi (kod geçerliyse)
  - ✅ Hata mesajları ve validasyon
- ✅ Ana ekranda "Gruba Katıl" butonu eklendi (EmptyStateView'de)

---

## ✅ 4. Grup Katılma İstekleri Yönetimi (Grup Kurucusu)

### 4.1. API Hook'ları
- ✅ `api/groups.ts` dosyasına şu hook'ları ekle:
  - ✅ `useApproveJoinRequest` - İsteği onaylama mutation
  - ✅ `useRejectJoinRequest` - İsteği reddetme mutation
  - ✅ `useGroupJoinRequests` - Grup için tüm istekleri getirme (owner için)

### 4.2. UI Component'leri
- ✅ **Ekran: Grup Katılma İstekleri** (`app/(drawer)/(group)/join-requests.tsx`)
  - ✅ Bekleyen istekler listesi (pending)
  - ✅ Her istek için:
    - ✅ Kullanıcı bilgileri (display_name, custom_user_id, photo_url)
    - ✅ İstek zamanı (created_at)
    - ✅ "Onayla" butonu
    - ✅ "Reddet" butonu
  - ✅ Empty state (istek yoksa)
  - ✅ Pull-to-refresh (yenileme)
  - ✅ Owner kontrolü (sadece owner görebilir)
  - ✅ Grup seçilmedi durumu
- ✅ DashboardView'e "Katılma İstekleri" butonu eklendi (sadece owner için, badge ile sayı gösterimi)
- ✅ DashboardView'e "Başka Gruba Katıl" butonu eklendi (her zaman görünür)

### 4.3. Backend Logic
- ✅ İstek onaylandığında:
  - ✅ `group_members` tablosuna yeni kayıt ekle (useApproveJoinRequest içinde)
  - ✅ İstek durumunu `approved` yap (useApproveJoinRequest içinde)
  - [ ] Kullanıcıya bildirim gönder (OneSignal) - Faz 2'nin sonunda
- ✅ İstek reddedildiğinde:
  - ✅ İstek durumunu `rejected` yap (useRejectJoinRequest içinde)
  - [ ] Kullanıcıya bildirim gönder (OneSignal) - Faz 2'nin sonunda

---

## 🔔 5. Bildirim Sistemi (OneSignal)

### 5.1. OneSignal SDK Entegrasyonu
- ✅ `package.json`'a `react-native-onesignal` paketini ekle
- ✅ OneSignal'ı initialize et (`app/Provider.tsx` ve `services/onesignal.ts`)
- ✅ Kullanıcı giriş yaptığında `onesignal_player_id`'yi al
- ✅ `users` tablosuna `onesignal_player_id` kolonunu ekle (zaten var)
- ✅ Kullanıcı profil güncellemesinde `onesignal_player_id`'yi kaydet
- ✅ OneSignal login/logout entegrasyonu (external ID ile)

### 5.2. Bildirim Gönderme
- ✅ **Supabase Edge Function: `send-notification`**
  - ✅ OneSignal API key'ini environment variable olarak ekle (dokümantasyonda belirtildi)
  - ✅ Grup üyelerine bildirim gönderme fonksiyonu
  - ✅ Kullanıcıya bildirim gönderme fonksiyonu
- ✅ **Bildirim Gönderme Entegrasyonu**
  - ✅ `useCreateJoinRequest` hook'unda grup sahibine bildirim gönderme
  - ✅ `useApproveJoinRequest` hook'unda istek yapan kullanıcıya bildirim gönderme
  - ✅ `useRejectJoinRequest` hook'unda istek yapan kullanıcıya bildirim gönderme
- ✅ **Bildirim Tıklama Handler**
  - ✅ `NotificationHandler` component'i oluşturuldu
  - ✅ Bildirime tıklandığında grup seçimi ve navigation
  - ✅ Provider'a entegre edildi

### 5.3. Bildirim İçerikleri
- ✅ Katılma isteği geldiğinde: "[Grup Adı] - Yeni Katılma İsteği" / "[Kullanıcı Adı] grubunuza katılmak istiyor"
- ✅ İstek onaylandığında: "[Grup Adı] - Katılma İsteği Onaylandı" / "[Grup Adı] grubuna katılma isteğiniz onaylandı!"
- ✅ İstek reddedildiğinde: "[Grup Adı] - Katılma İsteği Reddedildi" / "[Grup Adı] grubuna katılma isteğiniz reddedildi."
- ⏳ Direkt davet geldiğinde: "X kullanıcısı sizi Y grubuna davet etti" (Faz 3'te eklenecek)

---

## 🔄 6. Realtime Güncellemeleri

### 6.1. Supabase Realtime Subscription
- ✅ `api/groups.ts` dosyasına `useGroupJoinRequestsRealtime` hook'u ekle
- ✅ `api/groups.ts` dosyasına `useMyJoinRequestsRealtime` hook'u ekle
- ✅ Grup kurucusu için isteklerin anlık güncellenmesi (`join-requests.tsx` ve `DashboardView.tsx`)
- ✅ İstek sahibi için durum değişikliklerinin anlık güncellenmesi (hook hazır, kullanım için ekran gerekli)
- ✅ Export'lar `api/index.ts`'e eklendi

---

## 🎨 7. UI/UX İyileştirmeleri

### 7.1. Mevcut Ekranlara Entegrasyon
- [ ] Ana ekrana "Gruba Katıl" butonu ekle
- [ ] Grup detay ekranına "Katılma İstekleri" butonu ekle (sadece owner)
- [ ] Grup listesinde bekleyen istek sayısını göster (badge)

### 7.2. Navigation
- [ ] Drawer navigation'a yeni ekranlar ekle:
  - [ ] "Gruba Katıl" ekranı
  - [ ] "Kullanıcı Ara" ekranı
  - [ ] "Katılma İstekleri" ekranı (sadece grup owner'ları için)

---

## 🧪 8. Test ve Doğrulama

### 8.1. Fonksiyonel Testler
- [ ] Davet kodu ile katılma isteği gönderme
- [ ] Custom user ID ile kullanıcı arama
- [ ] Direkt davet gönderme
- [ ] İstek onaylama/reddetme
- [ ] Bildirimlerin doğru gönderilmesi
- [ ] Realtime güncellemelerinin çalışması

### 8.2. Edge Case'ler
- [ ] Aynı kullanıcı aynı gruba tekrar istek gönderemez
- [ ] Zaten üye olan kullanıcı istek gönderemez
- [ ] Grup limiti dolduğunda istek gönderilemez
- [ ] Silinen grup için istekler temizlenir

---

## 📝 9. Dokümantasyon

### 9.1. Kod Dokümantasyonu
- [ ] Yeni API hook'ları için JSDoc yorumları
- [ ] Yeni component'ler için kullanım örnekleri

### 9.2. Kullanıcı Dokümantasyonu
- [ ] Grup katılma akışını açıklayan doküman
- [ ] Bildirim ayarları dokümanı

---

## ✅ Tamamlanma Kriterleri

Faz 2 tamamlanmış sayılır eğer:
- ✅ Kullanıcılar davet kodu ile grup katılma isteği gönderebiliyor
- ✅ Kullanıcılar custom user ID ile arama yapıp direkt davet gönderebiliyor
- ✅ Grup kurucuları katılma isteklerini görüp onaylayıp reddedebiliyor
- ✅ Bildirimler doğru şekilde gönderiliyor (rate limiting ile)
- ✅ Realtime güncellemeler çalışıyor
- ✅ Tüm edge case'ler handle ediliyor (tekrar istek gönderme, zaten üye kontrolü)

---

## 🚀 Öncelik Sırası

1. **Yüksek Öncelik:**
   - Veritabanı tablosu oluşturma
   - API hook'ları
   - Temel UI ekranları
   - Bildirim sistemi

2. **Orta Öncelik:**
   - Realtime güncellemeler
   - UI iyileştirmeleri
   - Edge case handling

3. **Düşük Öncelik:**
   - Dokümantasyon
   - Test coverage artırma

