import { NotificationHandler } from '@/components/NotificationHandler';
import { AuthProvider } from '@/contexts/AuthContext';
import { BottomSheetProvider } from '@/contexts/BottomSheetContext';
import { GroupProvider } from '@/contexts/GroupContext';
import PayProvider from '@/contexts/PayContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initializeOneSignal } from '@/services/onesignal';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from "expo-font";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Network durumunu TanStack Query ile senkronize et
onlineManager.setEventListener((setOnline: (online: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

// Splash screen'i manuel olarak gizlememiz gerekiyor
SplashScreen.preventAutoHideAsync();

// TanStack Query client'ı oluştur.
// Bu component dışında oluşturulur ki her render'da yeniden oluşmasın.
const queryClient = new QueryClient();

// Merkezi Provider Component'i - Sadece provider'ları wrap eder
export default function Provider({ children }: { children: React.ReactNode }) {

  const [fontsLoaded, error] = useFonts({
    'Comfortaa-Light': require('@/assets/fonts/Comfortaa-Light.ttf'),
    'Comfortaa-Regular': require('@/assets/fonts/Comfortaa-Regular.ttf'),
    'Comfortaa-Medium': require('@/assets/fonts/Comfortaa-Medium.ttf'),
    'Comfortaa-SemiBold': require('@/assets/fonts/Comfortaa-SemiBold.ttf'),
    'Comfortaa-Bold': require('@/assets/fonts/Comfortaa-Bold.ttf'),
  });

  // OneSignal'i initialize et (uygulama başladığında bir kez)
  useEffect(() => {
    initializeOneSignal().catch((error) => {
      console.error('❌ OneSignal initialization hatası:', error);
    });
  }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PayProvider>
              <AuthProvider>
                <GroupProvider>
                  <BottomSheetProvider>
                    <NotificationHandler />
                    {children}
                  </BottomSheetProvider>
                </GroupProvider>
              </AuthProvider>
            </PayProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
