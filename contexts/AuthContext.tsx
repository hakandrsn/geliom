import { createOrUpdateUserProfile, getProviderFromUser, normalizeUserData } from '@/api/provider-auth';
import { supabase } from '@/api/supabase';
import { useCurrentUser, userKeys } from '@/api/users';
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
  const { data: currentUserProfile, refetch: refetchUserProfile } = useCurrentUser();
  const queryClient = useQueryClient();

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
  }, [refetchUserProfile]);

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
        createOrUpdateUserProfile(normalizedData).catch((error) => {
          console.error('❌ Profile update error (non-blocking):', error);
        });

        // Session değiştiğinde query'yi invalidate et (useCurrentUser hook'u refetch yapacak)
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      } else {
        // SIGNED_OUT veya TOKEN_REFRESHED (session null) event'i
        console.log('🔵 Auth state: Session yok, cache temizleniyor...');
        setUser(null);
        
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

  // Loading state logic - sadece session && !currentUserProfile durumunda loading
  useEffect(() => {
    if (!session) {
      // Session yoksa loading false
      setIsLoading(false);
    } else if (session && currentUserProfile) {
      // Session var ve profile geldiyse loading false
      setIsLoading(false);
    } else if (session && !currentUserProfile) {
      // Session var ama profile henüz yok - loading true
      setIsLoading(true);
    }
  }, [session, currentUserProfile]);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, initializeAuth, signOut }}>
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
