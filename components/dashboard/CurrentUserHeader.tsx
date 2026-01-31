import type { DashboardMember } from "@/api/dashboard";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { getAvatarSource } from "@/utils/avatar";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

interface CurrentUserHeaderProps {
  member: DashboardMember; // YENİ TİP
}

export default function CurrentUserHeader({ member }: CurrentUserHeaderProps) {
  const { colors } = useTheme();

  const displayName = member.displayName || member.customId || "Ben";
  const avatarSource = getAvatarSource(member.photoUrl);

  const statusText = member.statusText;
  const statusColor = colors.secondaryText; // Simplifying color logic for now as requested

  const moodEmoji = member.moodEmoji;

  return (
    <Animated.View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Image
            source={avatarSource}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.greetingContainer}>
            <Typography variant="caption" color={colors.secondaryText}>
              Tekrar merhaba,
            </Typography>
            <Typography variant="h4" color={colors.text} style={styles.name}>
              {displayName}
            </Typography>
          </View>
        </View>

        {moodEmoji && (
          <View
            style={[
              styles.moodBadge,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Typography variant="h3">{moodEmoji}</Typography>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Typography
          variant="h3"
          color={statusText ? colors.text : colors.secondaryText}
          style={styles.statusText}
        >
          {statusText || "Durum ayarla..."}
        </Typography>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    justifyContent: "center",
  },
  name: {
    fontWeight: "700",
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: "800",
  },
});
