import { useMoods, useSetUserGroupMood } from '@/api/moods';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

interface MoodSelectorProps {
  groupId?: string;
  currentMoodId?: number;
}

function MoodSelector({ groupId, currentMoodId }: MoodSelectorProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Varsayılan mood'ları çek
  const { data: moods, isLoading } = useMoods();
  
  // Mood güncelleme mutasyonu
  const setMoodMutation = useSetUserGroupMood();

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
        {moods?.map((mood) => {
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

