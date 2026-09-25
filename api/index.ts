// Export Types, Keys, Constants
export * from "./constants";
export * from "./keys";
export * from "./types";

// Export User Related Hooks
export {
  useCurrentUser,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserAvatar,
  useUserByCustomId,
} from "./users";

// Export Group Related Hooks
export {
  useApproveJoinRequest,
  // Core
  useCreateGroup,
  useCreateJoinRequest,
  // Join Requests
  useGroupJoinRequests,
  // Session (Socket)
  useGroupSession,
  useJoinGroup,
  useLeaveGroup,
  // Settings
  useMuteGroup,
  useUpdateGroupNotifications,
  resolveNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  useRejectJoinRequest,
  useRemoveGroupMember,
  useRespondToJoinRequest,
  useSendJoinRequest,
  useSetUserStatus,
  useGroupOptions,
  useUpdateGroupOptions,
  useClearUserStatus,
  useUpdateGroup,
  useUserGroups,
} from "./groups";

// Export Support
export {
  SUPPORT_CATEGORIES,
  useSendSupportMessage,
  type SupportCategory,
} from "./support";

// Export Dashboard Helpers
export {
  useGroupDashboardData,
  type DashboardMember,
} from "./dashboard";

// Export Socket API
export {
  clearStatus,
  closeSession,
  disconnectSocket,
  getSocket,
  initSocket,
  openSession,
  updateStatus,
} from "./socket";
