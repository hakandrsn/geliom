import { Typography } from '@/components/shared';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export const GroupListBottomSheet: React.FC = () => {
  const { selectedGroup, setSelectedGroup, groups, isLoading } = useGroupContext();
  const { closeBottomSheet } = useBottomSheet();
  const { colors } = useTheme();
  const router = useRouter();

  const handleGroupSelect = useCallback(async (group: typeof groups[0]) => {
    await setSelectedGroup(group);
    closeBottomSheet();
  }, [setSelectedGroup, closeBottomSheet]);

  const handleCreateGroup = useCallback(() => {
    closeBottomSheet();
    // Expo Router kullanarak navigate et
    router.push('/(drawer)/(group)/create-group');
  }, [closeBottomSheet, router]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h3" color={colors.text} style={styles.headerTitle}>
          Gruplarım
        </Typography>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.secondaryText} />
            <Typography variant="bodyLarge" color={colors.secondaryText} style={styles.emptyText}>
              Henüz grubunuz yok
            </Typography>
            <Typography variant="body" color={colors.secondaryText} style={styles.emptySubtext}>
              İlk grubunuzu oluşturun ve arkadaşlarınızla bağlantı kurun
            </Typography>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupItem,
                    {
                      backgroundColor: isSelected ? colors.tertiary : colors.cardBackground,
                      borderColor: isSelected ? colors.primary : colors.stroke,
                    },
                  ]}
                  onPress={() => handleGroupSelect(group)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupItemContent}>
                    <View style={styles.groupInfo}>
                      <Typography
                        variant="bodyLarge"
                        color={colors.text}
                        style={styles.groupName}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Typography>
                      {group.type && (
                        <Typography variant="caption" color={colors.secondaryText} style={styles.groupType}>
                          {group.type}
                        </Typography>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateGroup}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.white} />
          <Typography variant="button" color={colors.white} style={styles.createButtonText}>
            Yeni Grup Oluştur
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  loader: {
    marginTop: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  groupsList: {
    padding: 16,
    gap: 12,
  },
  groupItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  groupItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    marginBottom: 4,
    fontWeight: '500',
  },
  groupType: {
    textTransform: 'capitalize',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontWeight: '600',
  },
});

