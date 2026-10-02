import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "./client";
import { DEFAULT_MOODS, DEFAULT_STATUSES } from "./constants";
import { groupKeys } from "./keys";
import { clearStatus, closeSession, openSession, updateStatus } from "./socket";
import {
  CreateGroupResponse,
  GetGroupRequestsResponse,
  GetMyGroupsResponse,
  Group,
  GroupMemberEntry,
  GroupMoodOption,
  GroupNotificationPrefs,
  GroupOption,
  GroupSummary,
  JoinRequest,
  StatusEntry,
  StatusUpdateInput,
  UpdateGroupOptionsResponse,
  UpdateGroupResponse,
} from "./types";

export { groupKeys };

// ==========================================
// GROUPS (Core — REST)
// ==========================================

export const DEFAULT_NOTIFICATION_PREFS: GroupNotificationPrefs = {
  enabled: true,
  statusUpdates: true,
  moodUpdates: true,
  mutedUserIds: [],
};

/** Session'daki üyelik kaydından tercihleri çözümler (sunucu ile aynı varsayılanlar). */
export const resolveNotificationPrefs = (
  member?: GroupMemberEntry | null,
): GroupNotificationPrefs => ({
  enabled: member ? !member.isMuted : true,
  statusUpdates: member?.notificationPrefs?.statusUpdates ?? true,
  moodUpdates: member?.notificationPrefs?.moodUpdates ?? true,
  mutedUserIds: member?.notificationPrefs?.mutedUserIds ?? [],
});

const toGroupSummary = (group: Group, role: "ADMIN" | "MEMBER"): GroupSummary => ({
  id: group.id,
  name: group.name,
  description: group.description,
  inviteCode: group.inviteCode,
  ownerId: group.ownerId,
  role,
  notifications: DEFAULT_NOTIFICATION_PREFS,
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

/** Durumu tamamen kaldırır (metin + mood). Session patch'i herkese yansır. */
export const useClearUserStatus = () => {
  const clearOwnStatus = useAppStore((state) => state.clearOwnStatus);
  const user = useAppStore((state) => state.user);

  return useMutation({
    mutationFn: async (): Promise<void> => clearStatus(),
    onSuccess: () => {
      if (user?.id) clearOwnStatus(user.id);
    },
  });
};

/**
 * Grubun seçenek listeleri — aktif session'dan. Session henüz yoksa
 * varsayılanlar (yükleme anında boş görünmesin diye).
 */
export const useGroupOptions = (groupId?: string) => {
  const session = useAppStore((state) => state.session);
  const live = session && (!groupId || session.group.id === groupId) ? session.group : null;
  return {
    statusOptions: (live?.statusOptions ?? DEFAULT_STATUSES) as GroupOption[],
    moodOptions: (live?.moodOptions ?? DEFAULT_MOODS) as GroupMoodOption[],
    isLoaded: !!live,
    isPaused: !!live?.isPaused,
  };
};

/**
 * PUT /groups/:id/options — sahip + premium. Listeler sırasıyla ve tamamen
 * değiştirilir; yeni seçeneklerde id gönderilmez. Session'a options.updated
 * patch'i olarak canlı yansır.
 */
export const useUpdateGroupOptions = () =>
  useMutation({
    mutationFn: async ({
      groupId,
      statusOptions,
      moodOptions,
    }: {
      groupId: string;
      statusOptions?: { id?: string; text: string; emoji?: string; notifies?: boolean }[];
      moodOptions?: { id?: string; text: string; emoji?: string }[];
    }): Promise<UpdateGroupOptionsResponse> => {
      const response = await apiClient.put(`/groups/${groupId}/options`, {
        statusOptions,
        moodOptions,
      });
      return response.data;
    },
  });

// ==========================================
// NOTIFICATIONS (Settings)
// ==========================================

/**
 * PATCH /groups/:id/notifications — yalnızca gönderilen alanlar değişir.
 * Sonuç hem grup listesine (optimistic) hem session patch'iyle üyeliğe yansır.
 */
export const useUpdateGroupNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      ...changes
    }: {
      groupId: string;
      enabled?: boolean;
      statusUpdates?: boolean;
      moodUpdates?: boolean;
      mutedUserIds?: string[];
    }): Promise<{ groupId: string; notifications: GroupNotificationPrefs }> => {
      const response = await apiClient.patch(
        `/groups/${groupId}/notifications`,
        changes,
      );
      return response.data;
    },
    onMutate: ({ groupId, ...changes }) => {
      const { groups, setGroups } = useAppStore.getState();
      const previous = groups;
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, notifications: { ...g.notifications, ...changes } }
            : g,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) useAppStore.getState().setGroups(context.previous);
    },
    onSuccess: ({ groupId, notifications }) => {
      const { groups, setGroups } = useAppStore.getState();
      setGroups(groups.map((g) => (g.id === groupId ? { ...g, notifications } : g)));
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

/** Geriye dönük kısayol: grubun bildirimlerini tamamen aç/kapat. */
export const useMuteGroup = () => {
  const update = useUpdateGroupNotifications();
  return {
    ...update,
    mutateAsync: ({ groupId, isMuted }: { groupId: string; isMuted: boolean }) =>
      update.mutateAsync({ groupId, enabled: !isMuted }),
  };
};
