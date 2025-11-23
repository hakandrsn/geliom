import { useMoods, useSetUserGroupMood } from '@/api/moods';
import { GeliomButton } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface MoodSelectorProps {
  groupId: string;
  currentMoodId?: number;
  onAddPress?: () => void;
}

export default function MoodSelector({ groupId, currentMoodId, onAddPress }: MoodSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Fetch all moods
  const { data: allMoods = [], isLoading } = useMoods(groupId);

  const setMoodMutation = useSetUserGroupMood();

  const handleMoodSelect = (moodId: number) => {
    if (!user) return;
    setMoodMutation.mutate({
      user_id: user.id,
      mood_id: moodId,
      group_id: groupId || undefined,
    });
  };

  // Sort moods: Custom first, then default
  const sortedMoods = useMemo(() => {
    return [...allMoods].sort((a, b) => {
      const aIsCustom = a.group_id != null;
      const bIsCustom = b.group_id != null;
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      return a.text.localeCompare(b.text);
    });
  }, [allMoods]);

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...sortedMoods, { id: -1, text: 'Ekle', emoji: '➕', group_id: null }]} // Add dummy item for "+" button
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          // Render "+" Button
          if (item.id === -1) {
            return (
              <GeliomButton
                state="passive"
                onPress={onAddPress}
                size="small"
                layout="icon-only"
                icon="add"
                style={{ borderColor: colors.stroke, borderWidth: 1, borderStyle: 'dashed' }}
              />
            );
          }

          const isSelected = currentMoodId === item.id;
          const isCustom = item.group_id != null;
          const activeColor = isCustom ? colors.primary : colors.secondary;

          return (
            <GeliomButton
              state={isSelected ? 'active' : 'passive'}
              onPress={() => handleMoodSelect(item.id)}
              size="small"
              style={[
                styles.button,
                isSelected ? { backgroundColor: activeColor } : { borderColor: activeColor, borderWidth: 1 }
              ] as any}
            >
              {item.emoji} {item.text}
            </GeliomButton>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  button: {
    marginRight: 8,
    minWidth: 80,
  },
});
