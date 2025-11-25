import { useAuth } from '@/contexts/AuthContext';
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

// Ana Layout Component'i - Sadece yapıyı gösterir ve routing yapar
function RootLayoutContent() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Yükleme tamamlanmadıysa bir şey yapma.
    if (isLoading) {
      console.log('🔵 Layout: Loading, routing bekleniyor...');
      return;
    }

    console.log('🔵 Layout: Routing kontrolü - session:', !!session, 'segments:', segments);

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      console.log('🔵 Layout: Session yok, login sayfasına yönlendiriliyor...');
      router.replace('/(auth)/login');
    }
    else if (session && inAuthGroup) {
      console.log('🔵 Layout: Session var ve auth grubunda, ana sayfaya yönlendiriliyor...');
      router.replace('/(drawer)/home');
    }
    else if (session && !inAuthGroup) {
      console.log('🔵 Layout: Session var, zaten doğru sayfada');
    }
  }, [session, isLoading, segments, router]);

  // Yönlendirme mantığı tamamlandığında, ilgili ekranı göster.
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
