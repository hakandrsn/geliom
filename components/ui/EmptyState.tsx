import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title?: string;
  description: string;
  /** Alt kısımdaki aksiyon butonları */
  children?: ReactNode;
  /** true ise ekranı dikeyde ortalar (tam sayfa boş durumlar için) */
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Boş durum ekranı — ikon halkası + başlık + açıklama + aksiyonlar. */
export default function EmptyState({
  icon,
  title,
  description,
  children,
  fullScreen = false,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <View style={[styles.iconOuter, { backgroundColor: colors.passiveState }]}>
        <View style={[styles.iconInner, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name={icon} size={40} color={colors.primary} />
        </View>
      </View>

      {title && (
        <CustomText variant="h3" color={colors.text} style={styles.title}>
          {title}
        </CustomText>
      )}

      <CustomText variant="body" color={colors.secondaryText} style={styles.description}>
        {description}
      </CustomText>

      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
  },
  iconOuter: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
});
