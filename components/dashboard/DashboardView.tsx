import { useGroupMembers } from '@/api/groups';
import { useGroupUserMoods, useUserGroupMood } from '@/api/moods';
import { useGroupUserStatuses, useUserStatus } from '@/api/statuses';
import MemberCard from '@/components/dashboard/MemberCard';
import MoodSelector from '@/components/dashboard/MoodSelector';
import StatusSelector from '@/components/dashboard/StatusSelector';
import { Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupWithOwner } from '@/types/database';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

interface DashboardViewProps {
  group: GroupWithOwner;
}

export default function DashboardView({ group }: DashboardViewProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Verileri çek (React Query hooks)
  const { data: members, isLoading: membersLoading } = useGroupMembers(group.id);
  const { data: groupStatuses } = useGroupUserStatuses(group.id);
  const { data: groupMoods } = useGroupUserMoods(group.id);
  
  // Benim şu anki statusum (StatusSelector için)
  const { data: myStatus } = useUserStatus(user?.id || '', group.id);
  // Benim şu anki mood'um (MoodSelector için)
  const { data: myMood } = useUserGroupMood(user?.id || '', group.id);

  if (membersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // FlatList'in Header'ı: Durum ve mood seçici
  const DashboardHeader = () => (
    <View style={styles.headerContainer}>
      {/* Status Selector - Benim Durumum */}
      <StatusSelector 
        groupId={group.id} 
        currentStatusId={myStatus?.status_id}
      />

      {/* Mood Selector - Benim Mood'um */}
      <MoodSelector 
        groupId={group.id} 
        currentMoodId={myMood?.mood_id}
      />

      <Typography variant="h5" color={colors.text} style={styles.sectionTitle}>
        Grup Üyeleri ({members?.length || 0})
      </Typography>
    </View>
  );

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.user_id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={DashboardHeader}
      renderItem={({ item }) => {
        // Bu üyenin statusunu ve moodunu bul
        const memberStatus = groupStatuses?.find(s => s.user_id === item.user_id);
        const memberMood = groupMoods?.find(m => m.user_id === item.user_id);
        const isMe = item.user_id === user?.id;

        return (
          <MemberCard 
            member={item}
            status={memberStatus}
            mood={memberMood}
            isMe={isMe}
          />
        );
      }}
      ListEmptyComponent={
        <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center', marginTop: 20 }}>
          Bu grupta henüz kimse yok.
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 12,
    marginTop: 0,
  },
  sectionTitle: {
    marginVertical: 12,
    marginLeft: 4,
  },
});