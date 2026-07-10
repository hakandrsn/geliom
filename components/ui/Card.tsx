import { BouncyButton } from '@/components/anim/AnimatedComponents';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export interface CardProps {
  children: ReactNode;
  /** Verilirse kart dokunulabilir olur (BouncyButton ile) */
  onPress?: () => void;
  /** İç boşluk — token değeri. Varsayılan: spacing.lg */
  padding?: number;
  /** Vurgulu kart: primary tonlu zemin ve kenarlık (örn. "benim kartım") */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Temel yüzey bileşeni. Tüm kart görünümleri bunun üzerine kurulur:
 * cardBackground + stroke kenarlık + yumuşak gölge.
 */
export default function Card({
  children,
  onPress,
  padding = spacing.lg,
  highlighted = false,
  style,
}: CardProps) {
  const { colors, shadows } = useTheme();

  const surfaceStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: highlighted ? colors.passiveState : colors.cardBackground,
      borderColor: highlighted ? colors.primary + '55' : colors.stroke,
      borderWidth: 1,
      borderRadius: radius.xl,
      padding,
    },
    shadows.card,
    style,
  ];

  if (onPress) {
    return (
      <BouncyButton onPress={onPress} style={surfaceStyle}>
        {children}
      </BouncyButton>
    );
  }

  return <View style={surfaceStyle}>{children}</View>;
}
