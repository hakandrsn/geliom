import { NotificationHandler } from "@/components/NotificationHandler";
import { BottomSheetProvider } from "@/contexts/BottomSheetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import {
  initializeOneSignal,
  initializeOneSignalSDK,
} from "@/services/onesignal";
import NetInfo from "@react-native-community/netinfo";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

initializeOneSignalSDK();

onlineManager.setEventListener((setOnline: (online: boolean) => void) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeOneSignal().catch((error) => {
      console.error("❌ OneSignal initialization hatası:", error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <BottomSheetProvider>
              <NotificationHandler />
              {children}
            </BottomSheetProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
