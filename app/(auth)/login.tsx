import { signInWithApple, signInWithGoogle } from "@/api/provider-auth";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
    // Eğer zaten loading ise, duplicate tıklamayı engelle
    if (isLoadingGoogle) {
      console.log('⚠️ Google login zaten başlatılmış, duplicate tıklama engellendi');
      return;
    }

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

      console.log('✅ OAuth flow başarıyla tamamlandı, routing bekleniyor...');
      // Loading state'i false yapmıyoruz, _layout routing yapacak
      // ve kullanıcı otomatik yönlendirilecek
    } catch (error) {
      console.error('❌ Google login exception:', error);
      Alert.alert('Hata', 'Google ile giriş yapılamadı');
      setIsLoadingGoogle(false); // Stop loading on exception
    }
  };

  // Apple ile giriş
  const handleAppleLogin = async () => {
    // Eğer zaten loading ise, duplicate tıklamayı engelle
    if (isLoadingApple) {
      console.log('⚠️ Apple login zaten başlatılmış, duplicate tıklama engellendi');
      return;
    }

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

      console.log('✅ Apple login başarılı, routing bekleniyor...');
      // Loading state'i false yapmıyoruz, _layout routing yapacak
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
          <Image source={require('@/assets/images/icon.png')} style={styles.logoIcon} />
          <Typography variant="h2" color={colors.text} style={styles.appName}>
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
    width: 80,
    height: 80,
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