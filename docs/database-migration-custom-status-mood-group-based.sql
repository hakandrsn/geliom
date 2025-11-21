-- Database Migration: Custom Status ve Mood Grup Bazlı Yapısı
-- Bu migration, custom status ve mood'ları grup bazlı hale getirir
-- Default status/mood'lar tüm gruplar için geçerli kalır (group_id = NULL)
-- Custom status/mood'lar sadece oluşturulduğu grupta görünür (group_id = <grup_id>)

-- ============================================
-- 1. statuses Tablosu Güncellemesi
-- ============================================

-- group_id kolonu ekle
ALTER TABLE public.statuses 
ADD COLUMN IF NOT EXISTS group_id UUID NULL;

-- Foreign key constraint ekle (önce varsa sil, sonra ekle)
ALTER TABLE public.statuses
DROP CONSTRAINT IF EXISTS statuses_group_id_fkey;

ALTER TABLE public.statuses
ADD CONSTRAINT statuses_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_statuses_group_id 
ON public.statuses(group_id);

-- Mevcut custom status'leri güncelle
-- Custom status'ler (is_custom = true) için owner'ın ilk grubunu bul ve ona ata
-- Eğer owner'ın grubu yoksa group_id = NULL kalır (manuel düzeltme gerekir)
UPDATE public.statuses s
SET group_id = (
  SELECT gm.group_id 
  FROM public.group_members gm
  WHERE gm.user_id = s.owner_id
  ORDER BY gm.joined_at ASC
  LIMIT 1
)
WHERE s.is_custom = true 
  AND s.group_id IS NULL
  AND s.owner_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.group_members gm 
    WHERE gm.user_id = s.owner_id
  );

-- Default status'ler için group_id = NULL olduğundan emin ol
UPDATE public.statuses
SET group_id = NULL
WHERE is_custom = false;

-- ============================================
-- 2. moods Tablosu Güncellemesi
-- ============================================

-- group_id kolonu ekle
ALTER TABLE public.moods 
ADD COLUMN IF NOT EXISTS group_id UUID NULL;

-- Foreign key constraint ekle (önce varsa sil, sonra ekle)
ALTER TABLE public.moods
DROP CONSTRAINT IF EXISTS moods_group_id_fkey;

ALTER TABLE public.moods
ADD CONSTRAINT moods_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_moods_group_id 
ON public.moods(group_id);

-- Not: moods tablosunda owner_id veya is_custom alanı yok
-- Bu yüzden mevcut mood'ları default olarak kabul ediyoruz (group_id = NULL)
-- Custom mood'lar yeni eklendiğinde group_id ile eklenecek

-- ============================================
-- 3. Kontrol Sorguları
-- ============================================

-- Custom status'lerin group_id'si var mı kontrol et
-- SELECT id, text, is_custom, owner_id, group_id 
-- FROM public.statuses 
-- WHERE is_custom = true 
-- ORDER BY group_id NULLS LAST;

-- Default status'lerin group_id'si NULL mu kontrol et
-- SELECT id, text, is_custom, group_id 
-- FROM public.statuses 
-- WHERE is_custom = false 
-- AND group_id IS NOT NULL;

