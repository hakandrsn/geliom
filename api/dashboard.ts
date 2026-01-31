import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { useGroupMembers } from "./groups";

export interface DashboardMember {
  userId: string;
  displayName?: string;
  photoUrl?: string;
  customId?: string;
  nickname?: string;
  // Status info
  statusText?: string;
  statusEmoji?: string;
  // Mood info
  moodEmoji?: string;
  moodText?: string;
  updatedAt?: string;
  role?: string;
  isMuted?: boolean;
}

export const useGroupDashboardData = (groupId: string) => {
  const {
    data: queryMembers = [],
    isLoading,
    error,
  } = useGroupMembers(groupId);
  const groups = useAppStore((state) => state.groups);
  const group = groups.find((g) => g.id === groupId);

  const mappedMembers: DashboardMember[] = useMemo(() => {
    // Collect members from store if available, otherwise from query
    const membersToMap = group?.members || queryMembers;

    return membersToMap.map((m: any) => {
      const userId = m.id || m.userId;

      // Get latest status/mood from store
      const status = group?.statuses?.find((s) => s.userId === userId);
      const mood = group?.moods?.find((mood) => mood.userId === userId);

      return {
        userId: userId,
        displayName: m.displayName || m.display_name,
        photoUrl: m.photoUrl || m.photo_url,
        customId: m.customId || m.custom_user_id,
        nickname: m.nickname,

        statusText: status?.text || m.status?.text,
        statusEmoji: status?.emoji || m.status?.emoji,
        moodEmoji: mood?.emoji || m.mood?.emoji,
        moodText: mood?.mood || m.mood?.mood,
        updatedAt:
          status?.updatedAt ||
          mood?.updatedAt ||
          m.status?.updatedAt ||
          m.mood?.updatedAt,

        role: m.role || "MEMBER",
        isMuted: m.isMuted,
      };
    });
  }, [group, queryMembers]);

  return {
    data: mappedMembers,
    isLoading: isLoading && mappedMembers.length === 0,
    error,
  };
};

export const useDashboardRealtime = (groupId: string) => {
  // Realtime updates are handled via the store subscription in useGroupDashboardData
};
