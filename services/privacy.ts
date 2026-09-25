import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";

const CRASH_REPORTS_KEY = "geliom:privacy:crashReports";

/** Sentry raporlamasını çalışma zamanında aç/kapat (dev'de her zaman kapalı). */
export function applyCrashReportsEnabled(enabled: boolean) {
  const client = Sentry.getClient();
  if (!client) return;
  client.getOptions().enabled = enabled && !__DEV__;
}

/** Kayıtlı tercihi okur; varsayılan açık. */
export async function loadCrashReportsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CRASH_REPORTS_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export async function setCrashReportsEnabled(enabled: boolean): Promise<void> {
  applyCrashReportsEnabled(enabled);
  try {
    await AsyncStorage.setItem(CRASH_REPORTS_KEY, enabled ? "1" : "0");
  } catch {
    // Tercih kaydedilemese de oturum boyunca uygulanmış olur
  }
}
