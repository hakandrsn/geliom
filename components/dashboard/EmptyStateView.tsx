import { GeliomButton, Typography } from '@/components/shared';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function EmptyStateView() {
  const { colors } = useTheme();
  const router = useRouter();
  const { refetchGroups } = useGroupContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchGroups();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Gruplar yenilenirken hata oluştu:', errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.tertiary + '30' }]}>
        <Ionicons name="people-outline" size={64} color={colors.primary} />
      </View>
      
      <Typography variant="h3" color={colors.text} style={styles.title}>
        Hoş Geldin!
      </Typography>
      
      <Typography variant="body" color={colors.secondaryText} style={styles.description}>
        Henüz bir grubun seçili değil veya bir gruba üye değilsin. 
        Arkadaşlarınla ve ailenle bağlantıda kalmak için bir grup oluştur veya katıl.
      </Typography>

      <View style={styles.actions}>
        <GeliomButton
          state="active"
          size="large"
          layout="full-width"
          icon="refresh"
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Kontrol Ediliyor...' : 'Gruplarımı Kontrol Et'}
        </GeliomButton>

        <GeliomButton
          state="active"
          size="large"
          layout="full-width"
          icon="add-circle"
          onPress={() => router.push('/(drawer)/(group)/create-group')}
        >
          Yeni Grup Oluştur
        </GeliomButton>
        
        <GeliomButton
          state="active"
          size="large"
          layout="full-width"
          icon="people"
          onPress={() => router.push('/(drawer)/(group)/join-group')}
        >
          Gruba Katıl
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
});