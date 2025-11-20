-- Database Migration: Status Bildirim Sistemi
-- Bu migration, status bildirimleri için messages kolonu ve pending_notifications tablosunu ekler

-- ============================================
-- 1. statuses Tablosuna Messages Kolonu Ekle
-- ============================================

ALTER TABLE public.statuses 
ADD COLUMN IF NOT EXISTS messages TEXT[] NULL;

-- Örnek mesajlar ekle (default status'ler için)
-- Not: Bu mesajlar admin panelinden veya seed script'ten eklenebilir
-- Örnek:
-- UPDATE public.statuses 
-- SET messages = ARRAY['{name} artık müsait!', '{name} şimdi müsait durumda', '{name} müsait oldu']
-- WHERE text = 'Müsaitim' AND notifies = true;

-- ============================================
-- 2. pending_notifications Tablosu Oluştur
-- ============================================

CREATE TABLE IF NOT EXISTS public.pending_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_ids UUID[] NOT NULL,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Bir kullanıcının aynı grup için sadece 1 pending bildirimi olabilir
  CONSTRAINT pending_notifications_sender_group_unique UNIQUE (sender_id, group_id)
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_pending_notifications_scheduled_at 
ON public.pending_notifications(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_pending_notifications_sender_id 
ON public.pending_notifications(sender_id);

CREATE INDEX IF NOT EXISTS idx_pending_notifications_group_id 
ON public.pending_notifications(group_id);

-- ============================================
-- 3. updated_at Trigger Fonksiyonu
-- ============================================

CREATE OR REPLACE FUNCTION update_pending_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger ekle
DROP TRIGGER IF EXISTS trigger_update_pending_notifications_updated_at ON public.pending_notifications;
CREATE TRIGGER trigger_update_pending_notifications_updated_at
  BEFORE UPDATE ON public.pending_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_notifications_updated_at();

