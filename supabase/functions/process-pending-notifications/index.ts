import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface NotificationPayload {
  receiver_ids: string[]; // Alıcı kullanıcı ID'leri (Supabase user IDs - external_id olarak kullanılacak)
  sender_id: string; // Bildirim gönderen kullanıcı ID (rate limiting için)
  group_id: string;
  group_name: string;
  title: string;
  message: string;
  type: 'status_update';
}

/**
 * Mesaj seçimi ve placeholder değiştirme
 * Custom status'ler için de messages array'i kullanılır
 */
function prepareNotificationMessage(
  messages: string[] | null | undefined,
  userName: string,
  groupName: string,
  statusText?: string
): string {
  let message: string;

  // Mesaj seçimi
  if (messages && messages.length > 0) {
    // Rastgele bir mesaj seç (custom status'ler için de geçerli)
    const randomIndex = Math.floor(Math.random() * messages.length);
    message = messages[randomIndex];
  } else {
    // Default mesaj (messages array yoksa veya boşsa)
    message = '{name} durumunu "{status}" olarak güncelledi';
  }

  // Placeholder değiştirme
  message = message.replace(/{name}/g, userName);
  message = message.replace(/{group}/g, groupName);
  if (statusText) {
    message = message.replace(/{status}/g, statusText);
  }

  return message;
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // scheduled_at <= NOW() olan pending notification'ları bul
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('pending_notifications')
      .select(`
        *,
        status:statuses(*),
        sender:users!pending_notifications_sender_id_fkey(display_name, custom_user_id),
        group:groups(name)
      `)
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) {
      console.error('Pending notifications fetch hatası:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Pending notifications alınamadı', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'İşlenecek bildirim yok' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Her pending notification için bildirim gönder
    for (const pending of pendingNotifications) {
      try {
        // Gerekli verileri kontrol et
        if (!pending.status || !pending.sender || !pending.group) {
          console.error('Eksik veri:', pending);
          errorCount++;
          continue;
        }

        // Status notifies kontrolü
        if (!pending.status.notifies) {
          // Bildirim gönderme, kaydı sil
          console.log('Status notifies false, kayıt siliniyor:', pending.id);
          await supabase
            .from('pending_notifications')
            .delete()
            .eq('id', pending.id);
          continue;
        }

        // receiver_ids'lerin geçerli olup olmadığını kontrol et (users tablosunda var mı?)
        const { data: validUsers, error: validUsersError } = await supabase
          .from('users')
          .select('id')
          .in('id', pending.receiver_ids);

        if (validUsersError) {
          console.error('Geçerli users kontrolü hatası:', validUsersError);
          errorCount++;
          continue;
        }

        const validReceiverIds = validUsers?.map((u: { id: string }) => u.id) || [];

        if (validReceiverIds.length === 0) {
          // Geçerli alıcı yok, kaydı sil
          console.log('Geçerli receiver_ids yok, kayıt siliniyor:', pending.id);
          await supabase
            .from('pending_notifications')
            .delete()
            .eq('id', pending.id);
          continue;
        }

        // Mesaj hazırla
        // Custom status'ler için de messages array'i kullanılır (statuses tablosunda messages kolonu var)
        const userName = pending.sender.display_name || pending.sender.custom_user_id || 'Kullanıcı';
        const groupName = pending.group.name;
        const statusText = pending.status.text || 'Durum';
        
        // Status'un messages array'inden rastgele mesaj seç veya default mesaj kullan
        const message = prepareNotificationMessage(
          pending.status.messages, // Custom status'ler için de messages array'i kullanılır
          userName,
          groupName,
          statusText
        );

        console.log('🔵 Status bildirimi hazırlanıyor:', {
          sender: userName,
          group: groupName,
          status: statusText,
          receiver_count: validReceiverIds.length,
          message,
        });

        // Rate limiting kontrolü (send-notification Edge Function'ına gönder)
        // Yeni API formatı: receiver_ids kullanılıyor (external_id olarak)
        const notificationPayload: NotificationPayload = {
          receiver_ids: validReceiverIds, // Supabase user IDs (external_id olarak kullanılacak)
          sender_id: pending.sender_id,
          group_id: pending.group_id,
          group_name: groupName,
          title: 'Durum Güncellendi',
          message,
          type: 'status_update',
        };

        // send-notification Edge Function'ını çağır
        const { data: notificationResult, error: notificationError } = await supabase.functions.invoke(
          'send-notification',
          { body: notificationPayload }
        );

        if (notificationError) {
          console.error('Bildirim gönderme hatası:', notificationError);
          errorCount++;
          // Rate limit hatası ise kaydı silme, tekrar denesin
          if (notificationError.message?.includes('rate_limit_exceeded')) {
            // scheduled_at'i güncelle (1 dakika sonra tekrar dene)
            const newScheduledAt = new Date(Date.now() + 60 * 1000).toISOString();
            await supabase
              .from('pending_notifications')
              .update({ scheduled_at: newScheduledAt })
              .eq('id', pending.id);
          } else {
            // Diğer hatalar için kaydı sil
            await supabase
              .from('pending_notifications')
              .delete()
              .eq('id', pending.id);
          }
        } else {
          // Başarılı, kaydı sil
          await supabase
            .from('pending_notifications')
            .delete()
            .eq('id', pending.id);
          processedCount++;
        }
      } catch (error) {
        console.error('Pending notification işleme hatası:', error);
        errorCount++;
        // Hata durumunda kaydı sil
        await supabase
          .from('pending_notifications')
          .delete()
          .eq('id', pending.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: pendingNotifications.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Process pending notifications hatası:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

