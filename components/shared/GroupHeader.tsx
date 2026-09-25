import type { GroupSummary } from '@/api/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '../../contexts/ThemeContext';
import { BouncyButton } from '../anim/AnimatedComponents';
import Typography from './Typography';

interface GroupHeaderProps {
  group: GroupSummary | null;
  onPress: () => void;
}

/** Header ortasındaki grup seçici — ad uzun olsa da tek satırda kısaltılır. */
export default function GroupHeader({ group, onPress }: GroupHeaderProps) {
  const { colors } = useTheme();

  return (
    <BouncyButton onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="people" size={14} color="#FFFFFF" />
        </View>

        <Typography
          variant="label"
          fontWeight="semibold"
          color={colors.text}
          style={styles.groupName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {group?.name ?? 'Grup Oluştur'}
        </Typography>

        <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />
      </View>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    flexShrink: 1,
    maxWidth: 180,
  },
});
