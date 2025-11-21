# Kullanıcının Yapması Gerekenler

## 1. Database Migration SQL'i Çalıştırma

**ÖNEMLİ**: Bu adımı Supabase Dashboard'da SQL Editor'da çalıştırmanız gerekiyor.

### Adımlar:

1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ı açın
3. `docs/database-migration-custom-status-mood-group-based.sql` dosyasındaki SQL'i kopyalayın
4. SQL Editor'a yapıştırın ve çalıştırın

### Migration SQL'i Ne Yapıyor?

- `statuses` tablosuna `group_id` kolonu ekler
- `moods` tablosuna `group_id` kolonu ekler
- Foreign key constraint'ler ekler
- Index'ler ekler (performans için)
- Mevcut custom status'leri owner'ın ilk grubuna atar (varsa)

### Migration Sonrası Kontrol:

Migration başarılı olduktan sonra şu sorguları çalıştırarak kontrol edebilirsiniz:

```sql
-- Custom status'lerin group_id'si var mı kontrol et
SELECT id, text, is_custom, owner_id, group_id 
FROM public.statuses 
WHERE is_custom = true 
ORDER BY group_id NULLS LAST;

-- Default status'lerin group_id'si NULL mu kontrol et
SELECT id, text, is_custom, group_id 
FROM public.statuses 
WHERE is_custom = false 
AND group_id IS NOT NULL;
```

Eğer `group_id = NULL` olan custom status'ler varsa, bunları manuel olarak düzeltmeniz gerekebilir.

## 2. Test Etme

Migration tamamlandıktan sonra:

1. **Custom Status Ekleme Testi**:
   - Bir gruba girin
   - Grup yönetimi sayfasına gidin
   - "Özel Durum Ekle" butonuna tıklayın
   - Yeni bir custom status oluşturun
   - Status'un sadece o grupta göründüğünü kontrol edin

2. **Custom Mood Ekleme Testi**:
   - Aynı grup yönetimi sayfasında
   - "Özel Mood Ekle" butonuna tıklayın
   - Yeni bir custom mood oluşturun
   - Mood'un sadece o grupta göründüğünü kontrol edin

3. **Farklı Grup Testi**:
   - Başka bir gruba geçin
   - Önceki grupta oluşturduğunuz custom status/mood'ların görünmediğini kontrol edin
   - Default status/mood'ların göründüğünü kontrol edin

## 3. Mevcut Custom Status/Mood'ları Düzeltme (Opsiyonel)

Eğer migration sonrası `group_id = NULL` olan custom status'ler varsa:

1. Bu status'lerin hangi gruba ait olduğunu belirleyin
2. Manuel olarak güncelleyin:

```sql
-- Örnek: Bir custom status'ü belirli bir gruba ata
UPDATE public.statuses
SET group_id = 'grupun-uuid-si-buraya'
WHERE id = status-id-si-buraya
AND is_custom = true
AND group_id IS NULL;
```

## Notlar

- Migration güvenli bir şekilde tasarlandı, mevcut verileri silmez
- Default status/mood'lar (`is_custom = false`) için `group_id = NULL` kalır (tüm gruplar için geçerli)
- Custom status/mood'lar sadece oluşturulduğu grupta görünür
- Bildirim sistemi bozulmaz (custom status'ler `notifies: false` olduğu için bildirim göndermez)

