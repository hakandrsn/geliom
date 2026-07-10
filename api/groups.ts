import { useAppStore } from "@/store/useAppStore";
import { getMoodOrder, getStatusOrder } from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "./client";
import { DEFAULT_MOODS, DEFAULT_STATUSES } from "./constants";
import { groupKeys, statusKeys } from "./keys";
import { closeSession, openSession, updateStatus } from "./socket";
import {
  AddGroupMoodResponse,
  CreateGroupResponse,
  GetGroupRequestsResponse,
  GetMyGroupsResponse,
  Group,
  GroupSummary,
  JoinRequest,
  StatusEntry,
  StatusOption,
  StatusUpdateInput,
  UpdateGroupResponse,
} from "./types";

export { groupKeys };

// ==========================================
// GROUPS (Core — REST)
// ==========================================

const toGroupSummary = (group: Group, role: "ADMIN" | "MEMBER"): GroupSummary => ({
  id: group.id,
  name: group.name,
  description: group.description,
  inviteCode: group.inviteCode,
  ownerId: group.ownerId,
  role,
  memberCount: Object.keys(group.members ?? {}).length,
  joinedAt: group.createdAt,
});

export const useUserGroups = () => {
  const setGroups = useAppStore((state) => state.setGroups);

  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async (): Promise<GroupSummary[]> => {
      const response = await apiClient.get<GetMyGroupsResponse>(
        "/users/me/groups",
      );
      setGroups(response.data);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const addGroup = useAppStore((state) => state.addGroup);

  return useMutation({
    mutationFn: async (data: { name: string }): Promise<Group> => {
      // Bilinmeyen alanlar 400 döndürür — sadece name gönderilir
      const response = await apiClient.post<CreateGroupResponse>("/groups", {
        name: data.name,
      });
      return response.data;
    },
    onSuccess: (group) => {
      addGroup(toGroupSummary(group, "ADMIN"));
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; description?: string };
    }): Promise<Group> => {
      const response = await apiClient.patch<UpdateGroupResponse>(
        `/groups/${id}`,
        updates,
      );
      return response.data;
    },
    onSuccess: () => {
      // Aktif session'a değişiklik zaten canlı yayınlanır (group.updated)
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/** Davet koduyla direkt katılım (6 karakter). */
export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { inviteCode: string }): Promise<Group> => {
      const response = await apiClient.post("/groups/join", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      await apiClient.delete(`/groups/${groupId}/leave`);
    },
    onSuccess: (_, groupId) => {
      const { groups, setGroups, currentGroupId, setCurrentGroup, session } =
        useAppStore.getState();
      setGroups(groups.filter((g) => g.id !== groupId));
      if (currentGroupId === groupId) setCurrentGroup(null);
      if (session?.group.id === groupId) closeSession();
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/** Admin: üyeyi gruptan çıkarır. Değişiklik session'a member.left ile canlı düşer. */
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }): Promise<void> => {
      await apiClient.delete(`/groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

// ==========================================
// JOIN REQUESTS (Admin onaylı akış)
// ==========================================

export const useGroupJoinRequests = (groupId: string) => {
  return useQuery({
    queryKey: groupKeys.requests(groupId),
    queryFn: async (): Promise<JoinRequest[]> => {
      const response = await apiClient.get<GetGroupRequestsResponse>(
        `/groups/${groupId}/requests`,
      );
      return response.data;
    },
    enabled: !!groupId,
  });
};

export const useSendJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      await apiClient.post(`/groups/${groupId}/join-request`);
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.requests(groupId) });
    },
  });
};
export const useCreateJoinRequest = useSendJoinRequest;

export const useRespondToJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      requestId,
      response,
    }: {
      groupId: string;
      requestId: string;
      response: "APPROVED" | "REJECTED";
    }): Promise<void> => {
      await apiClient.post(`/groups/${groupId}/requests/${requestId}/respond`, {
        response,
      });
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.requests(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useApproveJoinRequest = () => {
  const respond = useRespondToJoinRequest();
  return {
    ...respond,
    mutateAsync: async (variables: { groupId: string; requestId: string }) => {
      return respond.mutateAsync({ ...variables, response: "APPROVED" });
    },
  };
};

export const useRejectJoinRequest = () => {
  const respond = useRespondToJoinRequest();
  return {
    ...respond,
    mutateAsync: async (variables: { groupId: string; requestId: string }) => {
      return respond.mutateAsync({ ...variables, response: "REJECTED" });
    },
  };
};

// ==========================================
// SESSION (Socket)
// ==========================================

/**
 * Grup ekranı açıkken socket session'ını yönetir:
 * mount'ta `session:open`, unmount'ta / grup değişince `session:close`.
 * Tam grup verisi (üyeler, statüler, mood'lar) store'daki `session`'a akar.
 */
export const useGroupSession = (groupId: string | null | undefined) => {
  useEffect(() => {
    if (!groupId) return;

    openSession(groupId);

    return () => {
      closeSession();
    };
  }, [groupId]);
};

// ==========================================
// STATUS & MOODS
// ==========================================

/**
 * Durum paylaşımı — SADECE socket üzerinden yapılır (REST endpoint'i yok).
 * Aktif session'daki gruba işlenir; önce `useGroupSession` ile session açılmalıdır.
 */
export const useSetUserStatus = () => {
  const setOwnStatus = useAppStore((state) => state.setOwnStatus);
  const user = useAppStore((state) => state.user);

  return useMutation({
    mutationFn: async (payload: StatusUpdateInput): Promise<StatusEntry> => {
      return updateStatus(payload);
    },
    onSuccess: (status) => {
      // Ack'teki status ile optimistic UI'ı doğrula
      if (user?.id) setOwnStatus(user.id, status);
    },
  });
};

export interface MoodOption {
  id: string;
  text: string;
  emoji: string | null;
  mood: string;
  isCustom: boolean;
}

/** Varsayılan mood'lar + aktif session'daki grubun custom mood'ları. */
export const useMoods = (groupId?: string) => {
  const session = useAppStore((state) => state.session);

  const customMoods: MoodOption[] =
    session && (!groupId || session.group.id === groupId)
      ? (session.group.customMoods ?? []).map((m) => ({
          id: m.id,
          text: m.text,
          emoji: m.emoji,
          mood: m.mood,
          isCustom: true,
        }))
      : [];

  const data: MoodOption[] = [
    ...customMoods,
    ...DEFAULT_MOODS.map((m) => ({ ...m, isCustom: false })),
  ];

  return { data, isLoading: false, error: null };
};

/** Admin + Premium: gruba custom mood ekle (canlı yayınlanır — mood.added). */
export const useCreateMood = () => {
  return useMutation({
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: string;
      data: { text: string; emoji?: string; mood: string };
    }): Promise<AddGroupMoodResponse> => {
      const response = await apiClient.post(`/groups/${groupId}/moods`, data);
      return response.data;
    },
    // Session patch'i (mood.added) store'u zaten güncelleyecek
  });
};

/** Admin: gruptan custom mood sil (canlı yayınlanır — mood.removed). */
export const useDeleteMood = () => {
  return useMutation({
    mutationFn: async ({
      groupId,
      moodId,
    }: {
      groupId: string;
      moodId: string;
    }): Promise<void> => {
      await apiClient.delete(`/groups/${groupId}/moods/${moodId}`);
    },
    // Session patch'i (mood.removed) store'u zaten güncelleyecek
  });
};

// ------------------------------------------------------------------
// Custom status'ler — API'de karşılığı yok; GRUBA ÖZEL olarak
// kullanıcı + grup başına lokal (AsyncStorage) tutulur.
// Paylaşım anı yine socket status:update'tir.
// ------------------------------------------------------------------

const customStatusStorageKey = (userId: string, groupId: string) =>
  `geliom:custom-statuses:${userId}:${groupId}`;

const readCustomStatuses = async (
  userId: string,
  groupId: string,
): Promise<StatusOption[]> => {
  try {
    const raw = await AsyncStorage.getItem(
      customStatusStorageKey(userId, groupId),
    );
    return raw ? (JSON.parse(raw) as StatusOption[]) : [];
  } catch {
    return [];
  }
};

const writeCustomStatuses = async (
  userId: string,
  groupId: string,
  statuses: StatusOption[],
): Promise<void> => {
  await AsyncStorage.setItem(
    customStatusStorageKey(userId, groupId),
    JSON.stringify(statuses),
  );
};

export const useCustomStatuses = (groupId?: string, userId?: string) => {
  return useQuery({
    queryKey: statusKeys.custom(groupId, userId),
    queryFn: async (): Promise<StatusOption[]> => {
      if (!userId || !groupId) return [];
      return readCustomStatuses(userId, groupId);
    },
    enabled: !!userId && !!groupId,
    initialData: [],
  });
};

export const useCreateCustomStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      groupId,
      text,
      emoji,
    }: {
      userId: string;
      groupId: string;
      text: string;
      emoji?: string;
    }): Promise<StatusOption> => {
      const statuses = await readCustomStatuses(userId, groupId);
      const status: StatusOption = {
        id: `custom-${Date.now()}`,
        text,
        emoji,
        is_custom: true,
      };
      await writeCustomStatuses(userId, groupId, [status, ...statuses]);
      return status;
    },
    onSuccess: (_, { userId, groupId }) => {
      queryClient.invalidateQueries({
        queryKey: statusKeys.custom(groupId, userId),
      });
    },
  });
};

export const useDeleteCustomStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      groupId,
      statusId,
    }: {
      userId: string;
      groupId: string;
      statusId: string;
    }): Promise<void> => {
      const statuses = await readCustomStatuses(userId, groupId);
      await writeCustomStatuses(
        userId,
        groupId,
        statuses.filter((s) => s.id !== statusId),
      );
    },
    onSuccess: (_, { userId, groupId }) => {
      queryClient.invalidateQueries({
        queryKey: statusKeys.custom(groupId, userId),
      });
    },
  });
};

// ------------------------------------------------------------------
// Sıralama — kullanıcı + grup başına lokal tutulur ve seçicilerde uygulanır.
// ------------------------------------------------------------------

/**
 * Kaydedilmiş sıralamayı bir listeye uygular: sıralamada olanlar o sırayla
 * öne gelir, olmayanlar mevcut sıralarıyla sona eklenir.
 */
export const applySavedOrder = <T extends { id: string | number }>(
  items: T[],
  order: string[],
): T[] => {
  if (!order.length) return items;
  const ordered: T[] = [];
  for (const id of order) {
    const item = items.find((i) => String(i.id) === id);
    if (item) ordered.push(item);
  }
  const rest = items.filter((i) => !order.includes(String(i.id)));
  return [...ordered, ...rest];
};

export const useStatusOrder = (userId?: string, groupId?: string) => {
  return useQuery({
    queryKey: statusKeys.order("status", userId, groupId),
    queryFn: async (): Promise<string[]> => {
      if (!userId || !groupId) return [];
      return getStatusOrder(userId, groupId);
    },
    enabled: !!userId && !!groupId,
    initialData: [],
  });
};

export const useMoodOrder = (userId?: string, groupId?: string) => {
  return useQuery({
    queryKey: statusKeys.order("mood", userId, groupId),
    queryFn: async (): Promise<string[]> => {
      if (!userId || !groupId) return [];
      return getMoodOrder(userId, groupId);
    },
    enabled: !!userId && !!groupId,
    initialData: [],
  });
};

export const useDefaultStatuses = () => {
  return useQuery({
    queryKey: statusKeys.default,
    queryFn: async (): Promise<StatusOption[]> => DEFAULT_STATUSES,
    staleTime: Infinity,
  });
};

// ==========================================
// NOTIFICATIONS (Settings)
// ==========================================

/** Bu grubun push bildirimlerini benim için aç/kapat. */
export const useMuteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      isMuted,
    }: {
      groupId: string;
      isMuted: boolean;
    }): Promise<void> => {
      await apiClient.post(`/groups/${groupId}/mute`, { isMuted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};
