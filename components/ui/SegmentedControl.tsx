import { BouncyButton } from "@/components/anim/AnimatedComponents";
import CustomText from "@/components/shared/Text";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export interface SegmentItem<K extends string> {
  key: K;
  label: string;
  /** Etiketin altında küçük değer/ipucu (örn. seçili durum) */
  hint?: string;
  /** Sağ üstte küçük nokta (örn. "bir şey seçili") */
  dot?: boolean;
}

export interface SegmentedControlProps<K extends string> {
  items: SegmentItem<K>[];
  /** null: hiçbir segment aktif değil (örn. dropdown kapalı) */
  value: K | null;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * İki-üç seçenekli sekme kontrolü. Aktif segment kart zemini ve gölgeyle
 * öne çıkar; pasifler zeminsiz. Composer gibi "bir alanı görüntüle" akışları için.
 */
export default function SegmentedControl<K extends string>({
  items,
  value,
  onChange,
  style,
}: SegmentedControlProps<K>) {
  const { colors, shadows } = useTheme();

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.secondaryBackground },
        style,
      ]}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          // BouncyButton stilini iç view'a uygular; eşit bölüşüm için dış sarmalayıcı
          <View key={item.key} style={styles.slot}>
            <BouncyButton
              onPress={() => onChange(item.key)}
              scaleTo={0.99}
              style={[
                styles.segment,
                active && { backgroundColor: colors.sheetBackground },
                active && shadows.card,
              ]}
            >
              <View style={styles.labelRow}>
                <CustomText
                  variant="caption"
                  fontWeight="semibold"
                  color={active ? colors.primary : colors.secondaryText}
                  numberOfLines={1}
                  style={styles.label}
                >
                  {item.label.toLocaleUpperCase("tr-TR")}
                </CustomText>
                {item.dot && (
                  <View
                    style={[styles.dot, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
              {item.hint !== undefined && (
                <CustomText
                  variant="bodySmall"
                  fontWeight={item.dot ? "semibold" : "regular"}
                  // Seçim varsa metin güçlü; "Seçilmedi" soluk kalır
                  color={
                    active
                      ? colors.primary
                      : item.dot
                        ? colors.text
                        : colors.lightText
                  }
                  numberOfLines={1}
                >
                  {item.hint}
                </CustomText>
              )}
            </BouncyButton>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  slot: {
    flex: 1,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  label: {
    letterSpacing: 0.4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
});
