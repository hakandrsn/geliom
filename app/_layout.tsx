import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import Provider from "./Provider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const { session, user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "Comfortaa-Light": require("@/assets/fonts/Comfortaa-Light.ttf"),
    "Comfortaa-Regular": require("@/assets/fonts/Comfortaa-Regular.ttf"),
    "Comfortaa-Medium": require("@/assets/fonts/Comfortaa-Medium.ttf"),
    "Comfortaa-SemiBold": require("@/assets/fonts/Comfortaa-SemiBold.ttf"),
    "Comfortaa-Bold": require("@/assets/fonts/Comfortaa-Bold.ttf"),
  });

  const isLoading = authLoading || !fontsLoaded;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    const checkAuth = async () => {
      // 1. Session check
      if (!session) {
        // If no session and not in auth group, redirect to login
        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }
      }
      // 2. Onboarding check
      else if (session && user) {
        if (!user.has_completed_onboarding) {
          // If user needs onboarding and isn't there, redirect
          if (!inOnboarding) {
            router.replace("/onboarding");
          }
        } else {
          // User is fully authed and boarded
          // If in auth group or onboarding or at root, go home
          if (inAuthGroup || inOnboarding || !segments[0]) {
            router.replace("/(drawer)/home");
          }
        }
      }

      // Hide splash screen once we know what to do
      await SplashScreen.hideAsync();
    };

    checkAuth();
  }, [session, user, isLoading, segments, router]);

  if (isLoading) {
    return null; // Keep Splash Screen visible
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent
      />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <RootLayoutContent />
    </Provider>
  );
}
