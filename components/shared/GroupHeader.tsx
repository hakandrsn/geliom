import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { GroupWithOwner } from '../../types/database';
import { BouncyButton } from '../anim/AnimatedComponents';
import Typography from './Typography';

interface GroupHeaderProps {
  group: GroupWithOwner | null;
  onPress: () => void;
}

export default function GroupHeader({ group, onPress }: GroupHeaderProps) {
  const { colors } = useTheme();

  // Grup adını max 15 karakter göster
  const displayName = group?.name
    ? group.name.length > 15
      ? group.name.substring(0, 15) + '...'
      : group.name
    : 'Birlik Oluştur';

  return (
    <BouncyButton
      onPress={onPress}
      style={[styles.container]}
    >
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="people" size={14} color="white" />
        </View>

        <Typography
          variant="h6"
          color={colors.text}
          style={styles.groupName}
          numberOfLines={1}
        >
          {displayName}
        </Typography>

        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.secondaryText}
          style={styles.icon}
        />
      </View>
    </BouncyButton>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start', // Sadece kendi içeriğini kaplasın
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 14,
    maxWidth: 120, // Max genişlik sınırı (15 karakter için yeterli)
  },
  icon: {
    marginLeft: 2,
  },
});