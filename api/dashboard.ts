import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { DEFAULT_MOODS } from "./constants";

export interface DashboardMember {
  userId: string;
  displayName?: string;
  photoUrl?: string;
  customId?: string;
  // Status info
  statusText?: string;
  statusEmoji?: string;
  // Mood info
  moodEmoji?: string;
  moodText?: string;
  updatedAt?: string;
  role?: string;
  isMuted?: boolean;
  isOnline?: boolean;
}

/**
 * Dashboard verisi tek kaynaktan gelir: aktif socket session'ı.
 * `session.group.members` ve `session.group.statuses` userId ile key'lenmiş map'lerdir.
 */
export const useGroupDashboardData = (groupId: string) => {
  const session = useAppStore((state) => state.session);
  const hasSession = !!session && session.group.id === groupId;

  const mappedMembers: DashboardMember[] = useMemo(() => {
    if (!hasSession || !session) return [];

    const { members, statuses, customMoods } = session.group;
    const online = new Set(session.onlineUserIds);
    // StatusEntry.mood bir key tutar ("happy" gibi) — görünen metin/emoji mood tanımından çözülür
    const moodDefs = [...(customMoods ?? []), ...DEFAULT_MOODS];

    return Object.entries(members).map(([userId, member]) => {
      const status = statuses[userId];
      const moodDef = status?.mood
        ? moodDefs.find((m) => m.mood === status.mood)
        : undefined;

      return {
        userId,
        displayName: member.displayName ?? undefined,
        photoUrl: member.photoUrl ?? undefined,
        customId: member.customId,

        statusText: status?.text,
        statusEmoji: status?.emoji ?? undefined,
        moodEmoji: moodDef?.emoji ?? status?.emoji ?? undefined,
        moodText: moodDef?.text ?? status?.mood ?? undefined,
        updatedAt: status?.updatedAt,

        role: member.role,
        isMuted: member.isMuted,
        isOnline: online.has(userId),
      };
    });
  }, [hasSession, session]);

  return {
    data: mappedMembers,
    isLoading: !hasSession,
    error: null,
  };
};

/**
 * Session yaşam döngüsü home ekranında `useGroupSession` ile yönetilir;
 * burada ikinci bir open/close yapılmaz. Store subscription canlı akışı sağlar.
 */
export const useDashboardRealtime = (_groupId: string) => {};
