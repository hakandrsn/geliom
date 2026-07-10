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
import CurrentUserHeader from "@/components/dashboard/CurrentUserHeader";
import MoodSelector from "@/components/dashboard/MoodSelector";
import StatusSelector from "@/components/dashboard/StatusSelector";

interface DashboardHeaderProps {
  myMemberData?: DashboardMember;
  group: GroupSummary;
  otherMemberLength: number;
}

export default function DashboardHeader({
  myMemberData,
  group,
  otherMemberLength,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);

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
      {/* 1. Benim Kartım — en üstte */}
      <View style={[styles.paddedSection, styles.selfSection]}>
        <CurrentUserHeader member={selfMember} />
      </View>

      {/* 2. Grup adı + davet kodunu kopyala */}
      <View style={styles.groupRow}>
        <View style={styles.titleContainer}>
          <Typography
            variant="h4"
            fontWeight="bold"
            color={colors.text}
            numberOfLines={1}
          >
            {group.name}
          </Typography>
          <Typography variant="caption" color={colors.secondaryText}>
            {otherMemberLength + 1} Üye
          </Typography>
        </View>

        <BouncyButton
          onPress={handleCopyInviteCode}
          style={[
            styles.copyButton,
            {
              backgroundColor: copied
                ? colors.success + "22"
                : colors.passiveState,
            },
          ]}
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={15}
            color={copied ? colors.success : colors.primary}
          />
          <Typography
            variant="caption"
            fontWeight="semibold"
            color={copied ? colors.success : colors.primary}
          >
            {copied ? "Kopyalandı" : "Kopyala"}
          </Typography>
        </BouncyButton>
      </View>

      {/* 3. Status & Mood Selectors */}
      <View style={styles.selectorsContainer}>
        <View style={styles.paddedSection}>
          <Typography
            variant="label"
            fontWeight="semibold"
            color={colors.secondaryText}
            style={styles.selectorLabel}
          >
            Aklında hangisi var?
          </Typography>
        </View>
        <StatusSelector groupId={group.id} currentStatusId={undefined} />

        <View style={styles.paddedSection}>
          <Typography
            variant="label"
            fontWeight="semibold"
            color={colors.secondaryText}
            style={[styles.selectorLabel, styles.selectorLabelSecond]}
          >
            Neler hissediyorsun?
          </Typography>
        </View>
        <MoodSelector groupId={group.id} currentMoodId={undefined} />
      </View>

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
  groupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  paddedSection: {
    paddingHorizontal: layout.screenPadding,
  },
  selectorsContainer: {
    marginTop: spacing.xl,
  },
  selectorLabel: {
    letterSpacing: 0.2,
    marginBottom: spacing.sm,
  },
  selectorLabelSecond: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginTop: spacing.xl,
  },
});
