-- Güncellenmiş Database Function
-- Bu function, auth.users tablosuna yeni kullanıcı eklendiğinde otomatik çalışır
-- custom_user_id, email ve diğer profil bilgilerini otomatik oluşturur

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_id TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
  char_index INTEGER;
BEGIN
  -- Rastgele ve eşsiz bir custom_user_id oluştur (tam 8 karakter)
  -- Sadece İngilizce harf (A-Z) ve sayı (0-9) kullanılır
  LOOP
    -- 8 karakterlik random string oluştur
    random_id := '';
    FOR i IN 1..8 LOOP
      -- Random bir index seç (0-35 arası: 26 harf + 10 sayı)
      char_index := floor(random() * 36)::INTEGER;
      -- Index'e göre karakteri al (1-based indexing için +1)
      random_id := random_id || substr(chars, char_index + 1, 1);
    END LOOP;
    
    -- Bu ID'nin başka bir kullanıcıda olmadığından emin ol
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE custom_user_id = random_id);
  END LOOP;

  -- `public.users` tablosuna yeni kullanıcıyı ekle
  INSERT INTO public.users (
    id,
    custom_user_id,
    email,
    display_name,
    photo_url,
    show_mood
  )
  VALUES (
    new.id,
    random_id,
    new.email, -- auth.users'dan email al
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1) -- Email'den kullanıcı adı çıkar
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    false -- Varsayılan olarak mood gösterimi kapalı
  );

  -- `public.subscriptions` tablosuna varsayılan 'free' aboneliği ekle
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (new.id, 'free');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur (eğer yoksa)
-- NOT: Trigger zaten varsa bu komut hataya sebep olmaz
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

