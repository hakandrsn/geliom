import { BouncyButton } from '@/components/anim/AnimatedComponents';
import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

export interface ChipProps {
  label?: string;
  /** Label'ın soluna emoji (status/mood için) */
  emoji?: string;
  /** Label'ın soluna Ionicons ikonu (emoji verilmişse ikon gösterilmez) */
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  /** "Ekle" tipi chip: kesikli kenarlık, nötr görünüm */
  dashed?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Seçilebilir hap (pill) bileşeni — status ve mood seçicilerin yapı taşı.
 * Seçili: primary tonlu zemin + primary kenarlık ve metin.
 * Seçili değil: kart zemini + stroke kenarlık + ikincil metin.
 */
export default function Chip({
  label,
  emoji,
  icon,
  selected = false,
  onPress,
  dashed = false,
  disabled = false,
  style,
}: ChipProps) {
  const { colors } = useTheme();

  const textColor = selected ? colors.primary : colors.secondaryText;

  return (
    <BouncyButton
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.passiveState : colors.cardBackground,
          borderColor: selected ? colors.primary : colors.stroke,
          borderStyle: dashed ? 'dashed' : 'solid',
          opacity: disabled ? 0.5 : 1,
        },
        !label && styles.iconOnly,
        style,
      ]}
    >
      {emoji ? (
        <CustomText variant="bodySmall">{emoji}</CustomText>
      ) : icon ? (
        <Ionicons name={icon} size={16} color={textColor} />
      ) : null}
      {label && (
        <CustomText
          variant="bodySmall"
          fontWeight={selected ? 'semibold' : 'medium'}
          color={textColor}
          numberOfLines={1}
        >
          {label}
        </CustomText>
      )}
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
