# Realtime Özelliği Açık Olması Gereken Tablolar

Bu dokümantasyon, Supabase'de Realtime özelliğinin açık olması gereken tabloları listeler. Bu tablolar, uygulama içinde anlık güncellemeler için kullanılmaktadır.

## Supabase Dashboard'da Realtime Açma

1. **Supabase Dashboard** → **Database** → **Replication** bölümüne gidin
2. Her tablo için **Realtime** toggle'ını **AÇIK** yapın
3. Veya SQL ile:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
   ```

## Realtime Açık Olması Gereken Tablolar

### 1. **groups** ✅
- **Kullanım:** Grup bilgileri güncellemeleri
- **Hook:** `useGroupsRealtime`
- **Dosya:** `api/groups.ts`
- **Açıklama:** Grup bilgileri (name, owner_id, vb.) değiştiğinde anlık güncelleme

### 2. **group_members** ✅
- **Kullanım:** Grup üyelik değişiklikleri
- **Hook:** `useGroupMembersRealtime`
- **Dosya:** `api/groups.ts`
- **Açıklama:** Kullanıcı gruba katıldığında/ayrıldığında anlık güncelleme

### 3. **group_join_requests** ✅
- **Kullanım:** Grup katılma istekleri
- **Hook:** `useGroupJoinRequestsRealtime`, `useMyJoinRequestsRealtime`
- **Dosya:** `api/groups.ts`
- **Açıklama:** Katılma istekleri oluşturulduğunda/onaylandığında/reddedildiğinde anlık güncelleme

### 4. **statuses** ✅
- **Kullanım:** Status tanımları (default ve custom)
- **Hook:** `useStatusesRealtime`
- **Dosya:** `api/statuses.ts`
- **Açıklama:** Status tanımları değiştiğinde anlık güncelleme (custom status oluşturma/güncelleme)

### 5. **user_statuses** ✅
- **Kullanım:** Kullanıcı status'ları (grup bazlı)
- **Hook:** `useGroupStatusesRealtime`, `useUserStatusesRealtime`
- **Dosya:** `api/statuses.ts`
- **Açıklama:** Kullanıcı status'u değiştiğinde anlık güncelleme (en önemli realtime özelliği)

### 6. **moods** ✅
- **Kullanım:** Mood tanımları (default ve custom)
- **Hook:** `useMoodsRealtime`
- **Dosya:** `api/moods.ts`
- **Açıklama:** Mood tanımları değiştiğinde anlık güncelleme (custom mood oluşturma/güncelleme)

### 7. **user_group_moods** ✅
- **Kullanım:** Kullanıcı mood'ları (grup bazlı)
- **Hook:** `useGroupMoodsRealtime`
- **Dosya:** `api/moods.ts`
- **Açıklama:** Kullanıcı mood'u değiştiğinde anlık güncelleme (en önemli realtime özelliği)

### 8. **nicknames** ✅
- **Kullanım:** Kullanıcı takma adları (grup bazlı)
- **Hook:** `useNicknamesRealtime`
- **Dosya:** `api/nicknames.ts`
- **Açıklama:** Takma ad oluşturulduğunda/güncellendiğinde/silindiğinde anlık güncelleme

### 9. **scheduled_events** ✅
- **Kullanım:** Planlanmış etkinlikler
- **Hook:** `useGroupEventsRealtime`, `useEventsRealtime`
- **Dosya:** `api/events.ts`
- **Açıklama:** Etkinlik oluşturulduğunda/güncellendiğinde/silindiğinde anlık güncelleme

### 10. **subscriptions** ✅
- **Kullanım:** Kullanıcı abonelikleri
- **Hook:** `useSubscriptionRealtime`
- **Dosya:** `api/subscriptions.ts`
- **Açıklama:** Abonelik durumu değiştiğinde anlık güncelleme (premium özellikler için)

### 11. **muted_notifications** ⚠️
- **Kullanım:** Sessize alınmış bildirimler
- **Hook:** Şu an realtime hook yok (gelecekte eklenebilir)
- **Dosya:** `api/muted.ts`
- **Açıklama:** Şu an realtime kullanılmıyor ama gelecekte eklenebilir

### ❌ **users** (Kaldırıldı)
- **Neden Kaldırıldı:** Kullanıcı profil güncellemeleri (display_name, photo_url) nadiren olur ve kritik değil
- **Hook:** `useUsersRealtime` tanımlı ama hiçbir yerde kullanılmıyor
- **Not:** İleride gerekirse eklenebilir, şu an gereksiz

## Öncelik Sırası

### Yüksek Öncelik (Kritik)
1. **user_statuses** - Status değişiklikleri anlık yansımalı
2. **user_group_moods** - Mood değişiklikleri anlık yansımalı
3. **group_members** - Üyelik değişiklikleri anlık yansımalı
4. **group_join_requests** - Katılma istekleri anlık yansımalı

### Orta Öncelik
5. **groups** - Grup bilgileri değişiklikleri
6. **nicknames** - Takma ad değişiklikleri

### Düşük Öncelik
8. **statuses** - Status tanımları (nadiren değişir)
9. **moods** - Mood tanımları (nadiren değişir)
10. **scheduled_events** - Etkinlik değişiklikleri
11. **subscriptions** - Abonelik durumu (nadiren değişir)

## SQL Komutları (Toplu Açma)

Tüm tabloları tek seferde açmak için:

```sql
-- Realtime özelliğini tüm tablolara ekle
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE group_join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE user_statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE moods;
ALTER PUBLICATION supabase_realtime ADD TABLE user_group_moods;
ALTER PUBLICATION supabase_realtime ADD TABLE nicknames;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_events;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE muted_notifications;
-- Not: users tablosu kaldırıldı (gereksiz, useUsersRealtime hiçbir yerde kullanılmıyor)
```

## Kontrol Etme

Realtime'ın açık olup olmadığını kontrol etmek için:

```sql
-- Tüm realtime tablolarını listele
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

## Notlar

- **RLS (Row Level Security):** Realtime özelliği RLS ile uyumlu çalışır
- **Performans:** Realtime subscription'lar performansı etkileyebilir, sadece gerekli tablolarda açın
- **Güvenlik:** Realtime açık olan tablolar, client-side'dan dinlenebilir (RLS ile korunmalı)
- **Muted Notifications:** Şu an realtime kullanılmıyor ama gelecekte eklenebilir

