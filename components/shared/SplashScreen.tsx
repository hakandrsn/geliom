import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/theme/typography';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export const SplashScreen: React.FC = () => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.logoContainer}>
          <Animated.Text
            style={[
              styles.logo,
              {
                color: colors.primary,
                fontFamily: fonts.bold,
              },
            ]}
          >
            Geliom
          </Animated.Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Animated.Text
            style={[
              styles.loadingText,
              {
                color: colors.secondaryText,
                fontFamily: fonts.regular,
              },
            ]}
          >
            Yükleniyor...
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 60,
  },
  logo: {
    fontSize: 48,
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

