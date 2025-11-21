import { useMoods, useSetUserGroupMood } from '@/api/moods';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMoodOrder } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

interface MoodSelectorProps {
  groupId?: string;
  currentMoodId?: number;
}

function MoodSelector({ groupId, currentMoodId }: MoodSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Tüm mood'ları çek (default + custom, seçili grup için)
  const { data: allMoods = [], isLoading } = useMoods(groupId);
  
  // Mood güncelleme mutasyonu
  const setMoodMutation = useSetUserGroupMood();
  
  // Local storage'dan sıralamayı al
  const [moodOrder, setMoodOrder] = useState<number[]>([]);
  
  // Ekran focus olduğunda sıralamayı yeniden yükle
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getMoodOrder(user.id).then(setMoodOrder);
      }
    }, [user?.id])
  );
  
  // Mood'ları sırala (tüm mood'lar - custom + default)
  const sortedMoods = useMemo(() => {
    if (moodOrder.length === 0) {
      // Sıralama yoksa: Custom'lar önce, sonra default'lar
      const customMoods = allMoods.filter(m => m.group_id != null);
      const defaultMoods = allMoods.filter(m => m.group_id == null);
      return [...customMoods, ...defaultMoods];
    }
    
    // Sıralamaya göre tüm mood'ları düzenle (custom + default)
    const ordered: typeof allMoods = [];
    const unordered: typeof allMoods = [];
    
    // Sıralamaya göre tüm mood'ları ekle (custom + default)
    moodOrder.forEach((moodId) => {
      const mood = allMoods.find(m => m.id === moodId);
      if (mood) {
        ordered.push(mood);
      }
    });
    
    // Sıralamada olmayan mood'ları sona ekle
    allMoods.forEach((mood) => {
      if (!moodOrder.includes(mood.id) && !ordered.find(m => m.id === mood.id)) {
        unordered.push(mood);
      }
    });
    
    return [...ordered, ...unordered];
  }, [allMoods, moodOrder]);

  const handleMoodPress = useCallback(async (moodId: number) => {
    if (!user) return;

    try {
      await setMoodMutation.mutateAsync({
        user_id: user.id,
        mood_id: moodId,
        group_id: groupId || undefined, // Grup varsa gruba özel, yoksa global
      });
    } catch (error) {
      console.error("Mood update failed", error);
    }
  }, [user, groupId, setMoodMutation]);

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <Typography variant="h6" color={colors.text} style={styles.title}>
        Nasıl hissediyorsun? 🌿
      </Typography>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedMoods.map((mood) => {
          const isActive = currentMoodId === mood.id;

          return (
            <GeliomButton
              key={mood.id}
              state={isActive ? 'active' : 'passive'}
              size="small"
              layout="icon-left"
              onPress={() => handleMoodPress(mood.id)}
              disabled={setMoodMutation.isPending}
              style={styles.button}
            >
              {mood.emoji && <Typography variant="h6" style={{ marginRight: 4 }}>{mood.emoji}</Typography>}
              {mood.text}
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
  }
});

export default React.memo(MoodSelector);

