import { getLocales } from "expo-localization";
import { Alert, Linking } from "react-native";

// External URL'ler
export const PRIVACY_POLICY_URL_TR =
  "https://docs.google.com/document/d/e/2PACX-1vQtS8QmhwD_ETi1wRgfx3ePoWS6KAydNg-WV9Lr1bnPbgG2ui5O2zmSyvhOUDCpJ2nbZxy7yYYM6yfD/pub";
export const PRIVACY_POLICY_URL_EN =
  "https://docs.google.com/document/d/e/2PACX-1vQMJgzunTqUXHEik5tuCYiY1nnxYFisvbBoYVvU-CYyIRL1Ix1o3182n7r812ikV-y7qdXkM98SmBxC/pub";
export const TERMS_OF_USE_URL_TR =
  "https://docs.google.com/document/d/e/2PACX-1vSIDsFWRs-347MxSXk983nlIp9pneFnf_otTI61fNV_dcsg7jW88Yg_-VJV_fB8Mf7hv2J_t7BJiBce/pub";
export const TERMS_OF_USE_URL_EN =
  "https://docs.google.com/document/d/e/2PACX-1vQD_eEvBcjoiPgEL441XGnLzkQvEh9M5zhsBHfmH0NXsVMpEHF34CI_oI7cyplRQWI-lc_ms7C73Z5a/pub";

/**
 * External URL'i açar
 * @param url Açılacak URL
 * @param fallbackMessage URL açılamazsa gösterilecek hata mesajı
 */
export const openExternalURL = async (
  url: string,
  fallbackMessage?: string
): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Hata", fallbackMessage || `Bu URL açılamıyor: ${url}`);
    }
  } catch (error) {
    console.error("URL açma hatası:", error);
    Alert.alert("Hata", "Bağlantı açılırken bir hata oluştu");
  }
};

const getLanguageCode = () => {
  const locales = getLocales();
  return locales[0]?.languageCode ?? "en";
};

/**
 * Gizlilik Politikasını açar
 */
export const openPrivacyPolicy = () => {
  const lang = getLanguageCode();
  const url = lang === "tr" ? PRIVACY_POLICY_URL_TR : PRIVACY_POLICY_URL_EN;
  return openExternalURL(
    url,
    lang === "tr"
      ? "Gizlilik Politikası sayfası açılamadı"
      : "Could not open Privacy Policy page"
  );
};

/**
 * Kullanım Şartlarını açar
 */
export const openTermsOfUse = () => {
  const lang = getLanguageCode();
  const url = lang === "tr" ? TERMS_OF_USE_URL_TR : TERMS_OF_USE_URL_EN;
  return openExternalURL(
    url,
    lang === "tr"
      ? "Kullanım Şartları sayfası açılamadı"
      : "Could not open Terms of Use page"
  );
};
