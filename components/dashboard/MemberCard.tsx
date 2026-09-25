import type { DashboardMember } from "@/api/dashboard";
import { Typography } from "@/components/shared";
import { Avatar, Card } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/theme/tokens";
import { formatStatusMood } from "@/utils/status-display";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

interface MemberCardProps {
  member: DashboardMember;
  isMe?: boolean;
  onPress?: () => void;
}

function MemberCard({ member, isMe, onPress }: MemberCardProps) {
  const { colors } = useTheme();

  // Mood değiştiğinde rozet scale efekti
  const moodScale = useSharedValue(1);

  useEffect(() => {
    if (member.moodEmoji) {
      moodScale.value = withSequence(withSpring(1.12), withSpring(1));
    }
  }, [member.updatedAt]);

  const animatedMoodStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moodScale.value }],
  }));

  const displayName = member.displayName || member.customId || "";
  // İsim customId'den farklıysa alt satırda customId'yi göster
  const secondaryName =
    member.customId && member.customId !== displayName
      ? `@${member.customId}`
      : undefined;

  // Status ve mood birlikte gösterilir: "Toplantıda / Yorgun", tek varsa teki
  const statusLine = formatStatusMood(member.statusText, member.moodText);
  const hasStatus = !!statusLine;

  return (
    <Card
      onPress={!isMe ? onPress : undefined}
      highlighted={isMe}
      padding={spacing.lg}
      style={styles.card}
    >
      <View style={styles.contentWrapper}>
        <Animated.View style={animatedMoodStyle}>
          <Avatar
            photoUrl={member.photoUrl}
            name={member.displayName}
            seed={member.userId}
            size={52}
            badge={member.moodEmoji ?? undefined}
          />
        </Animated.View>

        <View style={styles.infoContainer}>
          <Typography
            variant="body"
            fontWeight="semibold"
            color={colors.text}
            numberOfLines={1}
          >
            {displayName} {isMe && "(Sen)"}
          </Typography>
          {secondaryName && (
            <Typography
              variant="caption"
              color={colors.lightText}
              numberOfLines={1}
            >
              {secondaryName}
            </Typography>
          )}

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: hasStatus
                    ? colors.success
                    : colors.lightText,
                },
              ]}
            />
            <Typography
              variant="caption"
              color={hasStatus ? colors.secondaryText : colors.lightText}
              numberOfLines={1}
              style={styles.statusText}
            >
              {statusLine || "Henüz durum yok"}
            </Typography>
          </View>
        </View>

        {!isMe && onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.lightText}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
  },
});

export default React.memo(MemberCard);
