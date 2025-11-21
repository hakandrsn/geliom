import { useCustomStatuses, useDefaultStatuses, useSetUserStatus } from '@/api/statuses';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getStatusOrder } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons'; // İkon tipleri için
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

interface StatusSelectorProps {
  groupId?: string;
  currentStatusId?: number;
}

function StatusSelector({ groupId, currentStatusId }: StatusSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Varsayılan durumları çek (Müsaitim, Meşgulüm vb.)
  const { data: defaultStatuses = [], isLoading: isLoadingDefault } = useDefaultStatuses();
  
  // Custom durumları çek (seçili grup için)
  const { data: customStatuses = [], isLoading: isLoadingCustom } = useCustomStatuses(
    groupId || '',
    user?.id
  );
  
  // Durum güncelleme mutasyonu
  const setStatusMutation = useSetUserStatus();
  
  // Local storage'dan sıralamayı al
  const [statusOrder, setStatusOrder] = useState<number[]>([]);
  
  // Ekran focus olduğunda sıralamayı yeniden yükle
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getStatusOrder(user.id).then(setStatusOrder);
      }
    }, [user?.id])
  );
  
  // Status'leri birleştir ve sırala (tüm status'ler - custom + default)
  const sortedStatuses = useMemo(() => {
    const allStatuses = [...customStatuses, ...defaultStatuses];
    
    if (statusOrder.length === 0) {
      // Sıralama yoksa: Custom'lar önce, sonra default'lar
      return allStatuses;
    }
    
    // Sıralamaya göre tüm status'leri düzenle (custom + default)
    const ordered: typeof allStatuses = [];
    const unordered: typeof allStatuses = [];
    
    // Sıralamaya göre tüm status'leri ekle (custom + default)
    statusOrder.forEach((statusId) => {
      const status = allStatuses.find(s => s.id === statusId);
      if (status) {
        ordered.push(status);
      }
    });
    
    // Sıralamada olmayan status'leri sona ekle
    allStatuses.forEach((status) => {
      if (!statusOrder.includes(status.id) && !ordered.find(s => s.id === status.id)) {
        unordered.push(status);
      }
    });
    
    return [...ordered, ...unordered];
  }, [customStatuses, defaultStatuses, statusOrder]);
  
  const isLoading = isLoadingDefault || isLoadingCustom;

  const handleStatusPress = useCallback(async (statusId: number) => {
    if (!user) return;

    try {
      await setStatusMutation.mutateAsync({
        user_id: user.id,
        status_id: statusId,
        group_id: groupId || undefined, // Grup varsa gruba özel, yoksa global
      });
    } catch (error) {
      console.error("Status update failed", error);
    }
  }, [user, groupId, setStatusMutation]);

  const getIconName = useCallback((statusText: string): keyof typeof Ionicons.glyphMap => {
    if (statusText.includes('Müsait')) return 'checkmark-circle';
    if (statusText.includes('Meşgul')) return 'close-circle';
    if (statusText.includes('Dışarı')) return 'walk';
    if (statusText.includes('Ev')) return 'home';
    if (statusText.includes('Çalış')) return 'laptop';
    return 'radio-button-on';
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <Typography variant="h6" color={colors.text} style={styles.title}>
        Ne yapıyorsun? 🌿
      </Typography>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedStatuses.map((status) => {
          const isActive = currentStatusId === status.id;
          const iconName = getIconName(status.text);
          const isCustom = status.is_custom;

          return (
            <GeliomButton
              key={status.id}
              state={isActive ? 'active' : 'passive'}
              size="small"
              layout="icon-left"
              icon={iconName}
              onPress={() => handleStatusPress(status.id)}
              disabled={setStatusMutation.isPending}
              style={styles.button}
            >
              {status.emoji ? `${status.emoji} ${status.text}` : status.text}
            </GeliomButton>
          );
        })}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 20,
  },
  button: {
    marginRight: 0,
  },
});

export default React.memo(StatusSelector);