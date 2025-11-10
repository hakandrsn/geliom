import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from "expo-font";
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
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
export function Provider({ children }: { children: React.ReactNode }) {

  const [fontsLoaded, error] = useFonts({
    'Comfortaa-Light': require('@/assets/fonts/Comfortaa-Light.ttf'),
    'Comfortaa-Regular': require('@/assets/fonts/Comfortaa-Regular.ttf'),
    'Comfortaa-Medium': require('@/assets/fonts/Comfortaa-Medium.ttf'),
    'Comfortaa-SemiBold': require('@/assets/fonts/Comfortaa-SemiBold.ttf'),
    'Comfortaa-Bold': require('@/assets/fonts/Comfortaa-Bold.ttf'),
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <BottomSheetModalProvider>
                {children}
              </BottomSheetModalProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
