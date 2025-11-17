import { Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupWithOwner } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface GroupHeaderProps {
  group: GroupWithOwner | null;
  onPress: () => void;
}

export default function GroupHeader({ group, onPress }: GroupHeaderProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Typography
          variant="h6"
          color={colors.text}
          style={styles.groupName}
          numberOfLines={1}
        >
          {group?.name || 'Create first group'}
        </Typography>
        <Ionicons
          name={group?.name ? "chevron-down" : "add-circle-outline"}
          size={20}
          color={colors.secondaryText}
          style={styles.icon}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    maxWidth: 200,
  },
  icon: {
    marginLeft: 4,
  },
});

