import { BouncyButton } from '@/components/anim/AnimatedComponents';
import { useTheme } from '@/contexts/ThemeContext';
import { layout, radius } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export type IconButtonVariant = 'surface' | 'tonal' | 'ghost';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  /**
   * surface: kart zemini + kenarlık (varsayılan)
   * tonal: primary tonlu hafif zemin
   * ghost: zeminsiz, sadece ikon
   */
  variant?: IconButtonVariant;
  size?: number;
  iconSize?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Dairesel ikon butonu — header aksiyonları, kapatma butonları vb. için. */
export default function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = layout.touchTarget,
  iconSize = 22,
  color,
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors, shadows } = useTheme();

  const backgroundByVariant: Record<IconButtonVariant, string> = {
    surface: colors.cardBackground,
    tonal: colors.passiveState,
    ghost: 'transparent',
  };

  const iconColor = color || (variant === 'tonal' ? colors.primary : colors.text);

  return (
    <BouncyButton
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundByVariant[variant],
          borderWidth: variant === 'surface' ? 1 : 0,
          borderColor: colors.stroke,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'surface' && shadows.card,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </BouncyButton>
  );
}
