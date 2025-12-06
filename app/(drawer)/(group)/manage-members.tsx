import { useMutedNotificationsList, useToggleMuteUser } from '@/api';
import { useGroupMembers, useLeaveGroup, useTransferGroupOwnership } from '@/api/groups';
import { useDeleteNickname, useGroupNicknames, useUpsertNickname } from '@/api/nicknames';
import { useUpdateUserAvatar } from '@/api/users';
import { AvatarSelector, BaseLayout, GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser, User } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type GestureResponderEvent
} from 'react-native';

export default function ManageMembersScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedGroup } = useGroupContext();
  const router = useRouter();
  
  const [selectedMember, setSelectedMember] = useState<GroupMemberWithUser | null>(null);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameText, setNicknameText] = useState('');
  const [transferOwnerModalVisible, setTransferOwnerModalVisible] = useState(false);
  const [avatarSelectorVisible, setAvatarSelectorVisible] = useState(false);
  
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(selectedGroup?.id || '');
  const { data: nicknames = [] } = useGroupNicknames(selectedGroup?.id || '');
  const { data: mutedUsers = [] } = useMutedNotificationsList(user?.id || '');
  
  const upsertNickname = useUpsertNickname();
  const deleteNickname = useDeleteNickname();
  const toggleMute = useToggleMuteUser();
  const transferOwnership = useTransferGroupOwnership();
  const leaveGroup = useLeaveGroup();
  const updateAvatar = useUpdateUserAvatar();
  
  const isOwner = selectedGroup?.owner_id === user?.id;
  const mutedUserIds = new Set(mutedUsers.map(m => m.muted_user_id));
  
  // Kullanıcının nickname'ini bul (mevcut kullanıcı için)
  const getNicknameForUser = (targetUserId: string) => {
    const nickname = nicknames.find(
      n => n.setter_user_id === user?.id && n.target_user_id === targetUserId
    );
    return nickname?.nickname;
  };
  
  // Kullanıcı sessize alınmış mı?
  const isMuted = (targetUserId: string) => {
    return mutedUserIds.has(targetUserId);
  };
  
  const handleNicknamePress = (member: GroupMemberWithUser) => {
    const currentNickname = getNicknameForUser(member.user_id);
    setSelectedMember(member);
    setNicknameText(currentNickname || '');
    setNicknameModalVisible(true);
  };
  
  const handleSaveNickname = async () => {
    if (!selectedMember || !user?.id || !selectedGroup?.id) return;
    
    if (nicknameText.trim()) {
      try {
        await upsertNickname.mutateAsync({
          group_id: selectedGroup.id,
          setter_user_id: user.id,
          target_user_id: selectedMember.user_id,
          nickname: nicknameText.trim(),
        });
        setNicknameModalVisible(false);
        setNicknameText('');
        setSelectedMember(null);
      } catch (error) {
        console.error('Nickname kaydetme hatası:', error);
        Alert.alert('Hata', 'Nickname kaydedilemedi');
      }
    } else {
      // Boş ise sil
      try {
        await deleteNickname.mutateAsync({
          groupId: selectedGroup.id,
          setterUserId: user.id,
          targetUserId: selectedMember.user_id,
        });
        setNicknameModalVisible(false);
        setNicknameText('');
        setSelectedMember(null);
      } catch (error) {
        console.error('Nickname silme hatası:', error);
        Alert.alert('Hata', 'Nickname silinemedi');
      }
    }
  };
  
  const handleToggleMute = async (member: GroupMemberWithUser) => {
    if (!user?.id) return;
    
    const currentlyMuted = isMuted(member.user_id);
    
    try {
      await toggleMute.mutateAsync({
        muterUserId: user.id,
        mutedUserId: member.user_id,
        isCurrentlyMuted: currentlyMuted,
      });
    } catch (error) {
      console.error('Sessize alma hatası:', error);
      Alert.alert('Hata', 'İşlem başarısız oldu');
    }
  };
  
  const handleTransferOwnership = async (member: GroupMemberWithUser) => {
    if (!selectedGroup?.id || !isOwner) return;
    
    Alert.alert(
      'Yöneticilik Devri',
      `${member.user?.display_name || member.user?.custom_user_id} kullanıcısına yöneticiliği devretmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devret',
          style: 'destructive',
          onPress: async () => {
            try {
              await transferOwnership.mutateAsync({
                groupId: selectedGroup.id,
                newOwnerId: member.user_id,
              });
              setTransferOwnerModalVisible(false);
              setSelectedMember(null);
              Alert.alert('Başarılı', 'Yöneticilik devredildi');
              router.back();
            } catch (error) {
              console.error('Yöneticilik devri hatası:', error);
              Alert.alert('Hata', 'Yöneticilik devredilemedi');
            }
          },
        },
      ]
    );
  };
  
  const handleAvatarSelect = async (avatar: string | null) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }
    
    try {
      await updateAvatar.mutateAsync({
        userId: user.id,
        avatar,
      });
      // useUpdateUserAvatar hook'u zaten userKeys.all, userKeys.detail ve userKeys.current query'lerini invalidate ediyor
      Alert.alert('Başarılı', 'Avatar güncellendi');
    } catch (error: any) {
      console.error('Avatar güncelleme hatası:', error);
      const errorMessage = error?.message || 'Avatar güncellenemedi';
      Alert.alert('Hata', errorMessage);
    }
  };

  const handleRemoveMember = async (member: GroupMemberWithUser) => {
    if (!selectedGroup?.id || !isOwner) return;
    
    if (member.user_id === user?.id) {
      // Kendini çıkarma
      Alert.alert(
        'Gruptan Ayrıl',
        'Gruptan ayrılmak istediğinize emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Ayrıl',
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveGroup.mutateAsync({
                  groupId: selectedGroup.id,
                  userId: user.id,
                });
                router.replace('/(drawer)/home');
              } catch (error) {
                console.error('Gruptan ayrılma hatası:', error);
                Alert.alert('Hata', 'Gruptan ayrılamadınız');
              }
            },
          },
        ]
      );
    } else {
      // Başkasını çıkarma (sadece owner)
      Alert.alert(
        'Üyeyi Çıkar',
        `${member.user?.display_name || member.user?.custom_user_id} kullanıcısını gruptan çıkarmak istediğinize emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Çıkar',
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveGroup.mutateAsync({
                  groupId: selectedGroup.id,
                  userId: member.user_id,
                });
                Alert.alert('Başarılı', 'Üye gruptan çıkarıldı');
              } catch (error) {
                console.error('Üye çıkarma hatası:', error);
                Alert.alert('Hata', 'Üye çıkarılamadı');
              }
            },
          },
        ]
      );
    }
  };
  
  if (!selectedGroup) {
    return (
      <BaseLayout
        headerShow={true}
        header={{
          leftIcon: {
            icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
            onPress: () => router.back(),
          },
          title: <Typography variant="h5" color={colors.text}>Üyeleri Yönet</Typography>,
          backgroundColor: colors.background,
        }}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Typography variant="h6" style={styles.emptyText}>
            Lütfen bir grup seçin
          </Typography>
        </View>
      </BaseLayout>
    );
  }
  
  if (membersLoading) {
    return (
      <BaseLayout
        headerShow={true}
        header={{
          leftIcon: {
            icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
            onPress: () => router.back(),
          },
          title: <Typography variant="h5" color={colors.text}>Üyeleri Yönet</Typography>,
          backgroundColor: colors.background,
        }}
      >
        <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </BaseLayout>
    );
  }
  
  const renderMemberItem = ({ item }: { item: GroupMemberWithUser }) => {
    const memberUser = item.user as User;
    const isMemberOwner = selectedGroup.owner_id === item.user_id;
    const isCurrentUser = item.user_id === user?.id;
    const nickname = getNicknameForUser(item.user_id);
    const muted = isMuted(item.user_id);
    
    return (
      <View style={[styles.memberCard, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
        <View style={styles.memberHeader}>
          <View style={styles.memberLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={getAvatarSource(memberUser.avatar)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.memberInfo}>
              <Typography variant="body" fontWeight="semibold" style={styles.memberName}>
                {nickname || memberUser.display_name || memberUser.custom_user_id}
              </Typography>
              {nickname && (
                <Typography variant="caption" style={[styles.memberSubtext, { color: colors.secondaryText }]}>
                  {memberUser.display_name || memberUser.custom_user_id}
                </Typography>
              )}
              <View style={styles.badges}>
                {isMemberOwner && (
                  <Typography variant="caption" style={[styles.badge, { color: colors.primary }]}>
                    Yönetici
                  </Typography>
                )}
                {muted && (
                  <Typography variant="caption" style={[styles.badge, { color: colors.error }]}>
                    Sessize Alındı
                  </Typography>
                )}
              </View>
            </View>
          </View>
          {isCurrentUser && (
            <TouchableOpacity
              onPress={() => setAvatarSelectorVisible(true)}
              style={[styles.avatarEditButton, { backgroundColor: colors.primary + '20' }]}
            >
              <Ionicons name="camera" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.memberActions}>
          {/* Nickname */}
          <TouchableOpacity
            onPress={() => handleNicknamePress(item)}
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          >
            <Typography variant="bodySmall" style={{ color: colors.primary }}>
              {nickname ? '✏️' : '➕'} Takma Ad
            </Typography>
          </TouchableOpacity>
          
          {/* Sessize Al/Kaldır */}
          <TouchableOpacity
            onPress={() => handleToggleMute(item)}
            style={[styles.actionButton, { backgroundColor: muted ? colors.error + '20' : colors.secondary + '20' }]}
          >
            <Typography variant="bodySmall" style={{ color: muted ? colors.error : colors.secondary }}>
              {muted ? '🔇 Aç' : '🔕 Sessize Al'}
            </Typography>
          </TouchableOpacity>
          
          {/* Yöneticilik Devri (sadece owner, kendisi hariç) */}
          {isOwner && !isCurrentUser && !isMemberOwner && (
            <TouchableOpacity
              onPress={() => {
                setSelectedMember(item);
                setTransferOwnerModalVisible(true);
              }}
              style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
            >
              <Typography variant="bodySmall" style={{ color: colors.warning }}>
                👑 Yönetici Yap
              </Typography>
            </TouchableOpacity>
          )}
          
          {/* Üyeyi Çıkar (sadece owner veya kendisi) */}
          {(isOwner || isCurrentUser) && (
            <TouchableOpacity
              onPress={() => handleRemoveMember(item)}
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            >
              <Typography variant="bodySmall" style={{ color: colors.error }}>
                {isCurrentUser ? '🚪 Ayrıl' : '❌ Çıkar'}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: <Typography variant="h5" color={colors.text}>Üyeleri Yönet</Typography>,
        backgroundColor: colors.background,
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Typography variant="body" style={styles.emptyText}>
                Grupta üye yok
              </Typography>
            </View>
          }
        />
      
      {/* Nickname Modal */}
      <Modal
        visible={nicknameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNicknameModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNicknameModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                <Typography variant="h6" style={styles.modalTitle}>
              Takma Ad {selectedMember?.user?.display_name ? `(${selectedMember.user.display_name})` : ''}
            </Typography>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.stroke 
              }]}
              placeholder="Takma ad girin (boş bırakırsanız silinir)"
              placeholderTextColor={colors.secondaryText}
              value={nicknameText}
              onChangeText={setNicknameText}
              maxLength={50}
            />
            
            <View style={styles.modalActions}>
              <GeliomButton
                state="passive"
                size="medium"
                onPress={() => {
                  setNicknameModalVisible(false);
                  setNicknameText('');
                  setSelectedMember(null);
                }}
                style={styles.modalButton}
              >
                İptal
              </GeliomButton>
              <GeliomButton
                state={upsertNickname.isPending || deleteNickname.isPending ? 'loading' : 'active'}
                size="medium"
                onPress={handleSaveNickname}
                style={styles.modalButton}
              >
                Kaydet
              </GeliomButton>
            </View>
          </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
      
      {/* Transfer Ownership Modal */}
      <Modal
        visible={transferOwnerModalVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setTransferOwnerModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTransferOwnerModalVisible(false)}
        >
          <Pressable onPress={(e: GestureResponderEvent) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <Typography variant="h6" style={styles.modalTitle}>
              Yöneticilik Devri
            </Typography>
            
            <Typography variant="body" style={[styles.modalText, { color: colors.text }]}>
              {selectedMember?.user?.display_name || selectedMember?.user?.custom_user_id} kullanıcısına yöneticiliği devretmek istediğinize emin misiniz?
            </Typography>
            
            <View style={styles.modalActions}>
              <GeliomButton
                state="passive"
                size="medium"
                onPress={() => {
                  setTransferOwnerModalVisible(false);
                  setSelectedMember(null);
                }}
                style={styles.modalButton}
              >
                İptal
              </GeliomButton>
              <GeliomButton
                state={transferOwnership.isPending ? 'loading' : 'active'}
                size="medium"
                onPress={() => selectedMember && handleTransferOwnership(selectedMember)}
                style={styles.modalButton}
              >
                Devret
              </GeliomButton>
            </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        visible={avatarSelectorVisible}
        currentAvatar={user?.avatar}
        onSelect={handleAvatarSelect}
        onClose={() => setAvatarSelectorVisible(false)}
      />
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  memberCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    marginBottom: 2,
  },
  memberSubtext: {
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

