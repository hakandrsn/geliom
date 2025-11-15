import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { initializeAuth, isLoading, session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Auth'u başlat
  useEffect(() => {
    console.log('🔵 Index: Auth başlatılıyor...');
    initializeAuth();
  }, [initializeAuth]);

  // Font'lar yüklenene kadar splash screen'i göster
  useEffect(() => {
    if (!isLoading) {
      console.log('🔵 Index: Loading tamamlandı, splash screen gizleniyor');
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Routing _layout.tsx'te yapılıyor, burada sadece loading göster
  // Eğer session varsa ve loading bitmişse, _layout routing yapacak
  useEffect(() => {
    console.log('🔵 Index: State kontrolü - isLoading:', isLoading, 'session:', !!session);
  }, [isLoading, session]);

  // Loading state
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}