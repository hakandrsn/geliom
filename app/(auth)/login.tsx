import { supabase } from "@/api/supabase";
import { BaseLayout, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

export default function Login() {
  const { colors, toggleTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Google ile giriş - Supabase OAuth kullanarak
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri(),
        },
      });

      if (error) {
        Alert.alert('Hata', 'Google ile giriş yapılamadı: ' + error.message);
        return;
      }

      // OAuth flow başarıyla başlatıldı
      // Kullanıcı auth state change listener'ı aracılığıyla yönlendirilecek
    } catch (error) {
      Alert.alert('Hata', 'Google ile giriş yapılamadı');
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apple ile giriş - Expo Apple Authentication kullanarak
  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          Alert.alert('Hata', 'Apple ile giriş yapılamadı: ' + error.message);
          return;
        }

        if (data.session) {
          router.replace('/');
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // Kullanıcı iptal etti, hata gösterme
        return;
      }
      Alert.alert('Hata', 'Apple ile giriş yapılamadı');
      console.error('Apple login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseLayout
      fullScreen={true}
      headerShow={true}
      header={{
        rightIcon: {
          icon: <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={colors.white} />,
          onPress: toggleTheme,
        },
        backgroundColor: 'transparent',
      }}
    >
      {/* Background with gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary, colors.tertiary]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles for nature theme */}
        <View style={[styles.decorativeCircle, styles.circle1, { backgroundColor: colors.overlay }]} />
        <View style={[styles.decorativeCircle, styles.circle2, { backgroundColor: colors.overlay }]} />
        <View style={[styles.decorativeCircle, styles.circle3, { backgroundColor: colors.overlay }]} />
        
        {/* Main content with blur effect */}
        <View style={styles.contentContainer}>
          {/* Logo and welcome section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Typography variant="h1" color={colors.white} style={styles.logoText}>
                Geliom
              </Typography>
              <Typography variant="body" color={colors.white} style={styles.logoSubtext}>
                🌿 Doğal bağlantılar kur
              </Typography>
            </View>
          </View>

          {/* Login section with blur */}
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.loginContainer}>
            <View style={styles.loginContent}>
              <Typography variant="h2" color={colors.text} style={styles.welcomeTitle}>
                Hoş Geldin! 👋
              </Typography>
              
              <Typography variant="body" color={colors.secondaryText} style={styles.welcomeSubtitle}>
                Arkadaşlarınla ve ailenle bağlantı kurmak için giriş yap
              </Typography>

              {/* Login buttons */}
              <View style={styles.buttonContainer}>
                {/* Google Login */}
                <TouchableOpacity
                  style={[styles.loginButton, { backgroundColor: colors.white }]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={24} color="#4285F4" />
                  <Typography variant="button" color={colors.text} style={styles.buttonText}>
                    Google ile Giriş Yap
                  </Typography>
                </TouchableOpacity>

                {/* Apple Login - Only show on iOS with native component */}
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={16}
                    style={styles.appleButton}
                    onPress={handleAppleLogin}
                  />
                )}
              </View>

              {/* Terms and privacy */}
              <Typography variant="caption" color={colors.secondaryText} style={styles.termsText}>
                Giriş yaparak Kullanım Şartları ve Gizlilik Politikası'nı kabul etmiş olursunuz
              </Typography>
            </View>
          </BlurView>
        </View>
      </LinearGradient>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: '40%',
    right: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoSubtext: {
    textAlign: 'center',
    opacity: 0.9,
  },
  loginContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
  },
  loginContent: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
  },
  appleButton: {
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
});