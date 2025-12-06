import { useAuth } from '@/contexts/AuthContext';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { adapty } from 'react-native-adapty';
import Provider from './Provider';

let isAdaptyActivated = false;
let isSplashShown = false;
let isAppInitialized = false;



const activateAdapty = async () => {
  if (isAdaptyActivated) {
    console.log('Adapty zaten activate edilmiş, tekrar activate edilmiyor.');
    return;
  }
  const key = process.env.EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY || '';
  if (!key) {
    console.warn('Adapty key bulunamadı!');
    return;
  }

  try {
    await adapty.activate(key, { lockMethodsUntilReady: true });
    isAdaptyActivated = true;
    console.log('✅ Adapty başarıyla activate edildi.');
  } catch (error) {
    console.error('❌ Adapty activation hatası:', error);
    // Hata durumunda da flag'i true yap ki tekrar denemesin
    isAdaptyActivated = true;
  }
};

if (!isAdaptyActivated) {
  activateAdapty();
}

// Ana Layout Component'i - Auth state'e göre routing yapar
function RootLayoutContent() {
  const { session } = useAuth();
  const { isInitialized, isLoading } = useAppInitialization();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialization tamamlanmadıysa bekle (auth + groups)
    if (!isInitialized || isLoading) {
      console.log('🔵 Layout: Initialization devam ediyor, bekliyor...');
      return;
    }

    console.log('🔵 Layout: Initialization tamamlandı, routing yapılıyor...');

    const inAuthGroup = segments[0] === '(auth)';

    // Session yoksa ve login sayfasında değilse, login'e yönlendir
    if (!session && !inAuthGroup) {
      console.log('🔵 Layout: Session yok, login\'e yönlendiriliyor');
      router.replace('/(auth)/login');
    }
    // Session varsa ve login sayfasındaysa, home'a yönlendir
    else if (session && inAuthGroup) {
      console.log('🔵 Layout: Session var, home\'a yönlendiriliyor');
      router.replace('/(drawer)/home');
    }
  }, [session, isInitialized, isLoading, segments]);

  return <Slot />;
}

// Provider ile sarmalanmış ana layout
export default function RootLayout() {
  return (
    <Provider>
      <RootLayoutContent />
    </Provider>
  );
}
