import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking } from "react-native";
import { OneSignal } from "react-native-onesignal";

export const useNotificationSettings = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkNotificationStatus = async () => {
    // Check System Permissions first
    const settings = await Notifications.getPermissionsAsync();
    const isSystemEnabled = settings.granted || settings.status === "granted";

    // Check OneSignal Subscription
    const isSubscribed = OneSignal.User.pushSubscription.getOptedIn();

    // We consider notifications enabled if both System is ON and OneSignal is Opted IN
    setIsNotificationsEnabled(isSystemEnabled && isSubscribed);
  };

  useEffect(() => {
    checkNotificationStatus();

    // Re-check when app comes to foreground (e.g. user returns from Settings)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        checkNotificationStatus();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const openSettings = () => {
    Linking.openSettings();
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // User turning ON
      // 1. Check/Request System Permissions
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted && settings.canAskAgain) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          // Permission denied, guide to settings
          Alert.alert(
            "Bildirim İzni",
            "Bildirimleri açmak için cihaz ayarlarından izin vermeniz gerekmektedir.",
            [
              { text: "İptal", style: "cancel" },
              { text: "Ayarlar", onPress: openSettings },
            ]
          );
          return;
        }
      } else if (!settings.granted && !settings.canAskAgain) {
        // Permanently denied, must go to settings
        Alert.alert(
          "Bildirim İzni",
          "Bildirimleri açmak için cihaz ayarlarından izin vermeniz gerekmektedir.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Ayarlar", onPress: openSettings },
          ]
        );
        return;
      }

      // 2. Opt In to OneSignal
      OneSignal.User.pushSubscription.optIn();
      setIsNotificationsEnabled(true);
    } else {
      // User turning OFF
      // We explicitly Opt Out from OneSignal.
      OneSignal.User.pushSubscription.optOut();
      setIsNotificationsEnabled(false);
    }
  };

  return {
    isNotificationsEnabled,
    toggleNotifications,
    openSettings,
  };
};
