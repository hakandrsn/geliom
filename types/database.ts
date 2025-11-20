export interface User {
  id: string; // UUID - auth.users'dan referans
  custom_user_id: string; // TEXT UK - 8 karakterli unique kod (grup davetiyesi için)
  email?: string; // TEXT - Kullanıcı email adresi
  display_name?: string; // TEXT
  photo_url?: string; // TEXT
  avatar?: string | null; // TEXT - Avatar dosya adı (örn: "bear.png", "man-1.png")
  /** @deprecated Use user_group_moods table instead. This field is kept for backward compatibility. */
  mood_id?: number; // INT FK - moods tablosuna referans (DEPRECATED - use user_group_moods)
  show_mood?: boolean; // BOOLEAN
  onesignal_player_id?: string; // TEXT
  updated_at?: string; // TIMESTAMPTZ
}

export interface Mood {
  id: number; // INT PK
  text: string; // TEXT UK
  emoji?: string; // TEXT
}

export interface Group {
  id: string; // UUID PK
  owner_id: string; // UUID FK
  type: string; // TEXT NOT NULL
  name: string; // TEXT
  invite_code: string; // TEXT UK
  member_limit?: number; // INT
  created_at?: string; // TIMESTAMPTZ
}

export interface GroupMember {
  group_id: string; // UUID PK, FK
  user_id: string; // UUID PK, FK
  joined_at?: string; // TIMESTAMPTZ
}

export interface Nickname {
  group_id: string; // UUID PK, FK
  setter_user_id: string; // UUID PK, FK
  target_user_id: string; // UUID PK, FK
  nickname: string; // TEXT
}

export interface Status {
  id: number; // INT PK
  text: string; // TEXT
  notifies: boolean; // BOOLEAN NOT NULL DEFAULT false
  is_custom: boolean; // BOOLEAN NOT NULL DEFAULT false
  owner_id?: string; // UUID FK - Eğer custom ise sahibi
  messages?: string[]; // TEXT[] - Bildirim mesajları (rastgele seçilecek)
}

export interface UserStatus {
  user_id: string; // UUID PK, FK
  group_id?: string; // UUID FK - NULL ise global status (tüm gruplar için geçerli)
  status_id: number; // INT FK
  updated_at?: string; // TIMESTAMPTZ
}

export interface UserGroupMood {
  user_id: string; // UUID PK, FK
  group_id?: string; // UUID FK - NULL ise global mood (tüm gruplar için geçerli)
  mood_id: number; // INT FK
  updated_at?: string; // TIMESTAMPTZ
}

export interface MutedNotification {
  muter_user_id: string; // UUID PK, FK
  muted_user_id: string; // UUID PK, FK
}

export interface Subscription {
  user_id: string; // UUID PK, FK
  status: string; // TEXT
  expires_at?: string; // TIMESTAMPTZ
}

export interface ScheduledEvent {
  id: string; // UUID PK
  group_id: string; // UUID FK
  creator_id: string; // UUID FK
  title: string; // TEXT
  event_time: string; // TIMESTAMPTZ
  notification_time?: string; // TIMESTAMPTZ
  created_at?: string; // TIMESTAMPTZ
}

export interface GroupJoinRequest {
  id: string; // UUID PK
  group_id: string; // UUID FK
  requester_id: string; // UUID FK
  status: 'pending' | 'approved' | 'rejected'; // TEXT
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// Create/Update types (without auto-generated fields)
export type CreateUser = Omit<User, 'id' | 'updated_at'>;
export type UpdateUser = Partial<Omit<User, 'id'>>;

export type CreateMood = Omit<Mood, 'id'>;
export type UpdateMood = Partial<Omit<Mood, 'id'>>;

export type CreateGroup = Omit<Group, 'id' | 'created_at'>;
export type UpdateGroup = Partial<Omit<Group, 'id' | 'created_at'>>;

export type CreateGroupMember = Omit<GroupMember, 'joined_at'>;

export type CreateNickname = Nickname;
export type UpdateNickname = Partial<Omit<Nickname, 'group_id' | 'setter_user_id' | 'target_user_id'>>;

export type CreateStatus = Omit<Status, 'id'>;
export type UpdateStatus = Partial<Omit<Status, 'id'>>;

export type CreateUserStatus = Omit<UserStatus, 'updated_at'>;
export type UpdateUserStatus = Partial<Omit<UserStatus, 'user_id' | 'group_id' | 'updated_at'>>;

export type CreateUserGroupMood = Omit<UserGroupMood, 'updated_at'>;
export type UpdateUserGroupMood = Partial<Omit<UserGroupMood, 'user_id' | 'group_id' | 'updated_at'>>;

export type CreateMutedNotification = MutedNotification;

export type CreateSubscription = Subscription;
export type UpdateSubscription = Partial<Omit<Subscription, 'user_id'>>;

export type CreateScheduledEvent = Omit<ScheduledEvent, 'id' | 'created_at'>;
export type UpdateScheduledEvent = Partial<Omit<ScheduledEvent, 'id' | 'created_at'>>;

export type CreateGroupJoinRequest = Omit<GroupJoinRequest, 'id' | 'created_at' | 'updated_at' | 'status'>;
export type UpdateGroupJoinRequest = Partial<Omit<GroupJoinRequest, 'id' | 'group_id' | 'requester_id' | 'created_at'>>;

// Response types with relations
export interface UserWithMood extends User {
  mood?: Mood;
}

export interface GroupWithOwner extends Group {
  owner?: User;
  members?: GroupMember[];
}

export interface GroupMemberWithUser extends GroupMember {
  user?: User;
}

export interface UserStatusWithStatus extends UserStatus {
  status?: Status;
}

export interface UserGroupMoodWithMood extends UserGroupMood {
  mood?: Mood;
}

export interface ScheduledEventWithDetails extends ScheduledEvent {
  group?: Group;
  creator?: User;
}

export interface GroupJoinRequestWithDetails extends GroupJoinRequest {
  group?: GroupWithOwner;
  requester?: User;
}

export interface PendingNotification {
  id: string; // UUID PK
  sender_id: string; // UUID FK
  receiver_ids: string[]; // UUID[]
  group_id: string; // UUID FK
  status_id: number; // INT FK
  scheduled_at: string; // TIMESTAMPTZ
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

export type CreatePendingNotification = Omit<PendingNotification, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePendingNotification = Partial<Omit<PendingNotification, 'id' | 'sender_id' | 'group_id' | 'created_at'>>;
