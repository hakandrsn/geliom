import { useUpdateUser } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking } from "react-native";
import { OneSignal } from "react-native-onesignal";

/**
 * Genel bildirim ayarı.
 *
 * İki katman var:
 *  1) Sistem izni (iOS/Android) — kapalıysa hiçbir şey teslim edilemez.
 *  2) Uygulama içi tercih — SUNUCUDA tutulur (user.pushEnabled). Kapalıyken
 *     sunucu durum/istek bildirimlerini göndermez; ama abonelik hatırlatması
 *     gibi işlemsel bildirimler yine gider.
 *
 * Bu yüzden OneSignal aboneliği artık kapatılmaz (optOut edilmez): sistem
 * izni varken cihaz her zaman ulaşılabilir kalır, filtre sunucudadır.
 */
export const useNotificationSettings = () => {
  const user = useAppStore((state) => state.user);
  const updateUser = useUpdateUser();
  const [isSystemEnabled, setIsSystemEnabled] = useState(true);
  const appState = useRef(AppState.currentState);
  const migrated = useRef(false);

  const pushEnabled = user?.pushEnabled !== false;
  const isNotificationsEnabled = isSystemEnabled && pushEnabled;

  // İzin sonucunu uygular — effect içinden promise callback'i olarak çağrılır
  const applyPermission = useCallback(
    (settings: Notifications.NotificationPermissionsStatus) => {
      const granted = settings.granted || settings.status === "granted";
      setIsSystemEnabled(granted);

      if (granted && !OneSignal.User.pushSubscription.getOptedIn()) {
        // Eski sürüm tercihi OneSignal optOut ile tutuyordu: aboneliği geri aç,
        // kullanıcının "kapalı" tercihini sunucuya taşı (bir kez)
        OneSignal.User.pushSubscription.optIn();
        if (!migrated.current && user && user.pushEnabled === undefined) {
          migrated.current = true;
          updateUser.mutate({ pushEnabled: false });
        }
      }
    },
    [user, updateUser],
  );

  useEffect(() => {
    Notifications.getPermissionsAsync().then(applyPermission);
    // Ayarlardan dönünce sistem iznini tekrar kontrol et
    const subscription = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        Notifications.getPermissionsAsync().then(applyPermission);
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, [applyPermission]);

  const openSettings = () => {
    Linking.openSettings();
  };

  const askForSettings = () =>
    Alert.alert(
      "Bildirim izni",
      "Bildirimleri açmak için telefonunun ayarlarından Geliom'a izin vermen gerekiyor.",
      [
        { text: "İptal", style: "cancel" },
        { text: "Ayarlar", onPress: openSettings },
      ],
    );

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        if (!settings.canAskAgain) {
          askForSettings();
          return;
        }
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          askForSettings();
          return;
        }
      }
      OneSignal.User.pushSubscription.optIn();
      setIsSystemEnabled(true);
    }
    updateUser.mutate({ pushEnabled: value });
  };

  return {
    isNotificationsEnabled,
    isSystemEnabled,
    toggleNotifications,
    openSettings,
  };
};
