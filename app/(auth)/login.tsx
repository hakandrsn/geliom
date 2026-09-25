import { BouncyButton } from "@/components/anim/AnimatedComponents";
import LoginPreview from "@/components/auth/LoginPreview";
import { Typography } from "@/components/shared";
import { radius, spacing } from "@/theme/tokens";
import { useTheme } from "@/contexts/ThemeContext";
import {
  configureGoogleSignIn,
  signInWithApple,
  signInWithGoogle,
} from "@/services/auth";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { colors } = useTheme();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Helper to manage loading state for both
  const isLoading = isLoadingGoogle || isLoadingApple;

  // Google ile giriş
  const handleGoogleLogin = async () => {
    if (isLoadingGoogle) {
      console.log("⚠️ Google login zaten başlatılmış");
      return;
    }

    try {
      console.log("🚀 handleGoogleLogin: Butona basıldı");
      setIsLoadingGoogle(true);

      const result = await signInWithGoogle();
      console.log("✅ handleGoogleLogin: Başarılı", result?.user?.email);
    } catch (error: any) {
      console.error("❌ handleGoogleLogin: EXCEPTION", error);
      console.error("   - Error Message:", error.message);

      if (error && error.code === "CANCELLED") {
        console.log("ℹ️ Kullanıcı iptal etti");
      } else {
        Alert.alert(
          "Giriş Hatası",
          `Hata Kodu: ${error.code}\nMesaj: ${error.message}`,
        );
      }
      setIsLoadingGoogle(false);
    }
  };

  // Apple ile giriş
  const handleAppleLogin = async () => {
    // Eğer zaten loading ise, duplicate tıklamayı engelle
    if (isLoadingApple) {
      console.log(
        "⚠️ Apple login zaten başlatılmış, duplicate tıklama engellendi",
      );
      return;
    }

    try {
      setIsLoadingApple(true);

      const result = await signInWithApple();
      console.log("✅ Apple login başarılı, user:", result.user.email);
      // Loading state'i false yapmıyoruz, _layout routing yapacak
    } catch (error: any) {
      console.error("Apple login error:", error);
      if (error && error.code === "CANCELLED") {
        console.log("ℹ️ Kullanıcı Apple girişi iptal etti");
      } else {
        Alert.alert("Hata", error.message || "Apple ile giriş yapılamadı");
      }
      setIsLoadingApple(false); // Stop loading on exception
    }
  };

  return (
    // Use the theme background color
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Main content area, centered and balanced */}
      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <View style={styles.brandRow}>
            <Image
              source={require("@/assets/images/ios-light.png")}
              style={styles.logoIcon}
            />
            <Typography variant="h3" color={colors.text}>
              Geliom
            </Typography>
          </View>

          {/* Ürünü anlatan canlı sahne — logo yerine ana görsel budur */}
          <LoginPreview />

          <Typography variant="h4" color={colors.text} style={styles.headline}>
            Sevdiklerin ne yapıyor, anında gör
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={styles.description}
          >
            Durumunu ve ruh halini paylaş; grubun mesaj atmadan haberdar olsun.
          </Typography>
        </View>

        {/* Bottom section with login buttons and terms */}
        <View style={styles.bottomSection}>
          <View style={styles.buttonContainer}>
            {/* Google Login Button */}
            <BouncyButton
              style={[
                styles.loginButton,
                {
                  backgroundColor: colors.sheetBackground,
                  borderColor: colors.stroke,
                },
              ]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoadingGoogle ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              )}
              <Typography
                variant="button"
                color={colors.text}
                style={styles.buttonText}
              >
                Google ile Giriş Yap
              </Typography>
              {/* Spacer view to keep text centered */}
              <View style={styles.buttonIconSpacer} />
            </BouncyButton>

            {/* Apple Login - Only show on iOS */}
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                // WHITE_OUTLINE looks much better on light/dark themed backgrounds
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle
                    .WHITE_OUTLINE
                }
                cornerRadius={16}
                style={styles.appleButton}
                onPress={handleAppleLogin}
                // Note: The Apple button has its own loading state,
                // so we don't need to check isLoadingApple here.
              />
            )}
          </View>
        </View>
      </View>
      {/* Terms and privacy */}
      <Typography
        variant="caption"
        color={colors.secondaryText}
        style={styles.termsText}
      >
        Giriş yaparak Kullanım Şartları ve Gizlilik Politikası&apos;nı kabul
        etmiş olursunuz
      </Typography>
    </SafeAreaView>
  );
}

// A more compact, centered, and theme-aware stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topSection: {
    alignItems: "center",
    gap: spacing.lg,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
  },
  headline: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  bottomSection: {
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    gap: 16, // Space between buttons
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56, // Match Apple button height
    borderWidth: 1,
  },
  buttonText: {
    flex: 1, // Allows text to be centered
    textAlign: "center",
    marginLeft: 12,
  },
  // This spacer helps center the text when the icon is on the left
  buttonIconSpacer: {
    width: 24, // Same width as the icon
  },
  appleButton: {
    height: 56, // Standard height
    width: "100%",
  },
  termsText: {
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
