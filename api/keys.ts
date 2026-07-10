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
  requests: (groupId: string) =>
    [...groupKeys.all, "requests", groupId] as const,
};

export const statusKeys = {
  all: ["statuses"] as const,
  custom: (groupId?: string, userId?: string) =>
    [...statusKeys.all, "custom", groupId, userId] as const,
  default: ["statuses", "default"] as const,
  order: (kind: "status" | "mood", userId?: string, groupId?: string) =>
    [...statusKeys.all, "order", kind, userId, groupId] as const,
};
