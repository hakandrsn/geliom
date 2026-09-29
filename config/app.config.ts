import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * UYGULAMANIN TEK YAPILANDIRMA NOKTASI.
 *
 * REST, socket, push (OneSignal) ve satın alma (Adapty) modüllerinin tamamı
 * bu objeden beslenir. Değerlerin TEK kaynağı app.json > expo.extra'dır
 * (hepsi istemciye gömülen public değerler; .env / EXPO_PUBLIC_* kullanılmaz).
 * apiBaseUrl yoksa dev varsayılanına düşülür.
 */
export interface GeliomConfig {
  /** REST base URL — `https://<host>/api` */
  apiUrl: string;
  /** Socket.io host — `https://<host>` (path yok, `api` prefix'i yok) */
  socketUrl: string;
  /** OneSignal App ID — boşsa push bildirimleri devre dışı kalır */
  oneSignalAppId?: string;
  /** Adapty public SDK key — boşsa satın alma devre dışı kalır */
  adaptySdkKey?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Dev ortamı: Metro'nun hostUri'sinden geliştirme makinesinin LAN IP'sini al —
// fiziksel cihazda da emülatörde de çalışır. hostUri yoksa (nadir) emülatör
// varsayılanına düş: Android emülatörü localhost'a 10.0.2.2 üzerinden erişir.
const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
const DEV_HOST =
  metroHost ?? (Platform.OS === "android" ? "10.0.2.2" : "localhost");
const DEV_BASE_URL = `http://${DEV_HOST}:3000`;

const baseUrl = extra.apiBaseUrl || DEV_BASE_URL;

if (!__DEV__ && baseUrl === DEV_BASE_URL) {
  // Prod build'de app.json > expo.extra.apiBaseUrl set edilmemiş — istekler localhost'a gider.
  console.warn("⚠️ appConfig: prod ortamı için apiBaseUrl tanımlı değil!");
}

if (__DEV__) {
  console.log(`🌐 appConfig: API base URL = ${baseUrl}/api`);
}

export const appConfig: GeliomConfig = {
  apiUrl: `${baseUrl}/api`,
  socketUrl: baseUrl,
  oneSignalAppId: extra.oneSignalAppId,
  adaptySdkKey: extra.adaptySdkKey,
};
