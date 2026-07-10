import { apiClient } from "@/api/client";
import { useUserGroups } from "@/api/groups";
import { useTheme } from "@/contexts/ThemeContext";
import {
  connectUserServices,
  disconnectUserServices,
} from "@/services/connection";
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "react-native";
import Provider from "./Provider";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://7bd324fc8f5518b0a53f4553d12624b6@o4511013855887360.ingest.de.sentry.io/4511709727359056',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Firebase ilk auth cevabını verip backend sync denemesi tamamlanana kadar
  // yönlendirme yapılmaz — aksi halde girişli kullanıcı bir anlığına login görür.
  const [authResolved, setAuthResolved] = useState(false);

  const [fontsLoaded] = useFonts({
    "Comfortaa-Light": require("@/assets/fonts/Comfortaa-Light.ttf"),
    "Comfortaa-Regular": require("@/assets/fonts/Comfortaa-Regular.ttf"),
    "Comfortaa-Medium": require("@/assets/fonts/Comfortaa-Medium.ttf"),
    "Comfortaa-SemiBold": require("@/assets/fonts/Comfortaa-SemiBold.ttf"),
    "Comfortaa-Bold": require("@/assets/fonts/Comfortaa-Bold.ttf"),
  });

  // Backend Sync: Lazy Sync pattern — ilk doğrulanmış istekte kullanıcı
  // backend'de otomatik oluşturulur. Ağ hatasında 5 sn aralıkla yeniden dener;
  // kullanıcı bu sırada login DEĞİL, index (bağlanıyor) ekranında bekler.
  const syncWithBackend = useCallback(
    async (currentUser: { uid: string; getIdToken: () => Promise<string> }) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
        console.log("🔄 Syncing with backend (GET /users/me)...");
        const response = await apiClient.get("/users/me");
        console.log("✅ Backend user synced:", response.data);
        setUser(response.data);

        console.log("📂 Fetching groups...");
        await refetchGroups();

        await checkSubscription();

        // Socket + push: kullanıcı oturumuna bağlı canlı servisler tek noktadan
        console.log("🔌 Connecting user services (socket + push)...");
        connectUserServices({
          userId: currentUser.uid,
          getToken: () => currentUser.getIdToken(),
        });
      } catch (error) {
        console.error("❌ Backend sync başarısız, 5 sn sonra denenecek:", error);
        retryTimer.current = setTimeout(() => syncWithBackend(currentUser), 5000);
      } finally {
        isSyncing.current = false;
      }
    },
    [setUser, refetchGroups],
  );

  // Auth Listener
  useEffect(() => {
    console.log("🔐 Setting up Firebase auth listener...");
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      console.log(
        "🔐 Firebase auth state changed:",
        currentUser ? `User: ${currentUser.email}` : "No user",
      );
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      setFirebaseUser(currentUser);

      if (currentUser) {
        await syncWithBackend(currentUser);
      } else {
        setUser(null);
        disconnectUserServices();
      }

      setLoading(false);
      setAuthResolved(true);
    });

    return () => {
      unsubscribe();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [setFirebaseUser, setUser, setLoading, syncWithBackend]);

  // Onboarding status is now part of the user object from backend

  // authResolved: Firebase'in "girişli mi?" cevabı gelmeden yönlendirme yapma —
  // store'daki isLoading false başladığı için tek başına güvenilir değil.
  const isLoading = authLoading || !fontsLoaded || !authResolved;

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
      // 3. Firebase girişli ama backend sync bekliyor/başarısız — login
      // gösterme; index ekranı "bağlanılıyor" durumunu gösterir.
      else if (inAuthGroup || inOnboarding) {
        setTimeout(() => router.replace("/"), 0);
      }

      // Hide splash screen once we know what to do
      await SplashScreen.hideAsync();
    };

    // Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    checkAuth();
  }, [
    isLoading,
    segments,
    router,
    rootNavigationState?.key,
    firebaseUser,
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

export default Sentry.wrap(function RootLayout() {
  return (
    <Provider>
      <RootLayoutContent />
    </Provider>
  );
});
