import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

// Google Sign-In yapılandırması
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId:
      "53336710716-ocrnuvqlpq02lvss0hvjgeqc08539sqm.apps.googleusercontent.com",
    offlineAccess: false,
  });
};

/**
 * Google ile giriş yap.
 *
 * NOT: Sign-in sonucu ve hata nesnesi LOGLANMAZ — idToken ve e-posta içerir,
 * Sentry log/breadcrumb'larına sızar.
 */
export const signInWithGoogle = async () => {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error("Google Sign-In failed: No ID token found in result");
  }

  // RNFB 25.x Android'de yalnız idToken verilince accessToken yerine "" iletir;
  // Firebase SDK boş string'i reddeder ("accessToken cannot be empty").
  // Gerçek accessToken'ı da vererek bu yoldan kaçınıyoruz.
  const { accessToken } = await GoogleSignin.getTokens();
  const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);
  return auth().signInWithCredential(googleCredential);
};

/**
 * Apple ile giriş yap.
 *
 * Apple, ad-soyadı yalnızca İLK girişte ve token dışında verir; Firebase
 * ID token'ında `name` claim'i olmaz. Bu yüzden ad burada Firebase profiline
 * yazılır; backend senkronu (_layout) profil adını PATCH /users/me ile taşır.
 */
export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In is only supported on iOS");
  }

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken, fullName } = appleCredential;
  if (!identityToken) {
    throw new Error("Apple Sign-In failed: No identity token found");
  }

  const firebaseCredential = auth.AppleAuthProvider.credential(identityToken);
  const result = await auth().signInWithCredential(firebaseCredential);

  const displayName = [fullName?.givenName, fullName?.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (displayName && !result.user.displayName) {
    // Sonraki girişlerde Apple adı vermez; ilk seferde kalıcı olarak sakla
    await result.user.updateProfile({ displayName }).catch(() => {});
  }

  return result;
};

/**
 * Çıkış yap
 */
export const signOut = async () => {
  await GoogleSignin.signOut().catch(() => {}); // Google'dan da çıkış yap (varsa)
  await auth().signOut();
};
