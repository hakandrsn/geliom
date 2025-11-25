import { useCustomStatuses, useDefaultStatuses, useSetUserStatus } from '@/api/statuses';
import AddStatusMoodModal from '@/components/dashboard/AddStatusMoodModal';
import { GeliomButton } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useManageStatusMood } from '@/hooks/useManageStatusMood';
import { BlurView } from 'expo-blur';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface StatusSelectorProps {
  groupId: string;
  currentStatusId?: number;
  onAddPress?: () => void;
}

export default function StatusSelector({ groupId, currentStatusId, onAddPress }: StatusSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Management Hook
  const { handleAddStatus, checkSubscriptionAndProceed } = useManageStatusMood(groupId);

  // Fetch default and custom statuses
  const { data: defaultStatuses = [], isLoading: isLoadingDefault } = useDefaultStatuses();
  const { data: customStatuses = [], isLoading: isLoadingCustom } = useCustomStatuses(groupId, user?.id);

  const setStatusMutation = useSetUserStatus();

  const handleStatusSelect = (statusId: number) => {
    if (!user) return;
    setStatusMutation.mutate({
      user_id: user.id,
      group_id: groupId,
      status_id: statusId,
    });
  };

  const isLoading = isLoadingDefault || isLoadingCustom;

  // Merge and sort statuses
  const sortedStatuses = useMemo(() => {
    const all = [...customStatuses, ...defaultStatuses];
    return all.sort((a, b) => {
      // Custom statuses first
      if (a.is_custom && !b.is_custom) return -1;
      if (!a.is_custom && b.is_custom) return 1;
      // Then alphabetical
      return a.text.localeCompare(b.text);
    });
  }, [customStatuses, defaultStatuses]);

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...sortedStatuses, { id: -1, text: 'Ekle', is_custom: false }]} // Add dummy item for "+" button
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

          const isSelected = currentStatusId === item.id;

          return (
            <View style={[
              styles.buttonContainer,
              isSelected && styles.buttonContainerSelected
            ]}>
              {/* Blur and Color Background */}
              <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
                <BlurView intensity={80} tint="systemMaterial" style={StyleSheet.absoluteFill} />
                <View style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.secondaryBackground, opacity: isSelected ? 0.8 : 0.5 }
                ]} />
              </View>

              <GeliomButton
                state={isSelected ? 'active' : 'passive'}
                onPress={() => handleStatusSelect(item.id)}
                size="small"
                layout="icon-left"
                icon={isSelected ? "radio-button-on" : "radio-button-off"}
                backgroundColor="transparent"
                textColor={isSelected ? colors.primary : colors.text}
                style={[
                  styles.button,
                  { borderColor: isSelected ? colors.blurBackground : 'transparent' }
                ] as any}
              >
                {item.text}
              </GeliomButton>
            </View>
          );
        }}
      />

      <AddStatusMoodModal
        visible={isModalVisible}
        type="status"
        onClose={() => setIsModalVisible(false)}
        onSave={handleAddStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
    minWidth: 100,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    zIndex: 2,
    marginBottom: 0, // Removed extra margin since edge is gone
  },
});