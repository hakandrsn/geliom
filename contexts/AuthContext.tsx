import { GeliomUser, MOCK_SESSION, MOCK_USER } from '@/types/user';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Auth Context'i oluştur.
// Bu context, sadece oturum bilgilerini ve kullanıcı profilini tutacak.
// Geri kalan tüm verileri (gruplar, durumlar vb.) TanStack Query yönetecek.
const AuthContext = createContext({
  session: null as Session | null,
  user: null as GeliomUser | null,
  isLoading: true,
  initializeAuth: () => {},
  signOut: async () => {},
});

// Auth Provider Component'i
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Mock data ile direkt başlat - loading'e gerek yok
  const [session, setSession] = useState<Session | null>(MOCK_SESSION as any);
  const [user, setUser] = useState<GeliomUser | null>(MOCK_USER);
  const [isLoading, setIsLoading] = useState(false); // Mock için false

  // Auth initialization fonksiyonu - Mock için basit
  const initializeAuth = useCallback(async () => {
    // Mock data zaten set edildi, sadece log at
    console.log('Mock auth already initialized:', MOCK_USER.display_name);
  }, []);

  // Çıkış yapma fonksiyonu - Mock için
  const signOut = useCallback(async () => {
    try {
      console.log('Mock sign out');
      setSession(null);
      setUser(null);
      // Gerçek uygulamada burada login sayfasına yönlendirilecek
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    }
  }, []);

  // Mock için basitleştirilmiş useEffect
  useEffect(() => {
    // Mock data için herhangi bir listener gerekmez
    // Gerçek uygulamada Supabase auth listener burada olacak
    console.log('AuthProvider mounted with mock data');
    
    return () => {
      console.log('AuthProvider cleanup');
    };
  }, []);

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
