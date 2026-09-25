import { BouncyButton } from '@/components/anim/AnimatedComponents';
import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Emoji from './Emoji';

export interface ChipProps {
  label?: string;
  /** Label'ın soluna (pill) veya üstüne (tile) emoji */
  emoji?: string;
  /** Ionicons ikonu (emoji verilmişse ikon gösterilmez) */
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  /**
   * pill: yatay hap (varsayılan) — durum seçenekleri
   * tile: dikey kare, büyük emoji üstte — ruh hali seçenekleri
   */
  variant?: 'pill' | 'tile';
  /** Seçiliyken tonlu değil dolu primary zemin + beyaz metin */
  filled?: boolean;
  /** "Ekle" tipi chip: kesikli kenarlık, nötr görünüm */
  dashed?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Seçilebilir chip — status ve mood seçicilerin yapı taşı.
 * Seçili değil: kart zemini + stroke kenarlık + ikincil metin.
 * Seçili: tonlu zemin + primary kenarlık (filled ise dolu primary + beyaz).
 */
export default function Chip({
  label,
  emoji,
  icon,
  selected = false,
  onPress,
  variant = 'pill',
  filled = false,
  dashed = false,
  disabled = false,
  style,
}: ChipProps) {
  const { colors } = useTheme();
  const isTile = variant === 'tile';
  const solid = selected && filled;

  const textColor = solid
    ? '#FFFFFF'
    : selected
      ? colors.primary
      : colors.secondaryText;
  const backgroundColor = solid
    ? colors.primary
    : selected
      ? colors.passiveState
      : colors.cardBackground;

  return (
    <BouncyButton
      onPress={onPress}
      disabled={disabled}
      style={[
        isTile ? styles.tile : styles.pill,
        {
          backgroundColor,
          borderColor: selected ? colors.primary : colors.stroke,
          borderStyle: dashed ? 'dashed' : 'solid',
          opacity: disabled ? 0.5 : 1,
        },
        !isTile && !label && styles.iconOnly,
        style,
      ]}
    >
      {emoji ? (
        <Emoji size={isTile ? 26 : 15}>{emoji}</Emoji>
      ) : icon ? (
        <Ionicons name={icon} size={isTile ? 24 : 16} color={textColor} />
      ) : null}
      {label && (
        <CustomText
          variant={isTile ? 'caption' : 'bodySmall'}
          fontWeight={selected ? 'semibold' : 'medium'}
          color={textColor}
          numberOfLines={1}
          style={isTile && styles.tileLabel}
        >
          {label}
        </CustomText>
      )}
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm - 2,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  iconOnly: {
    width: 40,
    paddingHorizontal: 0,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    height: 72,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  tileLabel: {
    textAlign: 'center',
  },
});
