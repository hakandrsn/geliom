import { NotificationHandler } from "@/components/NotificationHandler";
import { BottomSheetProvider } from "@/contexts/BottomSheetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import {
  initializeOneSignal,
  initializeOneSignalSDK,
} from "@/services/onesignal";
import { queryClient } from "@/api/queryClient";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

initializeOneSignalSDK();

onlineManager.setEventListener((setOnline: (online: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export default function Provider({ children }: { children: React.ReactNode }) {
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding,
  );

  // İzin akışı yalnızca onboarding'i tamamlamış kullanıcılar için açılışta koşar
  // (izin zaten sorulmuştur, dialog tekrar çıkmaz). İlk izin isteği onboarding
  // sonunda bağlamlı olarak yapılır — soğuk açılışta izin dialogu göstermeyiz.
  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    initializeOneSignal().catch((error) => {
      console.error("❌ OneSignal initialization hatası:", error);
    });
  }, [hasCompletedOnboarding]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <BottomSheetProvider>
                <NotificationHandler />
                {children}
              </BottomSheetProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
