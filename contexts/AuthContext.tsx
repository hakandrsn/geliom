import { createOrUpdateUserProfile, getProviderFromUser, normalizeUserData } from '@/api/provider-auth';
import { supabase } from '@/api/supabase';
import { useCurrentUser, useUpdateUser, userKeys } from '@/api/users';
import { getOneSignalPlayerId, loginOneSignal, logoutOneSignal } from '@/services/onesignal';
import type { User as DatabaseUser } from '@/types/database';
import { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Auth Context'i oluştur.
// Bu context, sadece oturum bilgilerini ve kullanıcı profilini tutacak.
// Geri kalan tüm verileri (gruplar, durumlar vb.) TanStack Query yönetecek.
const AuthContext = createContext({
  session: null as Session | null,
  user: null as DatabaseUser | null,
  isLoading: true,
  initializeAuth: async () => {},
  signOut: async () => {},
});

// Auth Provider Component'i
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mevcut kullanıcı profilini fetch et
  const { 
    data: currentUserProfile, 
    refetch: refetchUserProfile, 
    error: currentUserError,
    isLoading: currentUserLoading,
    isError: currentUserIsError
  } = useCurrentUser();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();

  // Çıkış yapma fonksiyonu
  const signOut = useCallback(async () => {
    try {
      console.log('🔵 SignOut başlatılıyor...');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ SignOut başarılı, state temizleniyor...');
      // onAuthStateChange listener otomatik olarak SIGNED_OUT event'ini tetikleyecek
      // Orada state temizlenecek, burada sadece log'layalım
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
      // Hata olsa bile state'i temizle
      setSession(null);
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  }, []);

  // Auth initialization fonksiyonu
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Mevcut session'ı kontrol et
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        // User profile'ı fetch et
        await refetchUserProfile();
        
        // Session varsa OneSignal login yap (app açıldığında kullanıcı zaten login ise)
        const supabaseUser = currentSession.user;
        if (supabaseUser?.id) {
          console.log('🔵 App açıldığında session var, OneSignal login yapılıyor...');
          loginOneSignal(supabaseUser.id)
            .then(async () => {
              console.log('✅ OneSignal login başarılı (initializeAuth), Player ID kaydediliyor...');
              
              // Login başarılı olduktan sonra Player ID'yi al ve kaydet
              // Biraz bekle, SDK'nın internal state'ini güncellemesi için
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const playerId = await getOneSignalPlayerId();
              if (playerId && supabaseUser.id) {
                try {
                  await updateUser.mutateAsync({
                    id: supabaseUser.id,
                    updates: { onesignal_player_id: playerId },
                  });
                  console.log('✅ OneSignal Player ID kaydedildi (initializeAuth):', playerId);
                } catch (error: any) {
                  // Kullanıcı bulunamadıysa (DB'den silinmişse), logout yap
                  if (error?.code === 'USER_NOT_FOUND' || error?.code === 'PGRST116') {
                    console.warn('⚠️ Kullanıcı DB\'de bulunamadı, logout yapılıyor...');
                    await signOut();
                  } else {
                    console.error('❌ OneSignal Player ID kaydetme hatası (initializeAuth):', error);
                    // Player ID kaydetme hatası kritik değil, devam et
                  }
                }
              } else {
                console.warn('⚠️ OneSignal Player ID alınamadı, kaydedilemedi (initializeAuth). Subscription henüz oluşmamış olabilir.');
                // Player ID yoksa, subscription oluşunca otomatik olarak kaydedilecek
              }
            })
            .catch((error) => {
              console.error('❌ OneSignal login hatası (initializeAuth, non-blocking):', error);
              // OneSignal login hatası kritik değil, uygulama çalışmaya devam eder
              console.warn('⚠️ OneSignal login başarısız oldu (initializeAuth). Kullanıcı bildirimleri alamayabilir. Hata:', error.message || error);
            });
        }
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refetchUserProfile, updateUser, signOut]);

  // Auth state change listener - sadece session state'ini yönetir
  useEffect(() => {
    // İlk session kontrolü
    initializeAuth();

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔵 Auth state changed:', event, currentSession?.user?.email);

      setSession(currentSession);

      if (currentSession?.user) {
        console.log('✅ Auth state: User var, profil güncelleniyor...');
        const supabaseUser = currentSession.user;
        const provider = getProviderFromUser(supabaseUser);
        const normalizedData = normalizeUserData(supabaseUser, provider);

        // Profil bilgilerini güncelle (useCurrentUser hook'u profile'ı fetch edecek)
        createOrUpdateUserProfile(normalizedData).then((result) => {
          // Kullanıcı bulunamadıysa (DB'den silinmişse), logout yap
          const errorCode = (result.error as any)?.code;
          if (result.error && errorCode === 'USER_NOT_FOUND') {
            console.warn('⚠️ Kullanıcı DB\'de bulunamadı, logout yapılıyor...');
            signOut().catch((error) => {
              console.error('❌ Logout hatası:', error);
            });
          }
        }).catch((error) => {
          console.error('❌ Profile update error (non-blocking):', error);
        });

        // OneSignal'e kullanıcıyı login et (external ID olarak Supabase auth ID)
        // Bu, OneSignal Dashboard'da kullanıcıyı external ID ile bulmamızı sağlar
        // loginOneSignal içinde zaten Player ID hazır olana kadar bekliyor ve retry mekanizması var
        loginOneSignal(supabaseUser.id)
          .then(async () => {
            console.log('✅ OneSignal login başarılı, Player ID kaydediliyor...');
            
            // Login başarılı olduktan sonra Player ID'yi al ve kaydet
            // Biraz bekle, SDK'nın internal state'ini güncellemesi için
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const playerId = await getOneSignalPlayerId();
            if (playerId && supabaseUser.id) {
              try {
                await updateUser.mutateAsync({
                  id: supabaseUser.id,
                  updates: { onesignal_player_id: playerId },
                });
                console.log('✅ OneSignal Player ID kaydedildi:', playerId);
              } catch (error: any) {
                // Kullanıcı bulunamadıysa (DB'den silinmişse), logout yap
                if (error?.code === 'USER_NOT_FOUND' || error?.code === 'PGRST116') {
                  console.warn('⚠️ Kullanıcı DB\'de bulunamadı, logout yapılıyor...');
                  await signOut();
                } else {
                  console.error('❌ OneSignal Player ID kaydetme hatası:', error);
                  // Player ID kaydetme hatası kritik değil, devam et
                }
              }
            } else {
              console.warn('⚠️ OneSignal Player ID alınamadı, kaydedilemedi. Subscription henüz oluşmamış olabilir.');
              // Player ID yoksa, subscription oluşunca otomatik olarak kaydedilecek
            }
          })
          .catch((error) => {
            console.error('❌ OneSignal login hatası (non-blocking):', error);
            // OneSignal login hatası kritik değil, uygulama çalışmaya devam eder
            // Ama kullanıcı bildirimleri alamayabilir
            console.warn('⚠️ OneSignal login başarısız oldu. Kullanıcı bildirimleri alamayabilir. Hata:', error.message || error);
          });

        // Session değiştiğinde query'yi invalidate et (useCurrentUser hook'u refetch yapacak)
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      } else {
        // SIGNED_OUT veya TOKEN_REFRESHED (session null) event'i
        console.log('🔵 Auth state: Session yok, cache temizleniyor...');
        setUser(null);
        
        // OneSignal'den logout et
        logoutOneSignal();
        
        // User ile ilgili tüm query'leri temizle
        queryClient.removeQueries({ queryKey: userKeys.all });
        console.log('✅ User query cache temizlendi');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Current user profile değiştiğinde state'i güncelle
  useEffect(() => {
    if (currentUserProfile) {
      console.log('✅ AuthContext: User profile set edildi:', currentUserProfile.id);
      setUser(currentUserProfile);
    } else {
      setUser(null);
    }
  }, [currentUserProfile]);

  // Kullanıcı bulunamadığında (DB'den silinmişse) logout yap
  useEffect(() => {
    const errorCode = (currentUserError as any)?.code;
    if (currentUserError && errorCode === 'USER_NOT_FOUND' && session) {
      console.warn('⚠️ Kullanıcı DB\'de bulunamadı (useCurrentUser), logout yapılıyor...');
      signOut().catch((error) => {
        console.error('❌ Logout hatası:', error);
      });
    }
  }, [currentUserError, session, signOut]);

  // Loading state logic
  useEffect(() => {
    if (!session) {
      // Session yoksa loading false
      setIsLoading(false);
    } else if (session && currentUserProfile) {
      // Session var ve profile geldiyse loading false
      setIsLoading(false);
    } else if (session && !currentUserProfile) {
      // Session var ama profile henüz yok
      // Eğer query hala loading ise → loading true
      // Eğer query tamamlandıysa (isLoading false) → loading false
      // Ama eğer error varsa ve USER_NOT_FOUND ise → logout yapılacak (yukarıdaki useEffect'te)
      setIsLoading(currentUserLoading);
      
      // Eğer query tamamlandı ama profile hala null ise ve error yoksa
      // Bu durumda database trigger henüz çalışmamış olabilir, biraz bekle
      if (!currentUserLoading && !currentUserError && !currentUserProfile) {
        console.log('⏳ Session var ama profile henüz yok, database trigger bekleniyor...');
        // Bu durumda loading false yap (çünkü query tamamlandı)
        // Ama kullanıcı gösterilemez, bu normal (database trigger çalışana kadar)
      }
    }
  }, [session, currentUserProfile, currentUserLoading, currentUserError]);

  const value = React.useMemo(() => ({
    session,
    user,
    isLoading,
    initializeAuth,
    signOut
  }), [session, user, isLoading, initializeAuth, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Context'i kolayca kullanmak için custom hook.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
