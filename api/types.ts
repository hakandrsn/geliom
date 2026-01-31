/**
 * GELIOM API TYPE DEFINITIONS
 */

// ==========================================
// 1. DATABASE MODELS (Tables)
// ==========================================

export interface User {
  id: string; // Firebase UID
  email: string;
  customId: string;
  displayName: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  subscriptionStatus: string | null;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Group {
  id: string; // UUID
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  max_members: number;
  created_at: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface UserStatus {
  userId: string;
  groupId: string;
  text: string;
  emoji: string | null;
  mood: string | null;
  updatedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  groupId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface GroupMood {
  id: string;
  groupId: string;
  text: string;
  emoji: string | null;
  mood: string; // e.g. "happy"
}

export interface NotificationSetting {
  userId: string;
  groupId: string;
  isMuted: boolean;
}

export interface StatusOption {
  id: string;
  text: string;
  emoji?: string;
  is_custom: boolean;
}

// ==========================================
// 2. API RESPONSES (Endpoints)
// ==========================================

// Auth & Users
// ----------------------------------------

/** GET /users/me */
export type GetProfileResponse = User;

/** GET /users/me/groups */
export type GetMyGroupsResponse = (GroupMember & {
  group: Group;
})[];

/** GET /users/by-custom-id/:customId */
export type FindUserResponse =
  | { found: false }
  | {
      found: true;
      user: Pick<User, "customId" | "displayName" | "photoUrl">;
    };

// Groups
// ----------------------------------------

/** POST /groups */
export type CreateGroupResponse = Group;

/** POST /groups/join */
export type JoinGroupResponse = GroupMember;

/** GET /groups/:id/requests (Admin Only) */
export type GetGroupRequestsResponse = (JoinRequest & {
  user: User;
})[];

/** POST /groups/:id/join-request */
export type CreateJoinRequestResponse = JoinRequest;

/** PATCH /groups/:id */
export type UpdateGroupResponse = Group;

/** POST /groups/:id/mute */
export type MuteGroupResponse = NotificationSetting;

// Status
// ----------------------------------------

/** POST /status */
export type UpdateStatusResponse = UserStatus;

// Moods
// ----------------------------------------

/** POST /groups/:id/moods */
export type AddGroupMoodResponse = GroupMood;

// Realtime Events
// ----------------------------------------

export interface StatusUpdatePayload {
  userId: string;
  groupId: string;
  text: string;
  emoji?: string;
  mood?: string;
  updatedAt: string;
}
