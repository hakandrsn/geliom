import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables - trim edilmiş ve doğrulanmış
const ONESIGNAL_APP_ID = (Deno.env.get('ONESIGNAL_APP_ID') || '').trim();
let ONESIGNAL_REST_API_KEY = (Deno.env.get('ONESIGNAL_REST_API_KEY') || '').trim();
const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

// API Key format kontrolü ve doğrulama
const validateOneSignalApiKey = (apiKey: string): { valid: boolean; error?: string } => {
  if (!apiKey) {
    return { valid: false, error: 'API Key boş' };
  }
  
  // OneSignal REST API Key genellikle 40-50 karakter arası olur
  // Ama bazı durumlarda daha uzun olabilir, bu yüzden sadece minimum kontrol yapıyoruz
  if (apiKey.length < 20) {
    return { valid: false, error: `API Key çok kısa (${apiKey.length} karakter, minimum 20 bekleniyor)` };
  }
  
  // API Key sadece alfanumerik karakterler ve bazı özel karakterler içermeli
  // Ama tam format kontrolü yapmak yerine, sadece boşluk kontrolü yapıyoruz
  if (apiKey.includes('\n') || apiKey.includes('\r')) {
    return { valid: false, error: 'API Key içinde yeni satır karakteri var' };
  }
  
  return { valid: true };
};

// API Key doğrulama
const apiKeyValidation = validateOneSignalApiKey(ONESIGNAL_REST_API_KEY);

// Debug: Environment variables kontrolü (API Key'in ilk/son 5 karakterini log'la, güvenlik için)
const apiKeyPreview = ONESIGNAL_REST_API_KEY 
  ? `${ONESIGNAL_REST_API_KEY.substring(0, 5)}...${ONESIGNAL_REST_API_KEY.substring(ONESIGNAL_REST_API_KEY.length - 5)}`
  : 'Yok';

console.log('🔵 Edge Function environment variables:', {
  ONESIGNAL_APP_ID: ONESIGNAL_APP_ID ? '✅ Set' : '❌ Missing',
  ONESIGNAL_REST_API_KEY: ONESIGNAL_REST_API_KEY ? `✅ Set (${ONESIGNAL_REST_API_KEY.length} karakter, ${apiKeyPreview})` : '❌ Missing',
  ONESIGNAL_REST_API_KEY_VALID: apiKeyValidation.valid ? '✅ Valid' : `❌ Invalid: ${apiKeyValidation.error}`,
  SUPABASE_URL: SUPABASE_URL ? '✅ Set' : '❌ Missing',
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
});

// Rate limit süreleri (dakika cinsinden)
const RATE_LIMITS: Record<string, number> = {
  'join_request': 5,        // 5 dakika
  'join_request_status': 1, // 1 dakika
  'direct_invite': 10,      // 10 dakika
  'status_update': 1,       // 1 dakika
  'mood_update': 1,         // 1 dakika
  'event_reminder': 60,     // 60 dakika (sistem bildirimi, daha uzun)
};

interface NotificationPayload {
  user_ids?: string[]; // OneSignal player_id'leri (DEPRECATED - include_aliases kullanılacak)
  receiver_ids: string[]; // Alıcı kullanıcı ID'leri (Supabase user IDs - external_id olarak kullanılacak)
  sender_id?: string; // Bildirim gönderen kullanıcı ID (rate limiting için)
  receiver_id_to_player_id?: Record<string, string>; // receiver_id -> player_id mapping (rate limiting için, artık kullanılmıyor)
  group_id: string;
  group_name: string;
  title: string;
  message: string;
  type: 'join_request' | 'join_request_status' | 'status_update' | 'mood_update' | 'event_reminder';
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Request body'yi parse et
    console.log('🔵 Request alındı, body parse ediliyor...');
    const payload: NotificationPayload = await req.json();
    console.log('🔵 Request payload:', {
      receiver_ids_count: payload.receiver_ids?.length || 0,
      receiver_ids: payload.receiver_ids?.slice(0, 3) || [], // İlk 3'ü göster
      sender_id: payload.sender_id,
      group_id: payload.group_id,
      group_name: payload.group_name,
      type: payload.type,
    });

    // Validation - receiver_ids gerekli (Supabase user IDs - external_id olarak kullanılacak)
    if (!payload.receiver_ids || payload.receiver_ids.length === 0) {
      console.error('❌ Validation hatası: receiver_ids eksik veya boş');
      return new Response(
        JSON.stringify({ error: 'receiver_ids gerekli (Supabase user IDs)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.group_id || !payload.group_name) {
      console.error('❌ Validation hatası: group_id veya group_name eksik');
      return new Response(
        JSON.stringify({ error: 'group_id ve group_name gerekli' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Validation başarılı');

    // Rate limiting kontrolü (sadece sender_id varsa)
    // Status update ve mood update gibi çoklu alıcı bildirimlerinde
    // limit aşılan alıcıları filtrele, diğerlerine gönder
    let allowedReceiverIds: string[] = [];

    if (payload.sender_id && payload.receiver_ids && payload.receiver_ids.length > 0) {
      console.log('🔵 Rate limiting kontrolü başlatılıyor...', {
        sender_id: payload.sender_id,
        receiver_ids_count: payload.receiver_ids.length,
        type: payload.type,
      });

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const limitMinutes = RATE_LIMITS[payload.type] || 1;

      // Önce receiver_ids'lerin geçerli olup olmadığını kontrol et (users tablosunda var mı?)
      // Bu, foreign key constraint hatalarını önler
      console.log('🔵 Geçerli receiver_ids kontrol ediliyor...');
      const { data: validUsers, error: validUsersError } = await supabase
        .from('users')
        .select('id')
        .in('id', payload.receiver_ids);

      if (validUsersError) {
        console.error('❌ Geçerli users kontrolü hatası:', validUsersError);
        // Hata olsa bile devam et, rate limiting non-blocking
      }

      const validReceiverIds = validUsers?.map((u: { id: string }) => u.id) || [];
      console.log('🔵 Geçerli receiver_ids:', {
        total: payload.receiver_ids.length,
        valid: validReceiverIds.length,
        invalid: payload.receiver_ids.length - validReceiverIds.length,
      });
      
      if (validReceiverIds.length === 0) {
        console.error('❌ Tüm receiver_ids geçersiz');
        return new Response(
          JSON.stringify({ 
            error: 'Geçersiz alıcı ID\'leri',
            message: 'Tüm alıcı ID\'leri geçersiz veya kullanıcılar silinmiş.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sadece geçerli receiver_ids'leri kullan
      const validReceiverIdsSet = new Set(validReceiverIds);
      const filteredReceiverIds = payload.receiver_ids.filter(id => validReceiverIdsSet.has(id));
      console.log('🔵 Filtrelenmiş receiver_ids:', filteredReceiverIds.length);

      // Çoklu alıcı bildirimleri için (status_update, mood_update)
      const isMultiReceiver = payload.type === 'status_update' || payload.type === 'mood_update';
      console.log('🔵 Rate limiting tipi:', isMultiReceiver ? 'Multi-receiver (paralel)' : 'Single-receiver (sıralı)');

      // Çoklu alıcı bildirimlerinde paralel kontrol, tek alıcı bildirimlerinde sıralı kontrol
      if (isMultiReceiver) {
        // Paralel kontrol (performans için) - sadece geçerli receiver_ids'ler için
        console.log('🔵 Paralel rate limit kontrolü başlatılıyor...', filteredReceiverIds.length, 'receiver için');
        const rateLimitChecks = await Promise.allSettled(
          filteredReceiverIds.map(receiverId =>
            supabase.rpc('check_rate_limit', {
              p_sender_id: payload.sender_id,
              p_receiver_id: receiverId,
              p_group_id: payload.group_id,
              p_notification_type: payload.type,
              p_limit_minutes: limitMinutes,
            })
          )
        );

        // Sonuçları işle
        console.log('🔵 Rate limit kontrolü sonuçları işleniyor...');
        rateLimitChecks.forEach((result, index) => {
          const receiverId = filteredReceiverIds[index];

          if (result.status === 'fulfilled') {
            const { data: rateLimitCheck, error: rateLimitError } = result.value;

            if (rateLimitError) {
              console.error('Rate limit kontrolü hatası:', rateLimitError);
              // Hata olsa bile devam et (rate limiting non-blocking)
              allowedReceiverIds.push(receiverId);
            } else if (rateLimitCheck && rateLimitCheck.length > 0) {
              const { can_send } = rateLimitCheck[0];
              if (can_send) {
                allowedReceiverIds.push(receiverId);
              } else {
                // Rate limit aşıldı - bu alıcıyı atla
                console.log(`⚠️ Rate limit aşıldı: sender=${payload.sender_id}, receiver=${receiverId}, type=${payload.type}`);
              }
            } else {
              // Kayıt yoksa izin ver
              allowedReceiverIds.push(receiverId);
            }
          } else {
            // Promise rejected - hata durumunda izin ver (non-blocking)
            console.error('❌ Rate limit kontrolü promise hatası:', result.reason);
            allowedReceiverIds.push(receiverId);
          }
        });
        console.log('✅ Paralel rate limit kontrolü tamamlandı:', {
          total: filteredReceiverIds.length,
          allowed: allowedReceiverIds.length,
          blocked: filteredReceiverIds.length - allowedReceiverIds.length,
        });
      } else {
        // Tek alıcı bildirimlerinde sıralı kontrol (hata durumunda hemen durdur)
        // Sadece geçerli receiver_ids'ler için kontrol yap
        console.log('🔵 Sıralı rate limit kontrolü başlatılıyor...', filteredReceiverIds.length, 'receiver için');
        for (const receiverId of filteredReceiverIds) {
          console.log('🔵 Rate limit kontrolü:', { sender: payload.sender_id, receiver: receiverId, type: payload.type });
          const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
            'check_rate_limit',
            {
              p_sender_id: payload.sender_id,
              p_receiver_id: receiverId,
              p_group_id: payload.group_id,
              p_notification_type: payload.type,
              p_limit_minutes: limitMinutes,
            }
          );

          if (rateLimitError) {
            // Foreign key constraint hatası gibi hatalar için log'la ama devam et
            if (rateLimitError.code === '23503') {
              console.warn(`Rate limit kontrolü: receiver_id (${receiverId}) users tablosunda yok, atlanıyor`);
              // Bu receiver_id'yi atla
              continue;
            }
            console.error('Rate limit kontrolü hatası:', rateLimitError);
            // Diğer hatalar için devam et (rate limiting non-blocking)
            allowedReceiverIds.push(receiverId);
          } else if (rateLimitCheck && rateLimitCheck.length > 0 && rateLimitCheck[0]) {
          const { can_send, wait_until } = rateLimitCheck[0];
          
          if (can_send) {
            allowedReceiverIds.push(receiverId);
          } else {
              // Rate limit aşıldı - tek alıcı bildirimlerinde tüm bildirimi durdur
              const waitSeconds = Math.ceil((new Date(wait_until).getTime() - Date.now()) / 1000);
              const waitMinutes = Math.ceil(waitSeconds / 60);
              
              return new Response(
                JSON.stringify({
                  error: 'rate_limit_exceeded',
                  message: `Çok sık bildirim gönderiyorsunuz. Lütfen ${waitMinutes} dakika bekleyin.`,
                  wait_until: wait_until,
                  wait_seconds: waitSeconds,
                }),
                {
                  status: 429, // Too Many Requests
                  headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Retry-After': waitSeconds.toString(),
                  },
                }
              );
            }
          } else {
            // Kayıt yoksa izin ver
            allowedReceiverIds.push(receiverId);
          }
        }
      }

      // Çoklu alıcı bildirimlerinde hiçbir alıcıya gönderilemiyorsa hata döndür
      if (isMultiReceiver && allowedReceiverIds.length === 0) {
        console.error('❌ Tüm alıcılar için rate limit aşıldı');
        return new Response(
          JSON.stringify({
            error: 'rate_limit_exceeded',
            message: 'Tüm alıcılar için rate limit aşıldı. Lütfen bir süre bekleyin.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Çoklu alıcı bildirimlerinde limit aşmayan alıcıların receiver_ids'lerini filtrele
      // Artık player_id yerine external_id (receiver_id) kullanacağız
      if (isMultiReceiver) {
        // Sadece limit aşmayan alıcılara bildirim gönder
        payload.receiver_ids = allowedReceiverIds;
        console.log('✅ Rate limiting sonrası receiver_ids:', allowedReceiverIds.length);
      } else {
        // Tek alıcı bildirimlerinde zaten allowedReceiverIds kontrol edildi
        payload.receiver_ids = allowedReceiverIds;
        console.log('✅ Rate limiting sonrası receiver_ids:', allowedReceiverIds.length);
      }
    } else {
      console.log('ℹ️ Rate limiting atlandı (sender_id yok)');
    }

    // OneSignal API'ye bildirim gönder (Yeni API v2 formatı)
    // include_aliases.external_id kullanıyoruz (receiver_ids = Supabase user IDs = external_id)
    console.log('🔵 OneSignal payload hazırlanıyor...', {
      receiver_ids_count: payload.receiver_ids.length,
      receiver_ids_preview: payload.receiver_ids.slice(0, 3),
    });
    
    const oneSignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: payload.receiver_ids, // Supabase user IDs = OneSignal external_id
      },
      target_channel: 'push', // Push notification channel
      headings: {
        en: `${payload.group_name} - ${payload.title}`,
        tr: `${payload.group_name} - ${payload.title}`,
      },
      contents: {
        en: `${payload.group_name} grubundan: ${payload.message}`,
        tr: `${payload.group_name} grubundan: ${payload.message}`,
      },
      data: {
        group_id: payload.group_id,
        group_name: payload.group_name,
        type: payload.type,
      },
      // iOS ve Android için özel ayarlar
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    console.log('🔵 OneSignal API çağrısı yapılıyor (Yeni API v2):', {
      app_id: ONESIGNAL_APP_ID,
      endpoint: '/notifications?c=push',
      receiver_ids_count: payload.receiver_ids.length,
      receiver_ids_preview: payload.receiver_ids.slice(0, 3), // İlk 3'ü göster
      title: `${payload.group_name} - ${payload.title}`,
      message: `${payload.group_name} grubundan: ${payload.message}`,
    });

    // OneSignal REST API Key kontrolü ve doğrulama
    if (!ONESIGNAL_REST_API_KEY) {
      console.error('❌ ONESIGNAL_REST_API_KEY environment variable eksik!');
      return new Response(
        JSON.stringify({ 
          error: 'OneSignal REST API Key yapılandırılmamış',
          message: 'ONESIGNAL_REST_API_KEY environment variable eksik. Supabase Dashboard → Edge Functions → Settings → Secrets\'dan ekleyin.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // API Key format kontrolü
    if (!apiKeyValidation.valid) {
      console.error('❌ ONESIGNAL_REST_API_KEY format hatası:', apiKeyValidation.error);
      return new Response(
        JSON.stringify({ 
          error: 'OneSignal REST API Key format hatası',
          message: `API Key geçersiz: ${apiKeyValidation.error}. Lütfen Supabase Dashboard → Edge Functions → Settings → Secrets\'dan doğru API Key'i ekleyin.`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OneSignal REST API Authorization header formatı (Yeni API v2)
    // Yeni API için: Authorization: Key {REST_API_KEY}
    // API Key'in başında "Key " prefix'i olmamalı, sadece API key olmalı
    // OneSignal API Key formatı: "os_v2_app_..." veya benzeri
    // Authorization header: "Key os_v2_app_..." formatında olmalı
    const authorizationHeader = `Key ${ONESIGNAL_REST_API_KEY.trim()}`;

    // Yeni API endpoint: /notifications?c=push
    const oneSignalApiUrl = 'https://api.onesignal.com/notifications?c=push';

    console.log('🔵 OneSignal API çağrısı detayları (Yeni API v2):', {
      url: oneSignalApiUrl,
      method: 'POST',
      app_id: ONESIGNAL_APP_ID,
      receiver_ids_count: payload.receiver_ids.length,
      authorization_header_preview: `${authorizationHeader.substring(0, 25)}...`,
      api_key_length: ONESIGNAL_REST_API_KEY.length,
      api_key_preview: apiKeyPreview,
      api_key_starts_with: ONESIGNAL_REST_API_KEY.substring(0, 10),
      api_key_ends_with: ONESIGNAL_REST_API_KEY.substring(ONESIGNAL_REST_API_KEY.length - 10),
    });

    const oneSignalResponse = await fetch(oneSignalApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    if (!oneSignalResponse.ok) {
      const errorText = await oneSignalResponse.text();
      let errorDetails: any = {
        status: oneSignalResponse.status,
        statusText: oneSignalResponse.statusText,
        error: errorText,
      };

      // 403 Forbidden hatası için özel kontrol
      if (oneSignalResponse.status === 403) {
        errorDetails.diagnosis = {
          possible_causes: [
            'API Key yanlış veya geçersiz',
            'API Key formatı hatalı (başında/sonunda boşluk olabilir)',
            'API Key bu App ID için yetkisiz',
            'API Key süresi dolmuş veya iptal edilmiş',
          ],
          api_key_length: ONESIGNAL_REST_API_KEY.length,
          api_key_preview: apiKeyPreview,
          authorization_header_preview: `${authorizationHeader.substring(0, 20)}...`,
          troubleshooting: 'Supabase Dashboard → Edge Functions → Settings → Secrets\'dan ONESIGNAL_REST_API_KEY\'i kontrol edin. OneSignal Dashboard → Settings → Keys & IDs\'den REST API Key\'i doğrulayın.',
        };
      }

      console.error('❌ OneSignal API hatası:', errorDetails);
      
      return new Response(
        JSON.stringify({ 
          error: 'OneSignal bildirim gönderme hatası', 
          details: errorText,
          status: oneSignalResponse.status,
          diagnosis: errorDetails.diagnosis || undefined,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const oneSignalResult = await oneSignalResponse.json();
    console.log('✅ OneSignal bildirim gönderildi:', {
      id: oneSignalResult.id,
      recipients: oneSignalResult.recipients,
      errors: oneSignalResult.errors,
    });

    return new Response(
      JSON.stringify({ success: true, result: oneSignalResult }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Bildirim gönderme hatası (catch bloğu):', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Hata detayları:', {
      message: errorMessage,
      stack: errorStack,
      error_type: error?.constructor?.name || typeof error,
    });
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

