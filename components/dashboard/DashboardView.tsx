import { useGroupMembers } from '@/api/groups';
import { useGroupUserMoods, useUserGroupMood } from '@/api/moods';
import { useGroupNicknames } from '@/api/nicknames';
import { useGroupUserStatuses, useUserStatus } from '@/api/statuses';
import CurrentUserHeader from '@/components/dashboard/CurrentUserHeader';
import MemberCard from '@/components/dashboard/MemberCard';
import MoodSelector from '@/components/dashboard/MoodSelector';
import StatusSelector from '@/components/dashboard/StatusSelector';
import { Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupWithOwner } from '@/types/database';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardViewProps {
  group: GroupWithOwner;
}

export default function DashboardView({ group }: DashboardViewProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Verileri çek (React Query hooks)
  const { data: allMembers, isLoading: membersLoading } = useGroupMembers(group.id);
  const { data: groupStatuses } = useGroupUserStatuses(group.id);
  const { data: groupMoods } = useGroupUserMoods(group.id);
  const { data: nicknames = [] } = useGroupNicknames(group.id);

  // Benim şu anki statusum (StatusSelector için)
  const { data: myStatus } = useUserStatus(user?.id || '', group.id);
  // Benim şu anki mood'um (MoodSelector için)
  const { data: myMood } = useUserGroupMood(user?.id || '', group.id);

  // Her member için nickname'i bul (setter: current user, target: member user)
  const getNicknameForMember = (targetUserId: string): string | undefined => {
    if (!user?.id) return undefined;
    const nickname = nicknames.find(
      n => n.setter_user_id === user.id && n.target_user_id === targetUserId
    );
    return nickname?.nickname;
  };

  if (membersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Üyeleri ayır: Ben ve Diğerleri
  const myMemberInfo = allMembers?.find(m => m.user_id === user?.id);
  const otherMembers = allMembers?.filter(m => m.user_id !== user?.id) || [];

  // FlatList Header: Stacked Layout Components
  const DashboardHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Current User Header */}
      {myMemberInfo && (
        <View style={styles.paddedSection}>
          <CurrentUserHeader
            member={myMemberInfo}
            status={myStatus || undefined}
            mood={myMood || undefined}
          />
        </View>
      )}

      {/* 2. Status Selector - Edge to Edge */}
      <StatusSelector
        groupId={group.id}
        currentStatusId={myStatus?.status_id}
        onAddPress={() => console.log('Add Status Pressed')}
      />

      {/* 3. Mood Selector - Edge to Edge */}
      <MoodSelector
        groupId={group.id}
        currentMoodId={myMood?.mood_id}
        onAddPress={() => console.log('Add Mood Pressed')}
      />

      {/* 4. Section Title for Other Members */}
      <View style={styles.paddedSection}>
        <Typography variant="h5" color={colors.text} style={styles.sectionTitle}>
          Diğer Üyeler ({otherMembers.length})
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={[styles.container]}>
      <FlatList
        data={otherMembers}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListHeaderComponent={DashboardHeader}
        renderItem={({ item }) => {
          const memberStatus = groupStatuses?.find(s => s.user_id === item.user_id);
          const memberMood = groupMoods?.find(m => m.user_id === item.user_id);
          const nickname = getNicknameForMember(item.user_id);

          return (
            <View style={styles.paddedSection}>
              <MemberCard
                member={item}
                status={memberStatus}
                mood={memberMood}
                isMe={false}
                nickname={nickname}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <Typography variant="body" color={colors.secondaryText} style={{ textAlign: 'center', marginTop: 20 }}>
            Bu grupta başka kimse yok.
          </Typography>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 0, // Removed global padding
    paddingTop: 0,
  },
  headerContainer: {
    marginBottom: 16,
  },
  paddedSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
});