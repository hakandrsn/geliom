import { useGroupMembers } from '@/api/groups';
import { useGroupUserMoods, useUserGroupMood } from '@/api/moods';
import { useGroupNicknames } from '@/api/nicknames';
import { useGroupUserStatuses, useUserStatus } from '@/api/statuses';
import CurrentUserHeader from '@/components/dashboard/CurrentUserHeader';
import MemberCard from '@/components/dashboard/MemberCard';
import MoodSelector from '@/components/dashboard/MoodSelector';
import StatusSelector from '@/components/dashboard/StatusSelector';
import { GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser, GroupWithOwner, UserGroupMoodWithMood, UserStatusWithStatus } from '@/types/database';
import { groupTypeSelector } from '@/utils/group-type-selector';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardViewProps {
  group: GroupWithOwner;
}

function DashboardView({ group }: DashboardViewProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Verileri çek (React Query hooks)
  const { data: allMembers, isLoading: membersLoading } = useGroupMembers(group.id);
  const { data: groupStatuses } = useGroupUserStatuses(group.id);
  const { data: groupMoods } = useGroupUserMoods(group.id);
  const { data: nicknames = [] } = useGroupNicknames(group.id);

  // Benim şu anki statusum (StatusSelector için)
  const { data: myStatus } = useUserStatus(user?.id || '', group.id);
  // Benim şu anki mood'um (MoodSelector için)
  const { data: myMood } = useUserGroupMood(user?.id || '', group.id);

  // Üyeleri ayır: Ben ve Diğerleri - memoize edildi
  const myMemberInfo = useMemo(
    () => allMembers?.find(m => m.user_id === user?.id),
    [allMembers, user?.id]
  );
  
  const otherMembers = useMemo(
    () => allMembers?.filter(m => m.user_id !== user?.id) || [],
    [allMembers, user?.id]
  );

  // Her member için nickname'i bul - memoize edildi
  const getNicknameForMember = useCallback((targetUserId: string): string | undefined => {
    if (!user?.id) return undefined;
    const nickname = nicknames.find(
      n => n.setter_user_id === user.id && n.target_user_id === targetUserId
    );
    return nickname?.nickname;
  }, [user?.id, nicknames]);
  // FlatList Header: Stacked Layout Components - memoize edildi
  const DashboardHeader = useCallback(() => (
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
          {groupTypeSelector(group.type)} ({otherMembers.length})
        </Typography>
      </View>
    </View>
  ), [myMemberInfo, myStatus, myMood, group, colors.text, otherMembers.length]);

  const statusMap = useMemo(() => {
    const map: Record<string, UserStatusWithStatus> = {};
    groupStatuses?.forEach(s => map[s.user_id] = s);
    return map;
  }, [groupStatuses]);

  const moodMap = useMemo(() => {
    const map: Record<string, UserGroupMoodWithMood> = {};
    groupMoods?.forEach(m => map[m.user_id] = m);
    return map;
  }, [groupMoods]);

  const handleMemberPress = useCallback((member: GroupMemberWithUser) => {
    router.push({
      pathname: '/(drawer)/(group)/edit-member',
      params: {
        memberData: JSON.stringify(member),
      },
    });
  }, [router]);

  const handleShareInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `${group.name} grubuna katıl!\n\nDavet Kodu: ${group.invite_code}\n\nUygulamayı indir ve bu kodu kullanarak gruba katıl.`,
        title: `${group.name} - Grup Daveti`,
      });
    } catch (error) {
      console.error('Davet paylaşılırken hata oluştu:', error);
    }
  }, [group.name, group.invite_code]);

  const renderItem = useCallback(({ item }: { item: GroupMemberWithUser }) => {
    const memberStatus = statusMap[item.user_id]; // O(1) - Anında erişim
    const memberMood = moodMap[item.user_id];     // O(1) - Anında erişim
    const nickname = getNicknameForMember(item.user_id);

    return (
      <View style={styles.paddedSection}>
        <MemberCard
          member={item}
          status={memberStatus}
          mood={memberMood}
          isMe={false}
          nickname={nickname}
          onPress={() => handleMemberPress(item)}
        />
      </View>
    );
  }, [statusMap, moodMap, getNicknameForMember, handleMemberPress]);

  // Loading state - tüm hooks'lardan sonra kontrol ediyoruz
  if (membersLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <FlatList
        data={otherMembers}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListHeaderComponent={DashboardHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Typography variant="body" color={colors.secondaryText} style={styles.emptyStateText}>
              Bu grupta başka kimse yok.
            </Typography>
            <GeliomButton
              state="active"
              size="medium"
              layout="full-width"
              icon="share-social"
              onPress={handleShareInvite}
              style={styles.inviteButton}
            >
              Davet Et
            </GeliomButton>
          </View>
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
    marginBottom: 8,
  },
  paddedSection: {
    paddingHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 4,
    marginLeft: 4,
    marginTop: 20,
  },
  emptyStateContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  inviteButton: {
    maxWidth: 300,
  },
});

// React.memo ile sarmalayıp shallow comparison yapıyoruz
export default React.memo(DashboardView);