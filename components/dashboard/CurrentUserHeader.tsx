import type { DashboardMember } from "@/api/dashboard";
import { Typography } from "@/components/shared";
import { Avatar, Card } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { formatStatusMood } from "@/utils/status-display";
import React from "react";
import { StyleSheet, View } from "react-native";

interface CurrentUserHeaderProps {
  member: DashboardMember;
}

/**
 * Kompakt "benim durumum" kartı — tek satır: avatar + isim + mevcut durum.
 * Asıl alan grup üyelerine ait olduğu için bilinçli olarak küçük tutuldu.
 */
export default function CurrentUserHeader({ member }: CurrentUserHeaderProps) {
  const { colors } = useTheme();

  const displayName = member.displayName || member.customId || "Ben";
  // Status ve mood birlikte gösterilir: "Toplantıda / Yorgun", tek varsa teki
  const statusLine = formatStatusMood(member.statusText, member.moodText);
  const moodEmoji = member.moodEmoji;

  return (
    <Card padding={spacing.md}>
      <View style={styles.row}>
        <Avatar photoUrl={member.photoUrl} size={44} ring badge={moodEmoji} />

        <View style={styles.info}>
          <Typography
            variant="body"
            fontWeight="semibold"
            color={colors.text}
            numberOfLines={1}
          >
            {displayName}
          </Typography>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusLine
                    ? colors.success
                    : colors.lightText,
                },
              ]}
            />
            <Typography
              variant="caption"
              color={statusLine ? colors.secondaryText : colors.lightText}
              numberOfLines={1}
              style={styles.statusText}
            >
              {statusLine || "Aşağıdan durumunu seç"}
            </Typography>
          </View>
        </View>

        <View
          style={[styles.meBadge, { backgroundColor: colors.passiveState }]}
        >
          <Typography variant="caption" fontWeight="semibold" color={colors.primary}>
            Sen
          </Typography>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
  },
  meBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
});
