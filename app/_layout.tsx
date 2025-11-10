import { useAuth } from '@/contexts/AuthContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { Provider } from './Provider';

// Ana Layout Component'i - Sadece yapıyı gösterir ve routing yapar
function RootLayoutContent() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Mock data ile çalışırken routing'i bypass et
    // Gerçek auth sistemi aktif olduğunda bu kısım geri açılacak
    
    // Yükleme tamamlanmadıysa bir şey yapma.
    if (isLoading) return;

    // Mock için login bypass - direkt ana sayfada kal
    console.log('Layout routing bypassed for mock data');
    
    // Gerçek auth için aşağıdaki kod aktif edilecek:
    /*
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    else if (session && inAuthGroup) {
      router.replace('/');
    }
    */
  }, [session, isLoading, segments]);

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
