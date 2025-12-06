import { Alert, Linking } from 'react-native';

// External URL'ler
export const PRIVACY_POLICY_URL = 'https://geliom.app/privacy-policy';
export const TERMS_OF_USE_URL = 'https://geliom.app/terms-of-use';

/**
 * External URL'i açar
 * @param url Açılacak URL
 * @param fallbackMessage URL açılamazsa gösterilecek hata mesajı
 */
export const openExternalURL = async (url: string, fallbackMessage?: string): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Hata',
        fallbackMessage || `Bu URL açılamıyor: ${url}`
      );
    }
  } catch (error) {
    console.error('URL açma hatası:', error);
    Alert.alert(
      'Hata',
      'Bağlantı açılırken bir hata oluştu'
    );
  }
};

/**
 * Gizlilik Politikasını açar
 */
export const openPrivacyPolicy = () => {
  return openExternalURL(
    PRIVACY_POLICY_URL,
    'Gizlilik Politikası sayfası açılamadı'
  );
};

/**
 * Kullanım Şartlarını açar
 */
export const openTermsOfUse = () => {
  return openExternalURL(
    TERMS_OF_USE_URL,
    'Kullanım Şartları sayfası açılamadı'
  );
};

