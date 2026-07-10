import type { GroupSummary } from "@/api/types";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Button, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Share, StyleSheet, View } from "react-native";

interface DashboardEmptyProps {
  group: GroupSummary;
}

/**
 * Grupta başka üye yokken ekranın kalan alanını dolduran davet hero'su.
 * Bu ekrandaki EN ÖNEMLİ aksiyon davet etmektir — kod + buton merkezde durur.
 */
export default function DashboardEmpty({ group }: DashboardEmptyProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!group.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [group.inviteCode]);

  const handleShareInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `${group.name} grubuna katıl!\n\nDavet Kodu: ${group.inviteCode}\n\nUygulamayı indir ve bu kodu kullanarak gruba katıl.`,
        title: `${group.name} - Grup Daveti`,
      });
    } catch (error) {
      console.error("Davet paylaşılırken hata oluştu:", error);
    }
  }, [group.name, group.inviteCode]);

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.passiveState }]}>
        <Ionicons name="people-outline" size={24} color={colors.primary} />
      </View>

      <Typography variant="h4" color={colors.text} style={styles.title}>
        Grup şu an sessiz
      </Typography>
      <Typography
        variant="bodySmall"
        color={colors.secondaryText}
        style={styles.description}
      >
        Davet kodunu paylaş, sevdiklerin gruba katılsın.
      </Typography>

      {/* Davet kodu — dokununca kopyalanır */}
      <BouncyButton
        onPress={handleCopyCode}
        style={[
          styles.codeCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: copied ? colors.success : colors.stroke,
          },
        ]}
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          color={colors.text}
          style={styles.code}
        >
          {group.inviteCode}
        </Typography>
        <View style={styles.copyHint}>
          <Ionicons
            name={copied ? "checkmark-circle" : "copy-outline"}
            size={14}
            color={copied ? colors.success : colors.lightText}
          />
          <Typography
            variant="caption"
            color={copied ? colors.success : colors.lightText}
          >
            {copied ? "Kopyalandı!" : "Kopyalamak için dokun"}
          </Typography>
        </View>
      </BouncyButton>

      <Button
        variant="gradient"
        title="Davet Et"
        icon={<Ionicons name="share-social" size={20} color="#FFFFFF" />}
        onPress={handleShareInvite}
        style={styles.inviteButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  codeCard: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: spacing.lg,
  },
  code: {
    letterSpacing: 6,
  },
  copyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  inviteButton: {
    alignSelf: "stretch",
  },
});
