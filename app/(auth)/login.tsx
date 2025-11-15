import { signInWithApple, signInWithGoogle } from "@/api/provider-auth";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const { colors } = useTheme();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);

  // Helper to manage loading state for both
  const isLoading = isLoadingGoogle || isLoadingApple;

  // Google ile giriş
  const handleGoogleLogin = async () => {
    try {
      console.log('🔵 Google login başlatılıyor...');
      setIsLoadingGoogle(true);

      const result = await signInWithGoogle();
      console.log('🔵 Google login sonucu:', result);

      if (result.error) {
        console.error('❌ Google login hatası:', result.error);
        if (result.error.code === 'CANCELLED') {
          console.log('ℹ️ Kullanıcı girişi iptal etti');
          setIsLoadingGoogle(false); // Stop loading on cancel
          return;
        }

        Alert.alert('Hata', result.error.message || 'Google ile giriş yapılamadı');
        setIsLoadingGoogle(false); // Stop loading on error
        return;
      }

      console.log('✅ OAuth flow başarıyla tamamlandı');
      // Auth state change listener will handle navigation,
      // so we can set loading to false here or let the listener manage it.
      // For a better UX, we'll let the listener handle the global auth state.
      // If auth state doesn't change, loading might get stuck.
      // Let's stop loading if the process finishes, auth listener will redirect anyway.
      // Note: If auth is fast, this might be okay.
      // If we *don't* set loading to false, we rely on the auth listener.
      // Let's keep the user's original logic: don't set loading to false on success.
    } catch (error) {
      console.error('❌ Google login exception:', error);
      Alert.alert('Hata', 'Google ile giriş yapılamadı');
      setIsLoadingGoogle(false); // Stop loading on exception
    }
  };

  // Apple ile giriş
  const handleAppleLogin = async () => {
    try {
      setIsLoadingApple(true);

      const { error } = await signInWithApple();

      if (error) {
        if (error.code === 'CANCELLED') {
          console.log('ℹ️ Kullanıcı Apple girişi iptal etti');
          // Important: Set loading to false on cancel
          setIsLoadingApple(false);
          return;
        }

        Alert.alert('Hata', error.message || 'Apple ile giriş yapılamadı');
        setIsLoadingApple(false); // Stop loading on error
        return;
      }

      // Başarılı - auth state change listener yönlendirecek
      // We don't set loading to false, similar to Google login
    } catch (error) {
      Alert.alert('Hata', 'Apple ile giriş yapılamadı');
      console.error('Apple login error:', error);
      setIsLoadingApple(false); // Stop loading on exception
    }
  };

  return (
    // Use the theme background color
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Main content area, centered and balanced */}
      <View style={styles.contentContainer}>

        {/* Top section with app icon, name, and description */}
        <View style={styles.topSection}>
          {/* Nature-themed icon */}
          <Ionicons
            name="leaf-outline"
            size={80}
            color={colors.primary}
            style={styles.logoIcon}
          />
          <Typography variant="h1" color={colors.text} style={styles.appName}>
            Geliom
          </Typography>
          <Typography variant="bodyLarge" color={colors.secondaryText} style={styles.description}>
            Arkadaşlarınla ve ailenle anlık bağlantı kur
          </Typography>
        </View>

        {/* Bottom section with login buttons and terms */}
        <View style={styles.bottomSection}>
          <View style={styles.buttonContainer}>
            {/* Google Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  // Use cardBackground for better dark mode compatibility
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.stroke,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
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
            </TouchableOpacity>

            {/* Apple Login - Only show on iOS */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                // WHITE_OUTLINE looks much better on light/dark themed backgrounds
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                cornerRadius={16}
                style={styles.appleButton}
                onPress={handleAppleLogin}
                // Note: The Apple button has its own loading state,
                // so we don't need to check isLoadingApple here.
              />
            )}
          </View>

          {/* Terms and privacy */}
          <Typography variant="caption" color={colors.secondaryText} style={styles.termsText}>
            Giriş yaparak Kullanım Şartları ve Gizlilik Politikası'nı kabul etmiş olursunuz
          </Typography>
        </View>
      </View>
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
    justifyContent: 'space-around', // Balances top and bottom sections
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  topSection: {
    alignItems: 'center',
  },
  logoIcon: {
    marginBottom: 16,
  },
  appName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomSection: {
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    gap: 16, // Space between buttons
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56, // Match Apple button height
    borderWidth: 1,
    // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // for Android
  },
  buttonText: {
    flex: 1, // Allows text to be centered
    textAlign: 'center',
    marginLeft: 12,
  },
  // This spacer helps center the text when the icon is on the left
  buttonIconSpacer: {
    width: 24, // Same width as the icon
  },
  appleButton: {
    height: 56, // Standard height
    width: '100%',
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});