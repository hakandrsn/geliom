import CustomText from "@/components/shared/Text";
import { useTheme } from "@/contexts/ThemeContext";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

export interface DropdownTriggerProps {
  label: string;
  /** Seçili değer; yoksa placeholder soluk gösterilir */
  value?: string;
  placeholder?: string;
  /** Bağlı panel açık mı — ok yukarı döner, kenarlık vurgulanır */
  open?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Açılır panel tetikleyicisi: üstte küçük etiket, altta seçili değer, sağda
 * aşağı ok. Yan yana birden fazlası `gap` ile ayrı durur (segment değil).
 */
export default function DropdownTrigger({
  label,
  value,
  placeholder = "Seçilmedi",
  open = false,
  onPress,
  style,
}: DropdownTriggerProps) {
  const { colors } = useTheme();

  return (
    // Stil doğrudan Pressable'da: genişliği satırdan alır, metin sütunu
    // kalan alanı kaplar (BouncyButton stili iç görünüme verdiği için kullanılmaz)
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: open ? colors.passiveState : colors.background,
          borderColor: open ? colors.primary : colors.stroke,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.text}>
        <CustomText
          variant="caption"
          fontWeight="semibold"
          color={open ? colors.primary : colors.secondaryText}
          numberOfLines={1}
          style={styles.label}
        >
          {label.toLocaleUpperCase("tr-TR")}
        </CustomText>
        <CustomText
          variant="bodySmall"
          fontWeight={value ? "semibold" : "regular"}
          color={value ? colors.text : colors.lightText}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </CustomText>
      </View>
      <Ionicons
        name={open ? "chevron-up" : "chevron-down"}
        size={18}
        color={open ? colors.primary : colors.secondaryText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: layout.touchTarget + spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    letterSpacing: 0.4,
  },
});
