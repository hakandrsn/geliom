-- Rate Limiting Tablosu
-- Bildirim spam'ini önlemek için kullanılır

CREATE TABLE IF NOT EXISTS public.notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'join_request',
    'join_request_status',
    'direct_invite',
    'status_update',
    'mood_update',
    'event_reminder'
  )),
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id, group_id, notification_type)
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_rate_limits_sender_receiver 
  ON notification_rate_limits(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_group 
  ON notification_rate_limits(group_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_type 
  ON notification_rate_limits(notification_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_sent 
  ON notification_rate_limits(last_sent_at);

-- Eski kayıtları temizlemek için function (24 saatten eski)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM notification_rate_limits
  WHERE last_sent_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Rate limit kontrolü için helper function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_group_id UUID,
  p_notification_type TEXT,
  p_limit_minutes INTEGER
)
RETURNS TABLE(
  can_send BOOLEAN,
  wait_until TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_sent_at TIMESTAMP WITH TIME ZONE;
  v_wait_until TIMESTAMP WITH TIME ZONE;
  v_can_send BOOLEAN;
BEGIN
  -- Son gönderim zamanını al
  SELECT nrl.last_sent_at INTO v_last_sent_at
  FROM notification_rate_limits nrl
  WHERE nrl.sender_id = p_sender_id
    AND nrl.receiver_id = p_receiver_id
    AND (p_group_id IS NULL OR nrl.group_id = p_group_id)
    AND nrl.notification_type = p_notification_type;

  -- Eğer kayıt yoksa, gönderebilir
  IF v_last_sent_at IS NULL THEN
    v_can_send := TRUE;
    v_wait_until := NOW();
  ELSE
    -- Bekleme süresini hesapla
    v_wait_until := v_last_sent_at + (p_limit_minutes || ' minutes')::INTERVAL;

    -- Şu anki zaman beklenen zamandan sonra mı?
    IF NOW() >= v_wait_until THEN
      v_can_send := TRUE;
    ELSE
      v_can_send := FALSE;
    END IF;
  END IF;

  -- Eğer gönderebiliyorsa, kaydı güncelle/ekle
  IF v_can_send THEN
    INSERT INTO notification_rate_limits (
      sender_id, receiver_id, group_id, notification_type, last_sent_at
    )
    VALUES (
      p_sender_id, p_receiver_id, p_group_id, p_notification_type, NOW()
    )
    ON CONFLICT (sender_id, receiver_id, group_id, notification_type)
    DO UPDATE SET last_sent_at = NOW();
  END IF;

  -- Sonucu döndür
  RETURN QUERY SELECT v_can_send, v_wait_until;
END;
$$;

-- RLS (Row Level Security) - Şimdilik kapalı, proje bitiminde açılacak
-- ALTER TABLE notification_rate_limits ENABLE ROW LEVEL SECURITY;

