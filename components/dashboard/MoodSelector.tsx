import { useMoods, useSetUserGroupMood } from '@/api/moods';
import AddStatusMoodModal from '@/components/dashboard/AddStatusMoodModal';
import { GeliomButton } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useManageStatusMood } from '@/hooks/useManageStatusMood';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface MoodSelectorProps {
  groupId: string;
  currentMoodId?: number;
  onAddPress?: () => void;
}

function MoodSelector({ groupId, currentMoodId, onAddPress }: MoodSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Management Hook
  const { handleAddMood, checkSubscriptionAndProceed } = useManageStatusMood(groupId);

  // Fetch all moods
  const { data: allMoods = [], isLoading } = useMoods(groupId);

  const setMoodMutation = useSetUserGroupMood();

  // Handle mood select - memoize edildi
  const handleMoodSelect = useCallback((moodId: number) => {
    if (!user) return;
    setMoodMutation.mutate({
      user_id: user.id,
      mood_id: moodId,
      group_id: groupId || undefined,
    });
  }, [user, groupId, setMoodMutation]);

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
                onPress={() => checkSubscriptionAndProceed(() => setIsModalVisible(true))}
                size="small"
                layout="icon-only"
                icon="add"
                style={{ borderColor: colors.stroke, borderWidth: 1, borderStyle: 'dashed' }}
              />
            );
          }

          const isSelected = currentMoodId === item.id;

          return (
            <View style={[
              styles.buttonContainer,
              isSelected && styles.buttonContainerSelected
            ]}>
              {/* Background */}
              <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
                <View style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.secondaryBackground }
                ]} />
              </View>

              <GeliomButton
                state={isSelected ? 'active' : 'passive'}
                onPress={() => handleMoodSelect(item.id)}
                size="small"
                backgroundColor="transparent"
                textColor={isSelected ? colors.tertiary : colors.text}
                textStyle={isSelected ? {  fontWeight: 'bold' } : undefined}
                style={[
                  styles.button,
                  { borderColor: 'transparent' }
                ] as any}
              >
                {item.emoji} {item.text}
              </GeliomButton>
            </View>
          );
        }}
      />

      <AddStatusMoodModal
        visible={isModalVisible}
        type="mood"
        onClose={() => setIsModalVisible(false)}
        onSave={(text, emoji) => handleAddMood(text, emoji)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  listContent: {
    paddingLeft: 12, // Only left padding as requested
    paddingRight: 12,
    gap: 12,
    paddingBottom: 8,
  },
  buttonContainer: {
    marginBottom: 4,
    borderRadius: 12,
  },
  buttonContainerSelected: {
    transform: [{ translateY: 1 }],
  },
  button: {
    minWidth: 80,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    zIndex: 2,
    marginBottom: 0,
  },
});

// React.memo ile sarmalayıp shallow comparison yapıyoruz
export default React.memo(MoodSelector);
