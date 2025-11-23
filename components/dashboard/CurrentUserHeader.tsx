import { Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser, UserGroupMoodWithMood, UserStatusWithStatus } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface CurrentUserHeaderProps {
  member: GroupMemberWithUser;
  status?: UserStatusWithStatus;
  mood?: UserGroupMoodWithMood;
}

export default function CurrentUserHeader({ member, status, mood }: CurrentUserHeaderProps) {
  const { colors } = useTheme();

  const user = member.user as any;
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Ben';
  const avatarSource = getAvatarSource(user?.avatar);

  const statusText = status?.status?.text;
  const statusColor = status?.status?.is_custom
    ? colors.primary
    : (status?.status?.notifies ? colors.warning : colors.secondaryText);

  const moodEmoji = mood?.mood?.emoji;
  const moodText = mood?.mood?.text;

  return (
    <Animated.View
      style={styles.container}
    >
      <View style={styles.topRow}>
        {/* Avatar & Greeting */}
        <View style={styles.userInfo}>
          <Image
            source={avatarSource}
            style={styles.avatar}
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

        {/* Mood Indicator (Top Right) */}
        {moodEmoji && (
          <View style={[styles.moodBadge, { backgroundColor: colors.cardBackground }]}>
            <Typography variant="h3">{moodEmoji}</Typography>
          </View>
        )}
      </View>

      {/* Status Display (Large & Bold) */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Typography
          variant="h3"
          color={statusText ? colors.text : colors.secondaryText}
          style={styles.statusText}
        >
          {statusText || 'Durum ayarla...'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
  },
  moodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '800', // Extra bold for emphasis
  },
});
