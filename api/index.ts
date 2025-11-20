// Supabase client
export { supabase } from './supabase';

// Types
export * from '../types/database';

// Users API
export {
  // Mutations
  useCreateUser, useCurrentUser, useDeleteUser,
  // Query Keys
  userKeys, useUpdateUser, useUser, useUserByCustomId,
  // Queries
  useUsers,
  // Realtime
  useUsersRealtime
} from './users';

// Moods API
export {
  // Query Keys
  moodKeys,
  // Mutations
  useCreateMood, useDeleteMood, useMood,
  useMoodByText,
  // Queries
  useMoods,
  // Realtime
  useMoodsRealtime, useUpdateMood
} from './moods';

// Groups API
export {
  // Query Keys
  groupKeys, useApproveJoinRequest,
  // Mutations
  useCreateGroup,
  // Join Requests
  useCreateJoinRequest, useDeleteGroup, useGroup,
  useGroupByInviteCode, useGroupJoinRequests,
  // Join Requests Realtime
  useGroupJoinRequestsRealtime, useGroupMembers, useGroupMembersRealtime,
  // Queries
  useGroups,
  // Realtime
  useGroupsRealtime, useIsGroupMember, useJoinGroup,
  useLeaveGroup, useMyJoinRequests, useMyJoinRequestsRealtime, useRejectJoinRequest, useTransferGroupOwnership, useUpdateGroup, useUserGroups
} from './groups';

// Nicknames API
export {
  // Query Keys
  nicknameKeys,
  // Mutations
  useCreateNickname, useDeleteNickname,
  // Queries
  useGroupNicknames, useNickname,
  // Realtime
  useNicknamesRealtime, useUpdateNickname, useUpsertNickname, useUserNicknames,
  useUserSetNicknames
} from './nicknames';

// Statuses API
export {
  // Query Keys
  statusKeys,
  // Mutations
  useCreateStatus, useCustomStatuses, useDefaultStatuses, useDeleteStatus, useRemoveUserStatus, userStatusKeys, useSetUserStatus, useStatus,
  // Queries
  useStatuses,
  // Realtime
  useStatusesRealtime, useUpdateStatus, useUserStatus, useUserStatusesRealtime, useUsersWithStatuses
} from './statuses';

// Notifications API (Bildirim gönderme fonksiyonları)
export {
  sendEventReminderNotification, sendJoinRequestNotification,
  sendJoinRequestStatusNotification, sendMoodUpdateNotification, sendNotification, sendStatusUpdateNotification
} from './notifications';

// Muted Notifications API
export {
  mutedKeys,
  useIsMuted as useIsUserMuted,
  useMutedNotifications as useMutedNotificationsList,
  useMuteUser,
  useToggleMuteUser,
  useUnmuteUser
} from './muted';

// Subscriptions API
export {
  // Query Keys
  subscriptionKeys, useCancelSubscription,
  // Mutations
  useCreateSubscription, useCurrentUserSubscription, useDeleteSubscription, useIsSubscriptionActive,
  // Realtime
  useSubscriptionRealtime, useUpdateSubscription,
  // Queries
  useUserSubscription
} from './subscriptions';

// Events API
export {
  // Query Keys
  eventKeys,
  // Mutations
  useCreateEvent, useDeleteEvent, useEvent, useEventsRealtime,
  // Queries
  useGroupEvents,
  // Realtime
  useGroupEventsRealtime, useUpcomingGroupEvents, useUpdateEvent, useUserCreatedEvents, useUserGroupsEvents
} from './events';

// Utility functions for common operations
import { supabase } from './supabase';

export const apiUtils = {
  // Auth helpers
  getCurrentUserId: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },
  
  // Check if user is group member
  checkGroupMembership: async (groupId: string, userId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
  
  // Check if user owns group
  checkGroupOwnership: async (groupId: string, userId: string) => {
    const { data, error } = await supabase
      .from('groups')
      .select('owner_id')
      .eq('id', groupId)
      .eq('owner_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },
  
  // Generate unique invite code
  generateInviteCode: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Format date for display
  formatEventDate: (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  // Check if subscription is active
  isSubscriptionActive: (subscription: { status: string; expires_at?: string | null }) => {
    if (subscription.status !== 'active') return false;
    
    if (subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();
      return expiresAt > now;
    }
    
    return true; // expires_at null ise sınırsız abonelik
  },
};
