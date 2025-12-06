import { supabase } from './supabase';

/**
 * Bildirim gönderme API'si
 * Supabase Edge Function'ı çağırır
 */

interface SendNotificationParams {
  user_ids?: string[]; // DEPRECATED - Artık kullanılmıyor, receiver_ids kullanılacak
  receiver_ids: string[]; // Alıcı kullanıcı ID'leri (Supabase user IDs - external_id olarak kullanılacak)
  sender_id?: string; // Bildirim gönderen kullanıcı ID (rate limiting için)
  receiver_id_to_player_id?: Record<string, string>; // DEPRECATED - Artık kullanılmıyor
  group_id: string;
  group_name: string;
  title: string;
  message: string;
  type: 'join_request' | 'join_request_status' | 'status_update' | 'mood_update' | 'event_reminder';
}

/**
 * Bildirim gönder
 */
export const sendNotification = async (params: SendNotificationParams) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: params,
  });
      
  if (error) {
    // Rate limit hatası kontrolü
    if (error.message?.includes('rate_limit_exceeded') || data?.error === 'rate_limit_exceeded') {
      const rateLimitError = new Error(data?.message || 'Çok sık bildirim gönderiyorsunuz. Lütfen bekleyin.');
      (rateLimitError as any).code = 'RATE_LIMIT_EXCEEDED';
      (rateLimitError as any).wait_until = data?.wait_until;
      (rateLimitError as any).wait_seconds = data?.wait_seconds;
      throw rateLimitError;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Bildirim gönderme hatası:', errorMessage);
    throw new Error(errorMessage);
  }

      return data;
};

/**
 * Grup katılma isteği bildirimi gönder
 */
export const sendJoinRequestNotification = async (
  groupOwnerId: string, // Supabase user ID (external_id olarak kullanılacak)
  groupId: string,
  groupName: string,
  requesterName: string,
  requesterId: string // Rate limiting için
) => {
  return sendNotification({
    receiver_ids: [groupOwnerId], // Supabase user ID = OneSignal external_id
    sender_id: requesterId,
    group_id: groupId,
    group_name: groupName,
    title: 'Yeni Katılma İsteği',
    message: `${requesterName} grubunuza katılmak istiyor`,
    type: 'join_request',
  });
};

/**
 * Katılma isteği durumu bildirimi gönder (onaylandı/reddedildi)
 */
export const sendJoinRequestStatusNotification = async (
  requesterId: string, // Supabase user ID (external_id olarak kullanılacak)
  groupId: string,
  groupName: string,
  status: 'approved' | 'rejected',
  groupOwnerId: string // Rate limiting için
) => {
  const title = status === 'approved' ? 'Katılma İsteği Onaylandı' : 'Katılma İsteği Reddedildi';
  const message =
    status === 'approved'
      ? `${groupName} grubuna katılma isteğiniz onaylandı!`
      : `${groupName} grubuna katılma isteğiniz reddedildi.`;

  return sendNotification({
    receiver_ids: [requesterId], // Supabase user ID = OneSignal external_id
    sender_id: groupOwnerId,
    group_id: groupId,
    group_name: groupName,
    title,
    message,
    type: 'join_request_status',
  });
};

/**
 * Durum güncellemesi bildirimi gönder
 */
export const sendStatusUpdateNotification = async (
  receiverIds: string[], // Supabase user IDs (external_id olarak kullanılacak)
  groupId: string,
  groupName: string,
  userName: string,
  statusText: string,
  senderId: string // Rate limiting için
) => {
  return sendNotification({
    receiver_ids: receiverIds, // Supabase user IDs = OneSignal external_id
    sender_id: senderId,
    group_id: groupId,
    group_name: groupName,
    title: 'Durum Güncellendi',
    message: `${userName} durumunu "${statusText}" olarak güncelledi`,
    type: 'status_update',
  });
};

/**
 * Mood güncellemesi bildirimi gönder
 */
export const sendMoodUpdateNotification = async (
  receiverIds: string[], // Supabase user IDs (external_id olarak kullanılacak)
  groupId: string,
  groupName: string,
  userName: string,
  moodText: string,
  senderId: string // Rate limiting için
) => {
  return sendNotification({
    receiver_ids: receiverIds, // Supabase user IDs = OneSignal external_id
    sender_id: senderId,
    group_id: groupId,
    group_name: groupName,
    title: 'Mood Güncellendi',
    message: `${userName} mood'unu "${moodText}" olarak güncelledi`,
    type: 'mood_update',
  });
};

/**
 * Etkinlik hatırlatıcısı bildirimi gönder
 */
export const sendEventReminderNotification = async (
  receiverIds: string[], // Supabase user IDs (external_id olarak kullanılacak)
  groupId: string,
  groupName: string,
  eventTitle: string
) => {
  return sendNotification({
    receiver_ids: receiverIds, // Supabase user IDs = OneSignal external_id
    group_id: groupId,
    group_name: groupName,
    title: 'Etkinlik Hatırlatıcısı',
    message: `${eventTitle} için 1 saat kaldı!`,
    type: 'event_reminder',
  });
};
