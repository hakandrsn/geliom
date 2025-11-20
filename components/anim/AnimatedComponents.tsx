import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    FadeIn,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

// 1. SNAPPY BUTTON (Hızlı, Net, Opaklık Değiştiren)
interface BouncyButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number; 
  activeOpacity?: number; 
  disabled?: boolean;
}

export const BouncyButton = ({ 
  children, 
  onPress, 
  style, 
  scaleTo = 0.98, 
  activeOpacity = 0.7, 
  disabled 
}: BouncyButtonProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(scaleTo, { duration: 50 });
    opacity.value = withTiming(activeOpacity, { duration: 50 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1, { duration: 100 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// 2. Nefes Alan Arkaplan (Ambient)
export const BreathingBackground = () => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 4000 }),
        withTiming(0.2, { duration: 4000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -200,
          left: -100,
          right: -100,
          bottom: -200,
          backgroundColor: colors.tertiary,
          zIndex: -1,
          borderRadius: 1000,
          opacity: 0.2,
          transform: [{ scale: 1.2 }]
        },
        animatedStyle,
      ]}
    />
  );
};

// 3. Liste Elemanları (Instant Giriş)
export const StaggeredItem = ({ children, index, style }: { children: React.ReactNode, index: number, style?: StyleProp<ViewStyle> }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 15).duration(200)} 
      layout={Layout.duration(150)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};