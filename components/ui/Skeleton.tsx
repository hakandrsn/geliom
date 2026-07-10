import { useTheme } from '@/contexts/ThemeContext';
import { radius as radiusTokens } from '@/theme/tokens';
import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  /** Varsayılan: radius.sm. Daire için width'e eşit height verip circle kullan. */
  radius?: number;
  /** true ise tam daire (avatar placeholder'ları için) */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Yüklenme iskeleti — nabız gibi solup parlayan blok.
 * Veri beklenen HER yerde spinner yerine bunu kullan; gerçek layout'u taklit et.
 */
export default function Skeleton({
  width = '100%',
  height = 16,
  radius = radiusTokens.sm,
  circle = false,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.5, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: circle ? height : width,
          height,
          borderRadius: circle ? radiusTokens.full : radius,
          backgroundColor: colors.lightGray,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
