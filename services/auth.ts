import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

// Google Sign-In yapılandırması
// Google Sign-In configuration
export const configureGoogleSignIn = () => {
  console.log("🛠️ GoogleSignin.configure başlatılıyor...");
  GoogleSignin.configure({
    webClientId:
      "53336710716-ocrnuvqlpq02lvss0hvjgeqc08539sqm.apps.googleusercontent.com",
    offlineAccess: false,
  });
  console.log("✅ GoogleSignin.configure tamamlandı.");
};

/**
 * Google ile giriş yap
 */
export const signInWithGoogle = async () => {
  try {
    console.log("🔍 signInWithGoogle adımları başlıyor...");
    configureGoogleSignIn();

    console.log("🔍 Play Services kontrol ediliyor...");
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log("✅ Play Services mevcut.");

    console.log("🔍 GoogleSignin.signIn() çağrılıyor...");
    const signInResult = await GoogleSignin.signIn();

    console.log(
      "🔍 GoogleSignin sonucu (JSON):",
      JSON.stringify(signInResult, null, 2),
    );

    const idToken = signInResult.data?.idToken;
    console.log(
      "🔍 idToken durumu:",
      idToken ? "Mevcut (Token alındı)" : "EKSİK!",
    );

    if (!idToken) {
      throw new Error("Google Sign-In failed: No ID token found in result");
    }

    console.log("🔍 Firebase credential oluşturuluyor...");
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    console.log("🔍 Firebase'e giriş yapılıyor...");
    const firebaseResult = await auth().signInWithCredential(googleCredential);
    console.log("✅ Firebase girişi başarılı:", firebaseResult.user.email);

    return firebaseResult;
  } catch (error: any) {
    console.error("❌ Google sign in DETAYLI HATA:");
    console.error("   - Message:", error.message);
    console.error("   - Code:", error.code);
    console.error("   - Full Error:", JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * Apple ile giriş yap
 */
export const signInWithApple = async () => {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In is only supported on iOS");
  }

  try {
    // Apple native authentication
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken } = appleCredential;

    if (!identityToken) {
      throw new Error("Apple Sign-In failed: No identity token found");
    }

    // Firebase credential oluştur
    const firebaseCredential = auth.AppleAuthProvider.credential(identityToken);

    // Firebase'e giriş yap
    return auth().signInWithCredential(firebaseCredential);
  } catch (error) {
    console.error("Apple sign in error:", error);
    throw error;
  }
};

/**
 * Çıkış yap
 */
export const signOut = async () => {
  try {
    await GoogleSignin.signOut().catch(() => {}); // Google'dan da çıkış yap (varsa)
    await auth().signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};
