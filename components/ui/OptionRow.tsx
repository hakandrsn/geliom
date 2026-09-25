import { BouncyButton } from '@/components/anim/AnimatedComponents';
import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { layout, radius, spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Emoji from './Emoji';

export interface OptionRowProps {
  label: string;
  /** Soldaki görsel: emoji ya da ikon */
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  /** Kaldır/Yok gibi nötr aksiyon: ikincil renk, kesikli alt çizgi yok */
  muted?: boolean;
  /** Ekle gibi vurgulu aksiyon: primary renk */
  accent?: boolean;
  /** Son satırda alt çizgi çizme */
  last?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Kompakt liste satırı — dropdown/seçim listeleri için. Solda emoji ya da
 * ikon, ortada etiket, sağda seçiliyse onay. Satırlar hairline ile ayrılır.
 */
export default function OptionRow({
  label,
  emoji,
  icon,
  selected = false,
  muted = false,
  accent = false,
  last = false,
  onPress,
  style,
}: OptionRowProps) {
  const { colors } = useTheme();
  const labelColor = accent
    ? colors.primary
    : muted
      ? colors.secondaryText
      : selected
        ? colors.primary
        : colors.text;

  return (
    <BouncyButton
      onPress={onPress}
      scaleTo={0.995}
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.stroke },
        selected && { backgroundColor: colors.passiveState },
        style,
      ]}
    >
      <View style={styles.leading}>
        {emoji ? (
          <Emoji size={20}>{emoji}</Emoji>
        ) : icon ? (
          <Ionicons name={icon} size={20} color={labelColor} />
        ) : null}
      </View>
      <CustomText
        variant="body"
        fontWeight={selected || accent ? 'semibold' : 'medium'}
        color={labelColor}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </CustomText>
      {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.touchTarget + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  leading: {
    width: 24,
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
});
