import { getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useBottomSheet } from '../../contexts/BottomSheetContext';
import { useGroupContext } from '../../contexts/GroupContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BouncyButton } from '../anim/AnimatedComponents';
import Typography from './Typography';

function GroupListBottomSheetComponent() {
  // Context'ten gerçek verileri al
  const { selectedGroup, setSelectedGroup, groups, isLoading } = useGroupContext();
  const { closeBottomSheet } = useBottomSheet();
  const { colors } = useTheme();
  const router = useRouter();
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const handleGroupSelect = useCallback(async (group: typeof groups[0]) => {
    await setSelectedGroup(group);
    closeBottomSheet();
  }, [setSelectedGroup, closeBottomSheet]);

  const handleCreateGroup = useCallback(() => {
    setActionModalVisible(false);
    closeBottomSheet();
    // Bottom sheet tamamen kapandıktan sonra navigate et
    setTimeout(() => {
      router.push('/(drawer)/(group)/create-group');
    }, 300);
  }, [closeBottomSheet, router]);

  const handleJoinGroup = useCallback(() => {
    setActionModalVisible(false);
    closeBottomSheet();
    // Bottom sheet tamamen kapandıktan sonra navigate et
    setTimeout(() => {
      router.push('/(drawer)/(group)/join-group');
    }, 300);
  }, [closeBottomSheet, router]);

  // Gruplar yüklenirken gösterilecek içerik
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="caption" color={colors.secondaryText} style={{ marginTop: 12 }}>
          Gruplar yükleniyor...
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h3" color={colors.text} style={styles.headerTitle}>
          Gruplarım
        </Typography>
        <TouchableOpacity
          onPress={() => setActionModalVisible(true)}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.secondaryText} />
            <Typography variant="body" color={colors.secondaryText} style={styles.emptyText}>
              Henüz bir grupta değilsin.
            </Typography>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <BouncyButton
                  key={group.id}
                  onPress={() => handleGroupSelect(group)}
                  style={[
                    styles.groupItem,
                    {
                      backgroundColor: isSelected ? colors.tertiary + '30' : colors.cardBackground,
                      borderColor: isSelected ? colors.primary : colors.stroke,
                    },
                  ]}
                >
                  <View style={styles.groupItemContent}>
                    {group.owner ? (
                      <View style={styles.avatarContainer}>
                        <Image
                          source={getAvatarSource(group.owner.avatar)}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View style={[
                        styles.iconBadge, 
                        { 
                          backgroundColor: isSelected ? colors.primary : colors.cardBackground, 
                          borderColor: colors.stroke, 
                          borderWidth: isSelected ? 0 : 1 
                        }
                      ]}>
                        <Ionicons 
                          name={group.type === 'family' ? 'home' : group.type === 'work' ? 'briefcase' : 'people'} 
                          size={20} 
                          color={isSelected ? 'white' : colors.secondaryText} 
                        />
                      </View>
                    )}
                    <View style={styles.groupInfo}>
                      <Typography variant="h5" color={colors.text} style={styles.groupName} numberOfLines={1}>
                        {group.name}
                      </Typography>
                      <Typography variant="caption" color={colors.secondaryText} style={styles.groupType}>
                         {(group as any).member_count ? `${(group as any).member_count} Üye` : 'Grup'} • {
                           group.type === 'family' ? 'Aile' : 
                           group.type === 'friends' ? 'Arkadaşlar' : 
                           group.type === 'work' ? 'İş' : 
                           'Diğer'
                         }
                      </Typography>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                  </View>
                </BouncyButton>
              );
            })}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: colors.stroke }]}
              onPress={handleCreateGroup}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Typography variant="h5" color={colors.text} style={{ marginLeft: 12 }}>
                Yeni Grup Oluştur
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleJoinGroup}
            >
              <Ionicons name="person-add" size={24} color={colors.secondary} />
              <Typography variant="h5" color={colors.text} style={{ marginLeft: 12 }}>
                Gruba Katıl
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// React.memo kaldırıldı - her açılışta yeni key ile render ediliyor
// Bu sayede context güncellemeleri her zaman yansır
export default GroupListBottomSheetComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  groupsList: {
    padding: 16,
    gap: 12,
  },
  groupItem: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  groupItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    marginBottom: 2,
    fontWeight: '600',
  },
  groupType: {
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  bottomButtons: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
});