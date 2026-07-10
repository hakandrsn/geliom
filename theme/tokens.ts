import { ViewStyle } from 'react-native';

/**
 * Design Tokens
 * Spacing, radius ve gölge değerleri için tek kaynak.
 * Component'lerde asla elle sayı yazma — buradaki token'ları kullan.
 */

// 4pt tabanlı spacing ölçeği
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export type SpacingKey = keyof typeof spacing;

// Köşe yuvarlaklığı ölçeği
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 999,
} as const;

export type RadiusKey = keyof typeof radius;

// Ekran geneli layout sabitleri
export const layout = {
  /** Ekran kenarlarından içeriğe standart boşluk */
  screenPadding: spacing.lg,
  /** Standart dokunma hedefi (Apple HIG minimumu) */
  touchTarget: 44,
} as const;

export interface Shadows {
  /** Kartlar için yumuşak, zemine oturan gölge */
  card: ViewStyle;
  /** Modal, popover gibi yüzen katmanlar için belirgin gölge */
  floating: ViewStyle;
}

/**
 * Tema moduna göre gölge üretir.
 * Dark modda gölgeler görünmez olduğu için daha koyu/yoğun değerler kullanılır;
 * dark modda derinlik hissi esas olarak cardBackground katmanından gelir.
 */
export const getShadows = (isDark: boolean): Shadows => ({
  card: {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.35 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.5 : 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
});
