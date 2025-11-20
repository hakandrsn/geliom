import { useIsSubscriptionActive } from '@/api/subscriptions';
import { useDefaultStatuses, useSetUserStatus } from '@/api/statuses';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // İkon tipleri için
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface StatusSelectorProps {
  groupId?: string;
  currentStatusId?: number;
}

function StatusSelector({ groupId, currentStatusId }: StatusSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  // Varsayılan durumları çek (Müsaitim, Meşgulüm vb.)
  const { data: statuses, isLoading } = useDefaultStatuses();
  
  // Premium kontrolü
  const { data: isPremium = false } = useIsSubscriptionActive(user?.id || '');
  
  // Durum güncelleme mutasyonu
  const setStatusMutation = useSetUserStatus();

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
        {statuses?.map((status) => {
          const isActive = currentStatusId === status.id;
          const iconName = getIconName(status.text);

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
              {status.text}
            </GeliomButton>
          );
        })}
        
        {/* Custom Status Ekleme Butonu (Premium) */}
        {isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/(drawer)/(group)/create-status')}
            style={[styles.addButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          >
            <Ionicons name="add-circle" size={18} color={colors.primary} />
            <Typography variant="bodySmall" color={colors.primary} style={{ marginLeft: 4 }}>
              Özel Durum
            </Typography>
          </TouchableOpacity>
        )}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    marginLeft: 8,
  },
});

export default React.memo(StatusSelector);