import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import Provider from './Provider';

// Ana Layout Component'i - Auth state'e göre routing yapar
function RootLayoutContent() {
  const { session } = useAuth();
  const { isInitialized, isLoading } = useAppInitialization();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialization tamamlanmadıysa bekle (auth + groups)
    if (!isInitialized || isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // Session yoksa ve login sayfasında değilse, login'e yönlendir
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    // Session varsa ve login sayfasındaysa, home'a yönlendir
    else if (session && inAuthGroup) {
      router.replace('/(drawer)/home');
    }
  }, [session, isInitialized, isLoading, segments]);

  return <Slot />;
}

// Provider ile sarmalanmış ana layout
export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <Provider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootLayoutContent />
    </Provider>
  );
}
