import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/theme/tokens';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  /** Başlığın yanında soluk sayı rozeti (örn. üye sayısı) */
  count?: number;
  /** Sağ tarafa aksiyon (örn. "Tümünü gör" butonu) */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Liste bölümlerinin üstündeki küçük, soluk başlık satırı. */
export default function SectionHeader({ title, count, action, style }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        <CustomText
          variant="label"
          fontWeight="semibold"
          color={colors.secondaryText}
          style={styles.title}
        >
          {title.toLocaleUpperCase('tr-TR')}
        </CustomText>
        {typeof count === 'number' && (
          <View style={[styles.countBadge, { backgroundColor: colors.secondaryBackground }]}>
            <CustomText variant="caption" fontWeight="semibold" color={colors.secondaryText}>
              {count}
            </CustomText>
          </View>
        )}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    letterSpacing: 1,
  },
  countBadge: {
    minWidth: 24,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
