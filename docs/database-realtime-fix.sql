-- ============================================
-- Realtime Fix: REPLICA IDENTITY FULL
-- ============================================
-- Bu migration, composite primary key'li tablolarda
-- UPDATE ve DELETE işlemlerinin Realtime'da düzgün çalışması için gereklidir.

-- user_statuses tablosu için REPLICA IDENTITY FULL
ALTER TABLE public.user_statuses REPLICA IDENTITY FULL;

-- user_group_moods tablosu için REPLICA IDENTITY FULL
ALTER TABLE public.user_group_moods REPLICA IDENTITY FULL;

-- group_members tablosu için REPLICA IDENTITY FULL (composite key: group_id, user_id)
ALTER TABLE public.group_members REPLICA IDENTITY FULL;

-- group_join_requests tablosu için REPLICA IDENTITY FULL
ALTER TABLE public.group_join_requests REPLICA IDENTITY FULL;

-- groups tablosu için REPLICA IDENTITY FULL
ALTER TABLE public.groups REPLICA IDENTITY FULL;

-- Not: users tablosu için REPLICA IDENTITY FULL gerekmez
-- Kullanıcı profil güncellemeleri (display_name, photo_url) nadiren olur ve kritik değil
-- Realtime subscription kullanılmıyor (useUsersRealtime hook'u hiçbir yerde çağrılmıyor)

-- ============================================
-- Realtime Publication: Tabloları Ekle
-- ============================================
-- Eğer tablolar publication'da yoksa ekle

-- user_statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'user_statuses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_statuses;
  END IF;
END $$;

-- user_group_moods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'user_group_moods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_group_moods;
  END IF;
END $$;

-- group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
END $$;

-- group_join_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'group_join_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests;
  END IF;
END $$;

-- groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  END IF;
END $$;

-- Not: users tablosu realtime'a eklenmiyor
-- Kullanıcı profil güncellemeleri nadiren olur ve kritik değil
-- useUsersRealtime hook'u hiçbir yerde kullanılmıyor

-- ============================================
-- Kontrol: Realtime Publication Durumu
-- ============================================
-- Bu sorguyu çalıştırarak hangi tabloların realtime'da olduğunu görebilirsiniz
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN ('user_statuses', 'user_group_moods', 'group_members', 'group_join_requests', 'groups') 
    THEN '✅ Kritik Tablo'
    ELSE 'ℹ️ Diğer'
  END as importance
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY importance DESC, tablename;

-- ============================================
-- Kontrol: REPLICA IDENTITY Durumu
-- ============================================
-- Bu sorguyu çalıştırarak hangi tabloların REPLICA IDENTITY FULL olduğunu görebilirsiniz
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE 
    WHEN c.relreplident = 'f' THEN '✅ FULL'
    WHEN c.relreplident = 'd' THEN '❌ DEFAULT (Sadece Primary Key)'
    WHEN c.relreplident = 'n' THEN '❌ NOTHING'
    WHEN c.relreplident = 'i' THEN '❌ INDEX'
    ELSE '❓ UNKNOWN'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('user_statuses', 'user_group_moods', 'group_members', 'group_join_requests', 'groups')
ORDER BY c.relname;

-- ============================================
-- Not: RLS (Row Level Security)
-- ============================================
-- Şu an RLS kapalı, bu yüzden policy kontrolü yapmıyoruz.
-- Eğer ileride RLS açarsanız, Realtime'ın çalışması için
-- authenticated kullanıcıların SELECT izni olmalı.

