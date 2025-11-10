import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { initializeAuth, isLoading, session } = useAuth();
  const { colors } = useTheme();

  // Auth'u başlat
  useEffect(() => {
    initializeAuth();
  }, []);

  // Font'lar yüklenene kadar splash screen'i göster
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Auth tamamlandığında drawer'a yönlendir
  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(drawer)/home');
    }
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