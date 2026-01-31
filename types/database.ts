/**
 * Legacy Database Types
 * Maintains compatibility for code transitioning to types/api.ts
 */

export interface User {
  id: string;
  email: string; // compatibility
  custom_user_id?: string;
  display_name?: string;
  photo_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface GroupMemberWithUser extends GroupMember {
  user: User;
}

export interface GroupWithOwner extends Group {
  owner?: User;
  members_count?: number;
}

export interface Group {
  id: string;
  name: string;
  type?: string;
  description?: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  image_url?: string;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  role: "admin" | "member" | "owner";
  joined_at: string;
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  requester_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

/* EVENTS */
export interface ScheduledEvent {
  id: string;
  group_id: string;
  creator_id: string;
  title: string;
  description?: string;
  event_time: string;
  created_at: string;
}

export interface ScheduledEventWithDetails extends ScheduledEvent {
  group?: Group;
  creator?: User;
}

export interface CreateScheduledEvent {
  group_id: string;
  creator_id: string;
  title: string;
  description?: string;
  event_time: string;
}

export interface UpdateScheduledEvent {
  title?: string;
  description?: string;
  event_time?: string;
}

/* NICKNAMES */
export interface Nickname {
  id: string;
  group_id: string;
  setter_user_id: string;
  target_user_id: string;
  nickname: string;
  created_at: string;
}

export interface CreateNickname {
  group_id: string;
  setter_user_id: string;
  target_user_id: string;
  nickname: string;
}

export interface UpdateNickname {
  nickname?: string;
}

/* SUBSCRIPTIONS */
export interface Subscription {
  id: string;
  user_id: string;
  status: "active" | "cancelled" | "expired";
  tier: string;
  expires_at?: string;
  created_at: string;
}

export interface CreateSubscription {
  user_id: string;
  tier: string;
  status?: string;
}

export interface UpdateSubscription {
  status?: "active" | "cancelled";
  tier?: string;
}

/* MUTED NOTIFICATIONS */
export interface MutedNotification {
  id: string;
  muter_user_id: string;
  muted_user_id: string;
  created_at: string;
}
