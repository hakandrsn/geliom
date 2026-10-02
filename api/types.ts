/**
 * GELIOM API TYPE DEFINITIONS
 * Kaynak: geliom-api/docs/mobile_api_doc.md
 */

// ==========================================
// 1. MODELLER
// ==========================================

export interface User {
  id: string; // Firebase UID
  email: string;
  customId: string;
  displayName: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  subscriptionStatus: string | null;
  groupIds: string[];
  /** Uygulama içi genel bildirim tercihi (varsayılan açık) */
  pushEnabled?: boolean;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

/** Üyenin bu grup için çözümlenmiş bildirim tercihleri. */
export interface GroupNotificationPrefs {
  /** Bu gruptan bildirim al (kapalıysa hiçbir şey gelmez) */
  enabled: boolean;
  statusUpdates: boolean;
  moodUpdates: boolean;
  /** Değişiklikleri bildirilmeyecek üyeler */
  mutedUserIds: string[];
}

export interface GroupMemberEntry {
  role: "ADMIN" | "MEMBER";
  displayName: string | null;
  photoUrl: string | null;
  customId: string;
  isMuted: boolean;
  notificationPrefs?: {
    statusUpdates: boolean;
    moodUpdates: boolean;
    mutedUserIds: string[];
  };
  joinedAt: string;
}

export interface StatusEntry {
  /** Durum metni — ruh hali tek başına paylaşılabildiği için opsiyonel */
  text?: string | null;
  emoji?: string | null;
  mood?: string | null;
  updatedAt: string;
}

/** Grubun durum seçeneği (sahibi düzenler; herkes aynı listeyi görür). */
export interface GroupOption {
  id: string;
  text: string;
  emoji?: string | null;
  /** Uygulamanın hazır seçeneği ve hiç düzenlenmedi */
  isDefault: boolean;
  /** Yalnızca durum: bu duruma geçince üyelere bildirim gitsin mi (yoksa true) */
  notifies?: boolean;
}

/** Ruh hali seçeneği — status kaydında `key` saklanır. */
export interface GroupMoodOption extends GroupOption {
  key: string;
}

/** @deprecated Eski model; sunucu moodOptions'a taşır. */
export interface CustomMood {
  id: string;
  text: string;
  emoji: string | null;
  mood: string;
  createdAt: string;
}

/** Session state'in tamamı — socket `session:open` ile gelir. */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  ownerIsPremium: boolean;
  version: number;
  /** userId ile key'lenmiş map — dizi değil! */
  members: Record<string, GroupMemberEntry>;
  /** userId ile key'lenmiş map — dizi değil! */
  statuses: Record<string, StatusEntry>;
  statusOptions: GroupOption[];
  moodOptions: GroupMoodOption[];
  /** Sahibinin aboneliği bitti: canlı akış kapalı, grup salt okunur */
  isPaused?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /users/me/groups elemanı — grup listesi ekranı için yeterli özet. */
export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  role: "ADMIN" | "MEMBER";
  isPaused?: boolean;
  ownerIsPremium?: boolean;
  /** Benim bu grup için bildirim tercihlerim */
  notifications: GroupNotificationPrefs;
  memberCount: number;
  joinedAt: string;
}

/** GET /groups/:id/requests elemanı (flat — nested user yok). */
export interface JoinRequest {
  id: string;
  userId: string;
  displayName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  respondedAt: string | null;
}

/** Client tarafı status seçenekleri (lokal liste). */
export interface StatusOption {
  id: string;
  text: string;
  emoji?: string;
  is_custom: boolean;
}

// ==========================================
// 2. REST RESPONSE TİPLERİ
// ==========================================

/** GET /users/me */
export type GetProfileResponse = User;

/** GET /users/me/groups */
export type GetMyGroupsResponse = GroupSummary[];

/** GET /users/by-custom-id/:customId — sadece public alanlar döner */
export type FindUserResponse =
  | { found: false }
  | {
      found: true;
      user: Pick<User, "id" | "customId" | "displayName" | "photoUrl">;
    };

/** POST /groups — tam grup objesi döner (inviteCode içinde) */
export type CreateGroupResponse = Group;

/** PATCH /groups/:id */
export type UpdateGroupResponse = Group;

/** GET /groups/:id/requests (Admin) */
export type GetGroupRequestsResponse = JoinRequest[];

/** PUT /groups/:id/options (Sahip + Premium) */
export interface UpdateGroupOptionsResponse {
  statusOptions: GroupOption[];
  moodOptions: GroupMoodOption[];
}

// ==========================================
// 3. SOCKET (SESSION) TİPLERİ
// ==========================================

/** Tüm client→server event'lerinin ack cevabı. */
export type SocketAck<T = {}> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** `session:open` ack / `session:state` payload'ı */
export interface SessionState {
  group: Group;
  version: number;
  onlineUserIds: string[];
}

export type SessionUpdateEventType =
  | "status.updated"
  | "status.cleared"
  | "member.joined"
  | "member.left"
  | "group.updated"
  | "mood.added"
  | "mood.removed"
  | "options.updated"
  | "plan.changed"
  | "premium.changed";

/** `session:update` payload'ı — patch deep-partial merge, removed silinecek path listesi */
export interface SessionUpdatePayload {
  version: number;
  event: SessionUpdateEventType;
  patch?: DeepPartial<Group>;
  removed?: string[]; // örn: ["members.uid_2", "statuses.uid_2"]
}

export interface PresenceUpdatePayload {
  userId: string;
  online: boolean;
}

export type SessionClosedReason = "removed" | "deleted" | "switched" | "server" | "paused";

export interface SessionClosedPayload {
  reason: SessionClosedReason;
}

export interface PremiumUpdatePayload {
  isPremium: boolean;
}

/** `status:update` emit payload'ı — aktif session'a işlenir, groupId gönderilmez */
export interface StatusUpdateInput {
  text?: string; // ≤200 kr — text veya mood'dan en az biri zorunlu
  emoji?: string; // ≤16 kr
  mood?: string; // ≤50 kr
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
