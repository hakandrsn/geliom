import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { humanizeKey } from "@/utils/status-display";
import { DEFAULT_MOODS, LEGACY_MOODS } from "./constants";

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

    const { members, statuses, moodOptions } = session.group;
    const online = new Set(session.onlineUserIds);
    // StatusEntry.mood bir key tutar ("happy" gibi) — görünen metin/emoji mood tanımından çözülür
    // Grubun güncel listesi önce; silinmiş varsayılan/eski kayıtlar yine çözülsün
    const moodDefs = [...(moodOptions ?? []), ...DEFAULT_MOODS, ...LEGACY_MOODS];

    return Object.entries(members).map(([userId, member]) => {
      const status = statuses[userId];
      const moodDef = status?.mood
        ? moodDefs.find((m) => m.key === status.mood)
        : undefined;

      return {
        userId,
        displayName: member.displayName ?? undefined,
        photoUrl: member.photoUrl ?? undefined,
        customId: member.customId,

        statusText: status?.text ?? undefined,
        statusEmoji: status?.emoji ?? undefined,
        moodEmoji: moodDef?.emoji ?? status?.emoji ?? undefined,
        moodText: moodDef?.text ?? humanizeKey(status?.mood),
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
