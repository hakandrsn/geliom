import { useGroupJoinRequests, useGroupJoinRequestsRealtime, useUpdateGroup } from '@/api/groups';
import { useCreateMood } from '@/api/moods';
import { useCreateStatus } from '@/api/statuses';
import { BaseLayout, GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function GroupManagementScreen() {
  const { user } = useAuth();
  const { selectedGroup } = useGroupContext();
  const { colors } = useTheme();
  const router = useRouter();

  const [isCopying, setIsCopying] = useState(false);
  const [groupNameModalVisible, setGroupNameModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [newMoodText, setNewMoodText] = useState('');
  const [newMoodEmoji, setNewMoodEmoji] = useState('');

  const updateGroup = useUpdateGroup();
  const createStatus = useCreateStatus();
  const createMood = useCreateMood();

  const isOwner = selectedGroup?.owner_id === user?.id;
  
  // Katılma isteklerini çek (sadece owner için)
  const { data: joinRequests = [] } = useGroupJoinRequests(selectedGroup?.id || '', 'pending');
  const pendingRequestsCount = joinRequests.length;
  
  // Realtime subscription
  useGroupJoinRequestsRealtime(selectedGroup?.id || '');

  const handleJoinRequestsPress = () => {
    if (selectedGroup) {
      router.push('/(drawer)/(group)/join-requests');
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
          title: <Typography variant="h5" color={colors.text}>Grup Yönetimi</Typography>,
          backgroundColor: colors.background,
          style: { borderBottomWidth: 0 },
        }}
      >
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="people-outline" size={64} color={colors.secondaryText} />
          <Typography variant="h4" color={colors.text} style={{ marginTop: 16, marginBottom: 8 }}>
            Grup Seçilmedi
          </Typography>
          <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center' }}>
            Grup yönetimi için bir grup seçmelisiniz.
          </Typography>
        </View>
      </BaseLayout>
    );
  }

  const copyInviteCode = async () => {
    if (selectedGroup.invite_code) {
      await Clipboard.setStringAsync(selectedGroup.invite_code);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || !isOwner) return;
    
    // Validation: Max 20 karakter
    if (newGroupName.trim().length > 20) {
      Alert.alert('Hata', 'Grup adı en fazla 20 karakter olabilir');
      return;
    }
    
    try {
      await updateGroup.mutateAsync({
        id: selectedGroup.id,
        updates: { name: newGroupName.trim() },
      });
      setGroupNameModalVisible(false);
      setNewGroupName('');
      Alert.alert('Başarılı', 'Grup adı güncellendi');
    } catch (error: any) {
      console.error('Grup adı güncelleme hatası:', error);
      Alert.alert('Hata', error.message || 'Grup adı güncellenemedi');
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatusText.trim() || !isOwner || !user?.id) return;
    
    try {
      await createStatus.mutateAsync({
        text: newStatusText.trim(),
        notifies: false,
        is_custom: true,
        owner_id: user.id,
        messages: [],
      });
      setStatusModalVisible(false);
      setNewStatusText('');
      Alert.alert('Başarılı', 'Özel durum oluşturuldu');
    } catch (error: any) {
      console.error('Status oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Durum oluşturulamadı');
    }
  };

  const handleCreateMood = async () => {
    if (!newMoodText.trim() || !isOwner || !user?.id) return;
    
    try {
      await createMood.mutateAsync({
        text: newMoodText.trim(),
        emoji: newMoodEmoji.trim() || undefined,
      });
      setMoodModalVisible(false);
      setNewMoodText('');
      setNewMoodEmoji('');
      Alert.alert('Başarılı', 'Özel mood oluşturuldu');
    } catch (error: any) {
      console.error('Mood oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Mood oluşturulamadı');
    }
  };

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: <Typography variant="h5" color={colors.text}>Grup Yönetimi</Typography>,
        rightIcon: isOwner ? {
          icon: (
            <View style={styles.rightIconContainer}>
              <TouchableOpacity
                onPress={handleJoinRequestsPress}
                style={[styles.actionButton, { backgroundColor: colors.cardBackground + '80', borderColor: colors.stroke }]}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.text} />
                {pendingRequestsCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Typography variant="caption" color={colors.white} style={styles.badgeText}>
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ),
          onPress: handleJoinRequestsPress,
        } : undefined,
        backgroundColor: colors.background,
        style: { borderBottomWidth: 0 },
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Davet Kodu Kartı */}
        <View style={[styles.inviteCard, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
          <View style={styles.inviteCardHeader}>
            <Ionicons name="key-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography variant="h5" color={colors.text}>
                {selectedGroup.name} - Davet Kodu
              </Typography>
            </View>
          </View>
          <View style={styles.inviteCodeContainer}>
            <Typography variant="h3" color={colors.primary} style={styles.inviteCode}>
              {selectedGroup.invite_code}
            </Typography>
            <GeliomButton
              state={isCopying ? 'active' : 'passive'}
              size="small"
              icon={isCopying ? 'checkmark' : 'copy'}
              onPress={copyInviteCode}
            >
              {isCopying ? 'Kopyalandı' : 'Kopyala'}
            </GeliomButton>
          </View>
          <Typography variant="caption" color={colors.secondaryText} style={{ marginTop: 8 }}>
            Bu kodu paylaşarak kullanıcılar grubunuza katılma isteği gönderebilir
          </Typography>
        </View>

        {/* Grup Ayarları (Sadece Owner) */}
        {isOwner && (
          <View style={styles.settingsSection}>
            <Typography variant="h5" color={colors.text} style={styles.sectionTitle}>
              Grup Ayarları
            </Typography>
            
            {/* Grup Adı Değiştir */}
            <TouchableOpacity
              onPress={() => {
                setNewGroupName(selectedGroup.name);
                setGroupNameModalVisible(true);
              }}
              style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
            >
              <View style={styles.settingItemContent}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <View style={styles.settingItemText}>
                  <Typography variant="body" color={colors.text}>
                    Grup Adı
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    {selectedGroup.name}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Özel Durum Ekle */}
            <TouchableOpacity
              onPress={() => setStatusModalVisible(true)}
              style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
            >
              <View style={styles.settingItemContent}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <View style={styles.settingItemText}>
                  <Typography variant="body" color={colors.text}>
                    Özel Durum Ekle
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    Gruba özel durum oluştur
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Özel Mood Ekle */}
            <TouchableOpacity
              onPress={() => setMoodModalVisible(true)}
              style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
            >
              <View style={styles.settingItemContent}>
                <Ionicons name="happy-outline" size={20} color={colors.primary} />
                <View style={styles.settingItemText}>
                  <Typography variant="body" color={colors.text}>
                    Özel Mood Ekle
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    Gruba özel mood oluştur
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Yönetim Butonları */}
        <View style={styles.actionsContainer}>
          <Typography variant="h5" color={colors.text} style={styles.sectionTitle}>
            Üye Yönetimi
          </Typography>
          
          {/* Tüm Üyeler için */}
          <TouchableOpacity
            onPress={() => router.push('/(drawer)/(group)/manage-members')}
            style={[styles.memberButton, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
          >
            <View style={styles.memberButtonContent}>
              <Ionicons name="people-outline" size={24} color={colors.primary} />
              <View style={styles.memberButtonText}>
                <Typography variant="h5" color={colors.text}>
                  Üyeleri Yönet
                </Typography>
                <Typography variant="caption" color={colors.secondaryText}>
                  Üyeleri görüntüle, takma ad ver, sessize al
                </Typography>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Grup Adı Değiştir Modal */}
      <Modal
        visible={groupNameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGroupNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Typography variant="h5" color={colors.text} style={styles.modalTitle}>
              Grup Adını Değiştir
            </Typography>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.stroke 
              }]}
              placeholder="Grup adı (max 20 karakter)"
              placeholderTextColor={colors.secondaryText}
              value={newGroupName}
              onChangeText={setNewGroupName}
              maxLength={20}
            />
            <Typography variant="caption" color={colors.secondaryText} style={{ marginTop: 4, marginBottom: 8 }}>
              {newGroupName.length}/20 karakter
            </Typography>
            
            <View style={styles.modalActions}>
              <GeliomButton
                state="passive"
                size="medium"
                onPress={() => {
                  setGroupNameModalVisible(false);
                  setNewGroupName('');
                }}
                style={styles.modalButton}
              >
                İptal
              </GeliomButton>
              <GeliomButton
                state={updateGroup.isPending ? 'loading' : 'active'}
                size="medium"
                onPress={handleUpdateGroupName}
                style={styles.modalButton}
                disabled={!newGroupName.trim()}
              >
                Kaydet
              </GeliomButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Özel Durum Ekle Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Typography variant="h5" color={colors.text} style={styles.modalTitle}>
              Özel Durum Ekle
            </Typography>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.stroke 
              }]}
              placeholder="Durum metni (örn: Toplantıdayım)"
              placeholderTextColor={colors.secondaryText}
              value={newStatusText}
              onChangeText={setNewStatusText}
              maxLength={50}
            />
            
            <View style={styles.modalActions}>
              <GeliomButton
                state="passive"
                size="medium"
                onPress={() => {
                  setStatusModalVisible(false);
                  setNewStatusText('');
                }}
                style={styles.modalButton}
              >
                İptal
              </GeliomButton>
              <GeliomButton
                state={createStatus.isPending ? 'loading' : 'active'}
                size="medium"
                onPress={handleCreateStatus}
                style={styles.modalButton}
                disabled={!newStatusText.trim()}
              >
                Oluştur
              </GeliomButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Özel Mood Ekle Modal */}
      <Modal
        visible={moodModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Typography variant="h5" color={colors.text} style={styles.modalTitle}>
              Özel Mood Ekle
            </Typography>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.stroke 
              }]}
              placeholder="Mood metni (örn: Heyecanlı)"
              placeholderTextColor={colors.secondaryText}
              value={newMoodText}
              onChangeText={setNewMoodText}
              maxLength={50}
            />
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.stroke 
              }]}
              placeholder="Emoji (opsiyonel, örn: 🎉)"
              placeholderTextColor={colors.secondaryText}
              value={newMoodEmoji}
              onChangeText={setNewMoodEmoji}
              maxLength={2}
            />
            
            <View style={styles.modalActions}>
              <GeliomButton
                state="passive"
                size="medium"
                onPress={() => {
                  setMoodModalVisible(false);
                  setNewMoodText('');
                  setNewMoodEmoji('');
                }}
                style={styles.modalButton}
              >
                İptal
              </GeliomButton>
              <GeliomButton
                state={createMood.isPending ? 'loading' : 'active'}
                size="medium"
                onPress={handleCreateMood}
                style={styles.modalButton}
                disabled={!newMoodText.trim()}
              >
                Oluştur
              </GeliomButton>
            </View>
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  rightIconContainer: {
    position: 'relative',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  inviteCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 24,
  },
  inviteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inviteCode: {
    letterSpacing: 2,
    fontFamily: 'Comfortaa-Bold',
  },
  actionsContainer: {
    gap: 12,
  },
  memberButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  memberButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    flex: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});

