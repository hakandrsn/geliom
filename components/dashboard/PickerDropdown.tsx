import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { layout, radius, spacing } from "@/theme/tokens";
import React from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeOutUp, Keyframe } from "react-native-reanimated";

// Opaklık değişmeden, sekmenin altından hafifçe süzülerek açılır
const DROP_IN = new Keyframe({
  0: { transform: [{ translateY: -8 }] },
  100: { transform: [{ translateY: 0 }] },
}).duration(160);
import MoodSelector from "./MoodSelector";
import StatusSelector from "./StatusSelector";

export type PickerTab = "status" | "mood";

interface PickerDropdownProps {
  tab: PickerTab;
  /** Panelin üst kenarı — kapsayıcıya göre */
  top: number;
  /** Kapsayıcının yüksekliği (panel alt sınırı için) */
  containerHeight: number;
  groupId: string;
  prompt: string;
  onClose: () => void;
}

const PANEL_PADDING = spacing.sm;

/**
 * Composer sekmesinin altında yüzen seçenek paneli. İçeriği itmez, üstüne
 * açılır. Dışına dokununca veya seçim yapılınca kapanır.
 */
export default function PickerDropdown({
  tab,
  top,
  containerHeight,
  groupId,
  prompt,
  onClose,
}: PickerDropdownProps) {
  const { colors, shadows } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const innerWidth = screenWidth - layout.screenPadding * 2 - PANEL_PADDING * 2;
  const maxHeight = Math.max(200, containerHeight - top - spacing.xxl);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Arka plan: hafif karartma, dokununca kapat */}
      {/* Karartma yok: arka plan tam opak kalır; dışına dokunmak kapatır */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        entering={DROP_IN}
        exiting={FadeOutUp.duration(120)}
        style={[
          styles.panel,
          {
            top,
            maxHeight,
            backgroundColor: colors.sheetBackground,
            borderColor: colors.stroke,
          },
          shadows.floating,
        ]}
      >
        {/* Ok: panelin karttan çıktığını gösterir */}
        <View
          style={[
            styles.caret,
            {
              backgroundColor: colors.sheetBackground,
              borderColor: colors.stroke,
              left: tab === "status" ? "22%" : "72%",
            },
          ]}
        />
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Typography variant="bodySmall" color={colors.secondaryText} style={styles.prompt}>
            {prompt}
          </Typography>
          {tab === "status" ? (
            <StatusSelector
              groupId={groupId}
              compact
              layout="list"
              onSelect={onClose}
              onWillOpenSheet={onClose}
            />
          ) : (
            <MoodSelector
              groupId={groupId}
              compact
              layout="list"
              availableWidth={innerWidth}
              onSelect={onClose}
              onWillOpenSheet={onClose}
            />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: layout.screenPadding,
    right: layout.screenPadding,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  caret: {
    position: "absolute",
    top: -7,
    width: 14,
    height: 14,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
  content: {
    padding: PANEL_PADDING,
  },
  prompt: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
});
