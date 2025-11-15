-- Database Migration: Group-Based Status & Mood System
-- Bu migration, user_statuses ve moods sistemini grup bazlı hale getirir

-- ============================================
-- 1. user_statuses Tablosu Güncellemesi
-- ============================================

-- Önce mevcut primary key constraint'i kaldır
ALTER TABLE public.user_statuses DROP CONSTRAINT IF EXISTS user_statuses_pkey;

-- group_id kolonu ekle (NULL olabilir - global status için)
ALTER TABLE public.user_statuses 
ADD COLUMN IF NOT EXISTS group_id UUID NULL;

-- Foreign key constraint ekle
ALTER TABLE public.user_statuses
ADD CONSTRAINT user_statuses_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Mevcut verileri group_id = NULL ile güncelle (global status olarak)
UPDATE public.user_statuses 
SET group_id = NULL 
WHERE group_id IS NULL;

-- Yeni composite primary key oluştur (user_id, group_id)
-- NOT: PostgreSQL'de NULL değerler unique constraint'te farklı davranır
-- Bu yüzden partial unique index kullanacağız
ALTER TABLE public.user_statuses
ADD CONSTRAINT user_statuses_pkey PRIMARY KEY (user_id, group_id);

-- NULL group_id için unique constraint (bir kullanıcının tek global status'u olabilir)
CREATE UNIQUE INDEX IF NOT EXISTS user_statuses_user_id_null_group_unique 
ON public.user_statuses(user_id) 
WHERE group_id IS NULL;

-- Performance için index'ler
CREATE INDEX IF NOT EXISTS idx_user_statuses_group_id 
ON public.user_statuses(group_id);

CREATE INDEX IF NOT EXISTS idx_user_statuses_user_id_group_id 
ON public.user_statuses(user_id, group_id);

-- ============================================
-- 2. user_group_moods Tablosu Oluştur
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_group_moods (
  user_id UUID NOT NULL,
  group_id UUID NULL,
  mood_id INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT user_group_moods_pkey PRIMARY KEY (user_id, group_id),
  CONSTRAINT user_group_moods_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_group_moods_group_id_fkey 
    FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE,
  CONSTRAINT user_group_moods_mood_id_fkey 
    FOREIGN KEY (mood_id) REFERENCES public.moods(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- NULL group_id için unique constraint (bir kullanıcının tek global mood'u olabilir)
CREATE UNIQUE INDEX IF NOT EXISTS user_group_moods_user_id_null_group_unique 
ON public.user_group_moods(user_id) 
WHERE group_id IS NULL;

-- Performance için index'ler
CREATE INDEX IF NOT EXISTS idx_user_group_moods_group_id 
ON public.user_group_moods(group_id);

CREATE INDEX IF NOT EXISTS idx_user_group_moods_user_id_group_id 
ON public.user_group_moods(user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_user_group_moods_mood_id 
ON public.user_group_moods(mood_id);

-- ============================================
-- 3. Mevcut users.mood_id Verilerini Migrate Et
-- ============================================

-- Mevcut users tablosundaki mood_id değerlerini user_group_moods'a taşı
-- (sadece mood_id NULL olmayan kayıtlar için)
INSERT INTO public.user_group_moods (user_id, group_id, mood_id, updated_at)
SELECT 
  id as user_id,
  NULL as group_id,  -- Global mood olarak
  mood_id,
  updated_at
FROM public.users
WHERE mood_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;

-- ============================================
-- 4. RLS (Row Level Security) Policies
-- ============================================

-- user_statuses için RLS policy (eğer RLS aktifse)
-- Kullanıcılar sadece kendi status'larını görebilir/güncelleyebilir
-- Veya grup üyeleri grup status'larını görebilir

-- user_group_moods için RLS policy (eğer RLS aktifse)
-- Kullanıcılar sadece kendi mood'larını görebilir/güncelleyebilir
-- Veya grup üyeleri grup mood'larını görebilir

-- NOT: RLS policy'leri projenin güvenlik gereksinimlerine göre ayrıca eklenmelidir

-- ============================================
-- 5. Migration Tamamlandı
-- ============================================

-- Migration sonrası kontrol sorguları:
-- SELECT COUNT(*) FROM public.user_statuses WHERE group_id IS NULL; -- Global status sayısı
-- SELECT COUNT(*) FROM public.user_group_moods WHERE group_id IS NULL; -- Global mood sayısı
-- SELECT COUNT(*) FROM public.user_group_moods; -- Toplam mood kaydı

