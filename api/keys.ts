// Consolidated Query Keys

export const userKeys = {
  all: ["users"] as const,
  current: () => [...userKeys.all, "current"] as const,
  byCustomId: (customId: string) =>
    [...userKeys.all, "custom", customId] as const,
};

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
  members: (groupId: string) =>
    [...groupKeys.detail(groupId), "members"] as const,
  requests: (groupId: string) =>
    [...groupKeys.detail(groupId), "requests"] as const,
  invite: (inviteCode: string) =>
    [...groupKeys.all, "invite", inviteCode] as const,
};

export const moodKeys = {
  all: ["moods"] as const,
  lists: () => [...moodKeys.all, "list"] as const,
  details: () => [...moodKeys.all, "detail"] as const,
};

export const statusKeys = {
  all: ["statuses"] as const,
  custom: (groupId?: string, userId?: string) =>
    [...statusKeys.all, "custom", groupId, userId] as const,
  default: ["statuses", "default"] as const,
};

export const nicknameKeys = {
  all: ["nicknames"] as const,
  lists: () => [...nicknameKeys.all, "list"] as const,
  list: (filters: string) => [...nicknameKeys.lists(), { filters }] as const,
  group: (groupId: string) => [...nicknameKeys.all, "group", groupId] as const,
  user: (userId: string) => [...nicknameKeys.all, "user", userId] as const,
  specific: (groupId: string, setterUserId: string, targetUserId: string) =>
    [
      ...nicknameKeys.all,
      "specific",
      groupId,
      setterUserId,
      targetUserId,
    ] as const,
};

export const mutedKeys = {
  all: ["muted-notifications"] as const,
  user: (userId: string) => [...mutedKeys.all, "user", userId] as const,
  check: (muterUserId: string, mutedUserId: string) =>
    [...mutedKeys.all, "check", muterUserId, mutedUserId] as const,
};

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  user: (userId: string) => [...subscriptionKeys.all, "user", userId] as const,
  active: (userId: string) =>
    [...subscriptionKeys.user(userId), "active"] as const,
};

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (filters: string) => [...eventKeys.lists(), { filters }] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  group: (groupId: string) => [...eventKeys.all, "group", groupId] as const,
  user: (userId: string) => [...eventKeys.all, "user", userId] as const,
  upcoming: (groupId: string) =>
    [...eventKeys.group(groupId), "upcoming"] as const,
};
