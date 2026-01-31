import { apiClient } from "@/api/client";
import { useUserGroups } from "@/api/groups";
import { disconnectSocket, initSocket } from "@/api/socket";
import { useTheme } from "@/contexts/ThemeContext";
import { checkSubscription } from "@/services/purchase";
import { useAppStore } from "@/store/useAppStore";
import auth from "@react-native-firebase/auth";
import { useFonts } from "expo-font";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import Provider from "./Provider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  // Use Zustand store instead of Context
  const {
    user,
    firebaseUser,
    isLoading: authLoading,
    hasCompletedOnboarding,
    setFirebaseUser,
    setUser,
    setLoading,
  } = useAppStore();

  // Fetch groups once authenticated
  const { refetch: refetchGroups } = useUserGroups();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isSyncing = useRef(false);

  const [fontsLoaded] = useFonts({
    "Comfortaa-Light": require("@/assets/fonts/Comfortaa-Light.ttf"),
    "Comfortaa-Regular": require("@/assets/fonts/Comfortaa-Regular.ttf"),
    "Comfortaa-Medium": require("@/assets/fonts/Comfortaa-Medium.ttf"),
    "Comfortaa-SemiBold": require("@/assets/fonts/Comfortaa-SemiBold.ttf"),
    "Comfortaa-Bold": require("@/assets/fonts/Comfortaa-Bold.ttf"),
  });

  // Auth Listener & Backend Sync
  useEffect(() => {
    console.log("🔐 Setting up Firebase auth listener...");
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      console.log(
        "🔐 Firebase auth state changed:",
        currentUser ? `User: ${currentUser.email}` : "No user",
      );
      setFirebaseUser(currentUser);

      if (currentUser && !isSyncing.current) {
        isSyncing.current = true;
        try {
          // Backend Sync: Lazy Sync pattern
          const token = await currentUser.getIdToken(); // This is the recommended way in RN Firebase docs for user objects
          console.log("token", token);

          console.log("🔄 Syncing with backend (GET /users/me)...");
          const response = await apiClient.get("/users/me");
          console.log("✅ Backend user synced:", response.data);

          setUser(response.data);

          // Fetch groups
          console.log("📂 Fetching groups...");
          await refetchGroups();

          // Check Subscription status
          await checkSubscription();

          // Connect Socket
          console.log("🔌 Connecting to socket...");
          initSocket(token);
        } finally {
          isSyncing.current = false;
        }
      } else if (!currentUser) {
        setUser(null);
        disconnectSocket();
        isSyncing.current = false;
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [setFirebaseUser, setUser, setLoading, refetchGroups]);

  // Onboarding status is now part of the user object from backend

  const isLoading =
    authLoading || !fontsLoaded || (firebaseUser && user === undefined); // Wait for user to be fetched if firebaseUser exists

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    const checkAuth = async () => {
      // 1. Firebase user check
      if (!firebaseUser) {
        if (!inAuthGroup) {
          setTimeout(() => router.replace("/(auth)/login"), 0);
        }
      }
      // 2. User data check (wait for backend user)
      else if (user) {
        if (!hasCompletedOnboarding) {
          if (!inOnboarding) {
            setTimeout(() => router.replace("/onboarding"), 0);
          }
        } else {
          // User is fully authed and boarded
          if (inAuthGroup || inOnboarding || !segments[0]) {
            setTimeout(() => router.replace("/(drawer)/home"), 0);
          }
        }
      }

      // Hide splash screen once we know what to do
      await SplashScreen.hideAsync();
    };

    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    checkAuth();
  }, [
    segments,
    router,
    rootNavigationState?.key,
    user,
    hasCompletedOnboarding,
  ]);

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
