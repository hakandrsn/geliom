import { useCustomStatuses, useDefaultStatuses, useSetUserStatus } from '@/api/statuses';
import { GeliomButton } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface StatusSelectorProps {
  groupId: string;
  currentStatusId?: number;
  onAddPress?: () => void;
}

export default function StatusSelector({ groupId, currentStatusId, onAddPress }: StatusSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

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
                onPress={onAddPress}
                size="small"
                layout="icon-only"
                icon="add"
                style={{ borderColor: colors.stroke, borderWidth: 1, borderStyle: 'dashed' }}
              />
            );
          }

          const isSelected = currentStatusId === item.id;
          const notifies = 'notifies' in item ? item.notifies : false;
          const statusColor = item.is_custom ? colors.primary : (notifies ? colors.warning : colors.secondaryText);

          return (
            <GeliomButton
              state={isSelected ? 'active' : 'passive'}
              onPress={() => handleStatusSelect(item.id)}
              size="small"
              layout="icon-left"
              icon={isSelected ? "radio-button-on" : "radio-button-off"}
              style={[
                styles.button,
                isSelected ? { backgroundColor: statusColor } : { borderColor: statusColor, borderWidth: 1 }
              ] as any}
            >
              {item.text}
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
    minWidth: 100,
  },
});