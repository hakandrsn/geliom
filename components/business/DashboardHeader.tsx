import { DashboardMember } from "@/api/dashboard";
import type { GroupSummary } from "@/api/types";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Typography } from "@/components/shared";
import { SectionHeader } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

// Components
import type { PickerTab } from "@/components/dashboard/PickerDropdown";
import PausedBanner from "@/components/dashboard/PausedBanner";
import StatusComposer from "@/components/dashboard/StatusComposer";

interface DashboardHeaderProps {
  myMemberData?: DashboardMember;
  group: GroupSummary;
  otherMemberLength: number;
  /** Açık dropdown sekmesi — DashboardView yönetir */
  activePickerTab: PickerTab | null;
  onTogglePicker: (tab: PickerTab, anchorBottomY: number) => void;
}

export default function DashboardHeader({
  myMemberData,
  group,
  otherMemberLength,
  activePickerTab,
  onTogglePicker,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);
  const isPaused = useAppStore(
    (state) => state.session?.group.id === group.id && !!state.session.group.isPaused,
  );

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  // Mapping global user to DashboardMember format if myMemberData is incomplete
  const selfMember: DashboardMember = useMemo(
    () => ({
      userId: user?.id || "",
      displayName: myMemberData?.displayName || user?.displayName || "",
      photoUrl: myMemberData?.photoUrl || user?.photoUrl || undefined,
      customId: myMemberData?.customId || user?.customId,
      ...myMemberData,
    }),
    [myMemberData, user],
  );

  const handleCopyInviteCode = async () => {
    if (!group.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.headerContainer}>
      {/* 1. Composer: durumum + seçiciler tek kartta */}
      <View style={[styles.paddedSection, styles.selfSection]}>
        <StatusComposer
          member={selfMember}
          activeTab={activePickerTab}
          onToggleTab={onTogglePicker}
          disabled={isPaused}
        />
      </View>

      {/* 2. İnce bilgi satırı — grup adı zaten header'da; burada üye sayısı ve kod */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Ionicons name="people-outline" size={14} color={colors.lightText} />
          <Typography variant="caption" color={colors.secondaryText}>
            {otherMemberLength + 1} üye
          </Typography>
        </View>

        <BouncyButton onPress={handleCopyInviteCode} style={styles.codeButton}>
          <Typography variant="caption" color={colors.lightText}>
            Davet kodu{" "}
          </Typography>
          <Typography
            variant="caption"
            fontWeight="semibold"
            color={copied ? colors.success : colors.text}
            style={styles.code}
          >
            {group.inviteCode}
          </Typography>
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={13}
            color={copied ? colors.success : colors.lightText}
          />
        </BouncyButton>
      </View>

      {/* 3. Duraklatılmış grup: üye listesinin hemen üstünde, kırmızı */}
      {isPaused && (
        <View style={[styles.paddedSection, styles.pausedSection]}>
          <PausedBanner isOwner={group.ownerId === user?.id} />
        </View>
      )}

      {/* 4. Üye Listesi Başlığı */}
      <View style={styles.paddedSection}>
        <SectionHeader
          title="Üyeler"
          count={otherMemberLength}
          style={styles.sectionTitle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.sm,
  },
  selfSection: {
    paddingTop: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.md,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  codeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: layout.touchTarget - spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  code: {
    letterSpacing: 1.5,
  },
  paddedSection: {
    paddingHorizontal: layout.screenPadding,
  },
  pausedSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginTop: spacing.xl,
  },
});
