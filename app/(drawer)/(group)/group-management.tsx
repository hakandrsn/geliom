import { useGroupJoinRequests, useGroupJoinRequestsRealtime, useUpdateGroup } from '@/api/groups';
import { useCreateMood } from '@/api/moods';
import { useCreateStatus } from '@/api/statuses';
import {
  GroupNameBottomSheet,
  StatusMoodBottomSheet,
} from '@/components/bottomsheets';
import { BaseLayout, GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function GroupManagementScreen() {
  const { user } = useAuth();
  const { selectedGroup } = useGroupContext();
  const { colors } = useTheme();
  const router = useRouter();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const [isCopying, setIsCopying] = useState(false);

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

  const handleUpdateGroupName = () => {
    if (!isOwner) return;
    
    openBottomSheet(
      <GroupNameBottomSheet
        currentName={selectedGroup.name}
        onSave={async (name) => {
          try {
            await updateGroup.mutateAsync({
              id: selectedGroup.id,
              updates: { name: name.trim() },
            });
            closeBottomSheet();
            Alert.alert('Başarılı', 'Grup adı güncellendi');
          } catch (error: any) {
            console.error('Grup adı güncelleme hatası:', error);
            Alert.alert('Hata', error.message || 'Grup adı güncellenemedi');
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ['35%'] }
    );
  };

  const handleCreateStatus = () => {
    if (!isOwner || !user?.id || !selectedGroup?.id) return;
    
    openBottomSheet(
      <StatusMoodBottomSheet
        type="status"
        onSave={async (text, emoji, notifies) => {
          try {
            await createStatus.mutateAsync({
              text: text.trim(),
              notifies: notifies || false,
              is_custom: true,
              owner_id: user.id,
              group_id: selectedGroup.id,
              emoji: emoji || undefined,
              messages: undefined,
            });
            closeBottomSheet();
            Alert.alert('Başarılı', 'Özel durum oluşturuldu');
          } catch (error: any) {
            console.error('Status oluşturma hatası:', error);
            const errorMessage = error?.message || error?.code || 'Durum oluşturulamadı';
            Alert.alert('Hata', errorMessage);
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ['55%'] }
    );
  };

  const handleCreateMood = () => {
    if (!isOwner || !user?.id || !selectedGroup?.id) return;
    
    openBottomSheet(
      <StatusMoodBottomSheet
        type="mood"
        onSave={async (text, emoji) => {
          try {
            await createMood.mutateAsync({
              text: text.trim(),
              emoji: emoji || undefined,
              group_id: selectedGroup.id,
            });
            closeBottomSheet();
            Alert.alert('Başarılı', 'Özel mood oluşturuldu');
          } catch (error: any) {
            console.error('Mood oluşturma hatası:', error);
            const errorMessage = error?.message || error?.code || 'Mood oluşturulamadı';
            Alert.alert('Hata', errorMessage);
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ['50%'] }
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
              onPress={handleUpdateGroupName}
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
              onPress={handleCreateStatus}
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
              onPress={handleCreateMood}
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

            {/* Status ve Mood Sırala */}
            <TouchableOpacity
              onPress={() => router.push('/(drawer)/(group)/reorder-status-mood')}
              style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}
            >
              <View style={styles.settingItemContent}>
                <Ionicons name="reorder-three-outline" size={20} color={colors.primary} />
                <View style={styles.settingItemText}>
                  <Typography variant="body" color={colors.text}>
                    Status ve Mood Sırala
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    Status ve mood sıralamasını düzenle
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
    paddingHorizontal: 12,
  },
  contentContainer: {
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
});
