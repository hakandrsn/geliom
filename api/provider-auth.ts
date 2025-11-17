import type { User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type {
  AuthError,
  AuthProvider,
  NormalizedUserData,
  SupabaseUserMetadata
} from '../types/auth';
import type { UpdateUser } from '../types/database';
import { supabase } from './supabase';

// WebBrowser'ı kapatmak için
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth Redirect URL
 * app.json'daki scheme kullanılır: geliom://
 */
const REDIRECT_URL = AuthSession.makeRedirectUri({
  scheme: 'geliom',
  path: 'auth/callback',
});

/**
 * Google ile giriş yap
 * Supabase OAuth kullanarak Google authentication
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    console.log('🔵 signInWithGoogle başlatılıyor...');
    console.log('🔵 Redirect URL:', REDIRECT_URL);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    console.log('🔵 OAuth response - data:', data);
    console.log('🔵 OAuth response - error:', error);

    if (error) {
      console.error('❌ OAuth error:', error);
      return {
        error: {
          code: 'PROVIDER_ERROR',
          message: error.message,
          originalError: error,
        },
      };
    }

    if (!data?.url) {
      console.error('❌ OAuth URL alınamadı');
      return {
        error: {
          code: 'PROVIDER_ERROR',
          message: 'OAuth URL alınamadı',
        },
      };
    }

    console.log('✅ OAuth URL alındı, web browser açılıyor:', data.url);

    // Web browser'da OAuth URL'ini aç
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      REDIRECT_URL
    );

    console.log('🔵 WebBrowser result:', result);

    if (result.type === 'cancel') {
      console.log('ℹ️ Kullanıcı OAuth işlemini iptal etti');
      return {
        error: {
          code: 'CANCELLED',
          message: 'Giriş iptal edildi',
        },
      };
    }

    if (result.type === 'success' && result.url) {
      console.log('✅ OAuth callback URL alındı:', result.url);

      // URL'den hash fragment'i çıkar (React Native'de query params yerine hash kullanılır)
      const hashParams = new URLSearchParams(result.url.split('#')[1] || '');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      console.log('🔵 Access token var mı:', !!accessToken);
      console.log('🔵 Refresh token var mı:', !!refreshToken);

      if (accessToken && refreshToken) {
        console.log('✅ Tokens alındı, session oluşturuluyor...');
        console.log('🔵 Access token (ilk 20 karakter):', accessToken.substring(0, 20));
        console.log('🔵 Refresh token (ilk 20 karakter):', refreshToken.substring(0, 20));

        try {
          // Session'ı set et
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Session oluşturma hatası:', sessionError);
            console.error('❌ Session error code:', sessionError.code);
            console.error('❌ Session error message:', sessionError.message);
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: sessionError.message,
                originalError: sessionError,
              },
            };
          }

          if (!sessionData?.session) {
            console.error('❌ Session data yok!');
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: 'Session oluşturulamadı - session data yok',
              },
            };
          }

          console.log('✅ Session başarıyla oluşturuldu');
          console.log('✅ Session user:', sessionData.session.user?.email);
          console.log('✅ Session expires at:', sessionData.session.expires_at);

          // Session'ın gerçekten set edildiğini doğrula (polling, max 3 saniye)
          const maxWaitTime = 3000; // 3 saniye
          const pollInterval = 100; // 100ms
          const startTime = Date.now();
          let verified = false;

          while (Date.now() - startTime < maxWaitTime && !verified) {
            const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();

            if (verifySession && verifySession.user?.id === sessionData.session.user?.id) {
              console.log('✅ Session doğrulandı, user:', verifySession.user?.email);
              verified = true;
              break;
            }

            if (verifyError) {
              console.error('❌ Session doğrulama hatası:', verifyError);
            }

            // Bir sonraki kontrol için bekle
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }

          if (!verified) {
            console.error('❌ Session doğrulanamadı - timeout');
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: 'Session doğrulanamadı. Lütfen tekrar deneyin.',
              },
            };
          }

          // Auth state change listener otomatik tetiklenecek
          return { error: null };
        } catch (error) {
          console.error('❌ setSession exception:', error);
          return {
            error: {
              code: 'PROVIDER_ERROR',
              message: 'Session oluşturulurken hata oluştu',
              originalError: error,
            },
          };
        }
      } else {
        // Eğer hash'te yoksa, query params'ta olabilir
        const queryParams = new URLSearchParams(result.url.split('?')[1]?.split('#')[0] || '');
        const queryAccessToken = queryParams.get('access_token');
        const queryRefreshToken = queryParams.get('refresh_token');

        if (queryAccessToken && queryRefreshToken) {
          console.log('✅ Tokens query params\'tan alındı, session oluşturuluyor...');

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: queryAccessToken,
            refresh_token: queryRefreshToken,
          });

          if (sessionError) {
            console.error('❌ Session oluşturma hatası:', sessionError);
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: sessionError.message,
                originalError: sessionError,
              },
            };
          }

          if (!sessionData?.session) {
            console.error('❌ Session data yok!');
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: 'Session oluşturulamadı - session data yok',
              },
            };
          }

          console.log('✅ Session başarıyla oluşturuldu');
          console.log('✅ Session user:', sessionData.session.user?.email);

          // Session'ın gerçekten set edildiğini doğrula (polling, max 3 saniye)
          const maxWaitTime = 3000; // 3 saniye
          const pollInterval = 100; // 100ms
          const startTime = Date.now();
          let verified = false;

          while (Date.now() - startTime < maxWaitTime && !verified) {
            const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();

            if (verifySession && verifySession.user?.id === sessionData.session.user?.id) {
              console.log('✅ Session doğrulandı, user:', verifySession.user?.email);
              verified = true;
              break;
            }

            if (verifyError) {
              console.error('❌ Session doğrulama hatası:', verifyError);
            }

            // Bir sonraki kontrol için bekle
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }

          if (!verified) {
            console.error('❌ Session doğrulanamadı - timeout');
            return {
              error: {
                code: 'PROVIDER_ERROR',
                message: 'Session doğrulanamadı. Lütfen tekrar deneyin.',
              },
            };
          }

          return { error: null };
        }

        console.error('❌ Tokens bulunamadı. URL:', result.url);
        return {
          error: {
            code: 'PROVIDER_ERROR',
            message: 'OAuth token\'ları alınamadı',
          },
        };
      }
    }

    console.error('❌ Beklenmeyen OAuth sonucu:', result);
    return {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'OAuth işlemi tamamlanamadı',
      },
    };
  } catch (error) {
    console.error('❌ signInWithGoogle exception:', error);
    return {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Google ile giriş yapılamadı',
        originalError: error,
      },
    };
  }
}

/**
 * Apple ile giriş yap
 * Native Apple Sign In kullanarak (sadece iOS)
 */
export async function signInWithApple(): Promise<{ error: AuthError | null }> {
  // Sadece iOS'ta çalışır
  if (Platform.OS !== 'ios') {
    return {
      error: {
        code: 'PROVIDER_ERROR',
        message: 'Apple Sign In sadece iOS cihazlarda kullanılabilir',
      },
    };
  }

  try {
    // Apple native authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Apple identity token alınamadı',
        },
      };
    }

    // Bundle identifier'ı al (Supabase Apple provider client_id olarak kullanılır)
    const bundleIdentifier = Constants.expoConfig?.ios?.bundleIdentifier || 'com.eoist.geliom';

    console.log('🍎 Apple login - Bundle identifier:', bundleIdentifier);
    console.log('🍎 Apple login - Identity token alındı');

    // Supabase'e identity token ile giriş yap
    // client_id parametresi, Supabase'deki Apple provider'ın Service ID'si ile eşleşmeli
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      // client_id: bundleIdentifier, // Supabase'in signInWithIdToken'ı client_id'yi desteklemiyor
      // Bunun yerine Supabase dashboard'da Apple provider'ın Service ID'si bundle identifier ile eşleşmeli
    });

    if (error) {
      // "Unacceptable audience" hatası genellikle Expo Go kullanımından veya Supabase yapılandırmasından kaynaklanır
      let errorMessage = error.message;

      if (error.message?.includes('Unacceptable audience') || error.message?.includes('audience')) {
        errorMessage = `Apple login hatası: Token audience uyumsuzluğu. 
        
Bu hata genellikle şu durumlardan kaynaklanır:
1. Expo Go kullanıyorsanız, development build kullanmanız gerekiyor
2. Supabase dashboard'da Apple provider'ın Service ID'si "${bundleIdentifier}" ile eşleşmeli
3. Apple Developer Console'da Service ID'nin bundle identifier'ı "${bundleIdentifier}" olmalı

Lütfen Supabase dashboard'da Apple provider ayarlarını kontrol edin.`;
      }

      console.error('❌ Apple sign in error:', error);
      console.error('❌ Bundle identifier:', bundleIdentifier);

      return {
        error: {
          code: 'PROVIDER_ERROR',
          message: errorMessage,
          originalError: error,
        },
      };
    }

    if (!data?.session) {
      console.error('❌ Apple sign in: Session data yok!');
      return {
        error: {
          code: 'PROVIDER_ERROR',
          message: 'Session oluşturulamadı - session data yok',
        },
      };
    }

    console.log('✅ Apple sign in: Session başarıyla oluşturuldu');
    console.log('✅ Session user:', data.session.user?.email);

    // Session'ın gerçekten set edildiğini doğrula (polling, max 3 saniye)
    const maxWaitTime = 3000; // 3 saniye
    const pollInterval = 100; // 100ms
    const startTime = Date.now();
    let verified = false;

    while (Date.now() - startTime < maxWaitTime && !verified) {
      const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();

      if (verifySession && verifySession.user?.id === data.session.user?.id) {
        console.log('✅ Apple sign in: Session doğrulandı, user:', verifySession.user?.email);
        verified = true;
        break;
      }

      if (verifyError) {
        console.error('❌ Apple sign in: Session doğrulama hatası:', verifyError);
      }

      // Bir sonraki kontrol için bekle
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    if (!verified) {
      console.error('❌ Apple sign in: Session doğrulanamadı - timeout');
      return {
        error: {
          code: 'PROVIDER_ERROR',
          message: 'Session doğrulanamadı. Lütfen tekrar deneyin.',
        },
      };
    }

    return { error: null };
  } catch (error: any) {
    // Kullanıcı iptal etti
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        error: {
          code: 'CANCELLED',
          message: 'Giriş iptal edildi',
          originalError: error,
        },
      };
    }

    return {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Apple ile giriş yapılamadı',
        originalError: error,
      },
    };
  }
}

/**
 * Supabase User objesinden normalized data çıkar
 * Apple ve Google metadata farklarını handle eder
 */
export function normalizeUserData(
  supabaseUser: User,
  provider: AuthProvider
): NormalizedUserData {
  const metadata = supabaseUser.user_metadata as SupabaseUserMetadata;
  const appMetadata = supabaseUser.app_metadata || {};

  // Display name: full_name, name veya email'den extract
  let displayName: string | null = null;
  if (metadata?.full_name) {
    displayName = metadata.full_name;
  } else if (metadata?.name) {
    displayName = metadata.name;
  } else if (supabaseUser.email) {
    // Email'den kullanıcı adı çıkar (örn: hakan@gmail.com -> hakan)
    displayName = supabaseUser.email.split('@')[0];
  }

  // Photo URL: avatar_url veya picture
  const photoUrl: string | null =
    metadata?.avatar_url || metadata?.picture || null;

  return {
    id: supabaseUser.id, // UUID - Supabase auth.users'dan
    email: supabaseUser.email || null,
    displayName: displayName || null,
    photoUrl: photoUrl || null,
    provider,
  };
}

/**
 * Kullanıcı profilini oluştur veya güncelle
 * NOT: custom_user_id database trigger/function tarafından otomatik oluşturulur
 * Bu fonksiyon sadece email ve diğer profil bilgilerini günceller
 */
export async function createOrUpdateUserProfile(
  normalizedData: NormalizedUserData
): Promise<{ data: any | null; error: AuthError | null }> {
  try {
    console.log('🔵 createOrUpdateUserProfile başlatıldı, user ID:', normalizedData.id);

    // Database trigger anında çalıştığı için kullanıcı zaten oluşturulmuş olmalı
    // Sadece profil bilgilerini güncelle
    const updateData: UpdateUser = {
      email: normalizedData.email ?? undefined,
      display_name: normalizedData.displayName ?? undefined,
      photo_url: normalizedData.photoUrl ?? undefined,
      // custom_user_id güncellenmez - database trigger tarafından oluşturulur
    };

    // Sadece undefined olmayan alanları güncelle
    const filteredUpdateData: UpdateUser = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    ) as UpdateUser;

    if (Object.keys(filteredUpdateData).length === 0) {
      console.log('ℹ️ Güncellenecek alan yok, mevcut profili getir...');
      // Güncellenecek alan yoksa mevcut profili getir
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', normalizedData.id)
        .single();

      if (fetchError) {
        console.error('❌ User fetch error:', fetchError);
        return {
          data: null,
          error: {
            code: 'PROVIDER_ERROR',
            message: `Kullanıcı profili bulunamadı: ${fetchError.message}`,
            originalError: fetchError,
          },
        };
      }

      return { data: existingUser, error: null };
    }

    console.log('🔵 Update data:', filteredUpdateData);

    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdateData)
      .eq('id', normalizedData.id)
      .select()
      .single();

    if (error) {
      // Eğer kullanıcı bulunamadıysa (PGRST116), database trigger henüz çalışmamış olabilir
      // Bu durumda kısa bir bekleme yap ve tekrar dene (sadece 1 kez)
      if (error.code === 'PGRST116') {
        console.log('⏳ User profile henüz oluşturulmamış, kısa bir bekleme...');
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .update(filteredUpdateData)
          .eq('id', normalizedData.id)
          .select()
          .single();

        if (retryError) {
          console.error('❌ User update retry error:', retryError);
          return {
            data: null,
            error: {
              code: 'PROVIDER_ERROR',
              message: `Kullanıcı profili güncellenemedi: ${retryError.message}`,
              originalError: retryError,
            },
          };
        }

        console.log('✅ User profile güncellendi (retry):', retryData?.id);
        return { data: retryData, error: null };
      }

      console.error('❌ User update error:', error);
      return {
        data: null,
        error: {
          code: 'PROVIDER_ERROR',
          message: `Kullanıcı profili güncellenemedi: ${error.message}`,
          originalError: error,
        },
      };
    }

    console.log('✅ User profile güncellendi:', data?.id);
    return { data, error: null };
  } catch (error) {
    console.error('❌ createOrUpdateUserProfile exception:', error);
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Kullanıcı profili işlemi başarısız',
        originalError: error,
      },
    };
  }
}

/**
 * Provider'dan provider tipini belirle
 */
export function getProviderFromUser(user: User): AuthProvider {
  const providers = user.app_metadata?.providers || [];

  if (providers.includes('apple')) {
    return 'apple';
  }

  if (providers.includes('google')) {
    return 'google';
  }

  // Default olarak google döndür
  return 'google';
}

