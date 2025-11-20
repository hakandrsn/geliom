# Realtime Troubleshooting

## Sorun: Realtime Subscription Kuruluyor Ama Payload Gelmiyor

### Belirtiler
- ✅ `📡 Realtime subscription status: SUBSCRIBED` görünüyor
- ✅ `✅ Realtime subscription başarıyla kuruldu` görünüyor
- ❌ `🔄 Realtime status update` log'u görünmüyor
- ❌ Database'de değişiklik yapıldığında realtime payload gelmiyor

### Olası Nedenler

#### 1. Tablo Realtime Publication'da Değil (EN YAYGIN)

Supabase'de bir tablonun realtime çalışması için `supabase_realtime` publication'ına eklenmesi gerekir.

**Kontrol:**
```sql
-- Hangi tablolar realtime'da?
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Çözüm:**
```sql
-- user_statuses tablosunu realtime'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE user_statuses;

-- user_group_moods tablosunu realtime'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE user_group_moods;
```

#### 2. Supabase Dashboard'da Realtime Kapalı

**Kontrol:**
1. Supabase Dashboard → Database → Replication
2. `user_statuses` ve `user_group_moods` tablolarında Realtime toggle'ı **AÇIK** olmalı

**Çözüm:**
- Dashboard'dan toggle'ı açın
- Veya yukarıdaki SQL komutlarını çalıştırın

#### 3. Filter Problemi

Realtime filter'ları bazen çalışmayabilir. Test için filter'ı kaldırıp tüm değişiklikleri dinleyin:

```typescript
// Test için filter olmadan
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'user_statuses',
    // filter: `group_id=eq.${groupId}`, // Geçici olarak kaldır
  },
  (payload) => {
    console.log('🔄 Realtime status update (ALL):', payload);
  }
)
```

#### 4. RLS (Row Level Security) Problemi

RLS açıksa, kullanıcıların realtime event'lerini görebilmesi için policy'ler gerekir.

**Kontrol:**
```sql
-- RLS açık mı?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_statuses', 'user_group_moods');
```

**Not:** Şu an RLS kapalı, bu sorun değil.

### Test Adımları

1. **Publication Kontrolü:**
   ```sql
   SELECT tablename 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
     AND tablename IN ('user_statuses', 'user_group_moods');
   ```

2. **Manuel Test:**
   - Supabase Dashboard → Table Editor → `user_statuses`
   - Bir kaydı güncelleyin
   - Console'da `🔄 Realtime status update` log'u görünmeli

3. **Subscription Durumu:**
   - Console'da `📡 Realtime subscription status: SUBSCRIBED` görünmeli
   - Eğer `CHANNEL_ERROR`, `TIMED_OUT` veya `CLOSED` görüyorsanız, bağlantı sorunu var

### Çözüm Önceliği

1. **ÖNCE:** `ALTER PUBLICATION supabase_realtime ADD TABLE user_statuses;` çalıştırın
2. **SONRA:** `ALTER PUBLICATION supabase_realtime ADD TABLE user_group_moods;` çalıştırın
3. **TEST:** Bir status değiştirin ve `🔄 Realtime status update` log'unu kontrol edin

### Notlar

- Realtime subscription kurulduktan sonra (`SUBSCRIBED`), database'deki değişiklikler otomatik olarak payload olarak gelmelidir
- Eğer payload gelmiyorsa, tablo publication'da değildir veya Supabase Realtime servisi çalışmıyordur
- Filter'lar (`group_id=eq.${groupId}`) sadece payload'ı filtreler, subscription'ı engellemez

