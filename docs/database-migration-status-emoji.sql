-- Database Migration: Status Emoji Kolonu
-- Bu migration, statuses tablosuna emoji kolonu ekler

-- ============================================
-- 1. statuses Tablosu Güncellemesi
-- ============================================

-- emoji kolonu ekle
ALTER TABLE public.statuses 
ADD COLUMN IF NOT EXISTS emoji TEXT NULL;

-- ============================================
-- 2. Kontrol Sorguları
-- ============================================

-- Status'lerin emoji'si var mı kontrol et
-- SELECT id, text, emoji, is_custom 
-- FROM public.statuses 
-- ORDER BY is_custom DESC, text;

