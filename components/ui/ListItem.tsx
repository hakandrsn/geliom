import { BouncyButton } from '@/components/anim/AnimatedComponents';
import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface ListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Sağ taraf içeriği (Switch, değer metni vb.). Verilmezse onPress varsa chevron gösterilir. */
  right?: ReactNode;
  onPress?: () => void;
  /** İkon rengi override — varsayılan primary, destructive'de error */
  iconColor?: string;
  /** Silme/tehlikeli aksiyonlar: ikon ve başlık error renginde */
  destructive?: boolean;
  /** Premium gerektiren özellik: en sağda elmas rozeti gösterilir */
  premium?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Ayar/menü listesi satırı — zeminsiz (kart YOK), büyük ikon + başlık + alt başlık.
 * Ayarlar, grup yönetimi gibi ekranlardaki tüm liste elemanları bununla yapılır.
 */
export default function ListItem({
  icon,
  title,
  subtitle,
  right,
  onPress,
  iconColor,
  destructive = false,
  premium = false,
  disabled = false,
  style,
}: ListItemProps) {
  const { colors } = useTheme();

  const resolvedIconColor =
    iconColor || (destructive ? colors.error : colors.primary);
  const titleColor = destructive ? colors.error : colors.text;

  const content = (
    <View style={[styles.row, disabled && styles.disabled, style]}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={28} color={resolvedIconColor} />
      </View>

      <View style={styles.textWrapper}>
        <CustomText
          variant="body"
          fontWeight="medium"
          color={titleColor}
          numberOfLines={1}
        >
          {title}
        </CustomText>
        {subtitle && (
          <CustomText
            variant="caption"
            color={colors.secondaryText}
            numberOfLines={1}
          >
            {subtitle}
          </CustomText>
        )}
      </View>

      {premium && (
        <View
          style={[styles.premiumBadge, { backgroundColor: colors.warning + '1F' }]}
        >
          <Ionicons name="diamond" size={14} color={colors.warning} />
        </View>
      )}

      {right ??
        (onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.lightText}
          />
        ))}
    </View>
  );

  if (onPress) {
    return (
      <BouncyButton onPress={onPress} disabled={disabled}>
        {content}
      </BouncyButton>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    width: 36,
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  premiumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
