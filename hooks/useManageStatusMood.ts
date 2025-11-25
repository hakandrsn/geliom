import { useCreateMood, useDeleteMood } from '@/api/moods';
import { useCreateStatus, useDeleteStatus } from '@/api/statuses';
import { useAuth } from '@/contexts/AuthContext';
import { usePay } from '@/contexts/PayContext';
import { Alert } from 'react-native';

export function useManageStatusMood(groupId: string) {
  const { user } = useAuth();

  // Mutations
  const createStatus = useCreateStatus();
  const deleteStatus = useDeleteStatus();
  const createMood = useCreateMood();
  const deleteMood = useDeleteMood();

  const { isSubscribed, showPaywall } = usePay();

  const handleAddStatus = async (text: string, emoji?: string) => {
    if (!user) return;
    try {
      await createStatus.mutateAsync({
        text,
        emoji,
        owner_id: user.id,
        group_id: groupId,
        is_custom: true,
        notifies: false,
      });
    } catch (error) {
      console.error('Status ekleme hatası:', error);
      Alert.alert('Hata', 'Status eklenirken bir hata oluştu.');
    }
  };

  const handleAddMood = async (text: string, emoji: string) => {
    if (!user) return;

    if (!isSubscribed) {
      showPaywall({
        onSuccess: async () => {
          // Abone olduktan sonra işlemi tekrar dene
          try {
            await createMood.mutateAsync({
              text,
              emoji,
              group_id: groupId,
            });
          } catch (error) {
            console.error('Mood ekleme hatası (paywall sonrası):', error);
            Alert.alert('Hata', 'Mood eklenirken bir hata oluştu.');
          }
        }
      });
      return;
    }

    try {
      await createMood.mutateAsync({
        text,
        emoji,
        group_id: groupId,
      });
    } catch (error) {
      console.error('Mood ekleme hatası:', error);
      Alert.alert('Hata', 'Mood eklenirken bir hata oluştu.');
    }
  };

  const handleDeleteStatus = (id: number) => {
    Alert.alert(
      'Status Sil',
      'Bu statusu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStatus.mutateAsync(id);
            } catch (error) {
              console.error('Status silme hatası:', error);
              Alert.alert('Hata', 'Status silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMood = (id: number) => {
    Alert.alert(
      'Mood Sil',
      'Bu moodu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMood.mutateAsync(id);
            } catch (error) {
              console.error('Mood silme hatası:', error);
              Alert.alert('Hata', 'Mood silinirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const checkSubscriptionAndProceed = (onProceed: () => void) => {
    if (isSubscribed) {
      onProceed();
    } else {
      showPaywall({
        onSuccess: () => {
          onProceed();
        }
      });
    }
  };

  return {
    handleAddStatus,
    handleAddMood,
    handleDeleteStatus,
    handleDeleteMood,
    checkSubscriptionAndProceed,
    isCreatingStatus: createStatus.isPending,
    isCreatingMood: createMood.isPending,
  };
}
