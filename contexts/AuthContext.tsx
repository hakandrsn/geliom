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
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Çıkış hatası:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Çıkış hatası:', errorMessage);
      setSession(null);
      setUser(null);
      setIsLoading(false);
      throw new Error(errorMessage);
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
        // NOT: OneSignal login onAuthStateChange içinde yapılıyor
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Auth initialization error:', errorMessage);
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
      setSession(currentSession);

      if (currentSession?.user) {
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
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('❌ Logout hatası:', errorMessage);
            });
          }
        }).catch((error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Profile update error (non-blocking):', errorMessage);
        });

        // OneSignal'e kullanıcıyı login et (sessizce, arka planda)
        loginOneSignal(supabaseUser.id)
          .then(async () => {
            // Player ID'yi al ve kaydet
            await new Promise(resolve => setTimeout(resolve, 500));
            const playerId = await getOneSignalPlayerId();
            
            if (playerId && supabaseUser.id) {
              try {
                await updateUser.mutateAsync({
                  id: supabaseUser.id,
                  updates: { onesignal_player_id: playerId },
                });
              } catch (error: any) {
                // Kullanıcı bulunamadıysa logout yap
                if (error?.code === 'USER_NOT_FOUND' || error?.code === 'PGRST116') {
                  await signOut();
                }
              }
            }
          })
          .catch(() => {
            // Sessizce devam et
          });

        // Session değiştiğinde query'yi invalidate et
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      } else {
        setUser(null);
        logoutOneSignal();
        queryClient.removeQueries({ queryKey: userKeys.all });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Current user profile değiştiğinde state'i güncelle
  useEffect(() => {
    setUser(currentUserProfile || null);
  }, [currentUserProfile]);

  // Kullanıcı bulunamadığında (DB'den silinmişse) logout yap
  useEffect(() => {
    const errorCode = (currentUserError as any)?.code;
    if (currentUserError && errorCode === 'USER_NOT_FOUND' && session) {
      console.warn('⚠️ Kullanıcı DB\'de bulunamadı (useCurrentUser), logout yapılıyor...');
      signOut().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Logout hatası:', errorMessage);
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
      // Ama eğer error varsa ve USER_NOT_FOUND ise → logout yapılacak
      setIsLoading(currentUserLoading);
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
