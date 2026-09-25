import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { layout, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface SelectorHeaderProps {
  title: string;
  /** Verilirse sağda "Kaldır" aksiyonu görünür */
  onClear?: () => void;
}

/** Seçici başlığı: soru + (seçim varsa) sağda küçük "Kaldır". */
export default function SelectorHeader({ title, onClear }: SelectorHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Typography
        variant="h6"
        fontWeight="semibold"
        color={colors.text}
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Typography>
      {onClear && (
        <BouncyButton onPress={onClear} style={styles.clear}>
          <Ionicons name="close-circle" size={14} color={colors.lightText} />
          <Typography variant="caption" fontWeight="semibold" color={colors.secondaryText}>
            Kaldır
          </Typography>
        </BouncyButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
  },
  clear: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
  },
});
