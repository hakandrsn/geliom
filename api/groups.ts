import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "./client";
import {
  eventKeys,
  groupKeys,
  moodKeys,
  nicknameKeys,
  statusKeys,
} from "./keys";
import {
  Group,
  GroupMember,
  GroupMood,
  JoinRequest,
  UpdateStatusResponse,
} from "./types";

import { joinGroupRoom, leaveGroupRoom } from "./socket";

// ==========================================
// GROUPS (Core)
// ==========================================

export const useUserGroups = () => {
  const setGroups = useAppStore((state) => state.setGroups);

  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async (): Promise<Group[]> => {
      const response = await apiClient.get("/users/me/groups");
      const memberships = response.data;
      const groups = memberships.map((m: any) => m.group);
      setGroups(groups);
      return groups;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useGroup = (id: string) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async (): Promise<Group> => {
      const response = await apiClient.get(`/groups/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useGroupByInviteCode = (inviteCode: string) => {
  return useQuery({
    queryKey: groupKeys.invite(inviteCode),
    queryFn: async (): Promise<Group> => {
      const response = await apiClient.get(`/groups/invite/${inviteCode}`);
      return response.data;
    },
    enabled: !!inviteCode && inviteCode.length >= 6,
    retry: false,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const addGroup = useAppStore((state) => state.addGroup);

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
    }): Promise<Group> => {
      const response = await apiClient.post("/groups", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      addGroup(data as any);
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
      const response = await apiClient.patch(`/groups/${id}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(data.id) });
    },
  });
};

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
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
};

export const useTransferGroupOwnership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      newOwnerId,
    }: {
      groupId: string;
      newOwnerId: string;
    }): Promise<void> => {
      await apiClient.post(`/groups/${groupId}/transfer-ownership`, {
        newOwnerId,
      });
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
};

// ==========================================
// MEMBERS
// ==========================================

// Extended GroupMember interface for UI compatibility
export interface UIGroupMember extends GroupMember {
  id: string; // Alias for userId
  displayName?: string;
  photoUrl?: string; // from contract or joined user
  customId?: string;
}

export const useGroupMembers = (groupId: string) => {
  const updateGroupMembers = useAppStore((state) => state.updateGroupMembers);

  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async (): Promise<UIGroupMember[]> => {
      const response = await apiClient.get(`/groups/${groupId}/members`);
      const rawMembers: any[] = response.data;

      const members: UIGroupMember[] = rawMembers.map((m: any) => ({
        ...m,
        id: m.userId,
        displayName: m.user?.displayName || m.displayName,
        photoUrl: m.user?.photoUrl || m.photoUrl,
        customId: m.user?.customId || m.customId,
        role: m.role || "MEMBER",
      }));

      updateGroupMembers(groupId, members);
      return members;
    },
    enabled: !!groupId,
  });
};

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
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }): Promise<void> => {
      await apiClient.post(`/groups/${groupId}/invite`, { userId });
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
};

// ==========================================
// JOIN REQUESTS
// ==========================================

export const useGroupJoinRequests = (groupId: string) => {
  return useQuery({
    queryKey: groupKeys.requests(groupId),
    queryFn: async (): Promise<
      (JoinRequest & {
        requester: {
          id: string;
          displayName?: string;
          photoUrl?: string;
          customId?: string;
        };
      })[]
    > => {
      const response = await apiClient.get(`/groups/${groupId}/requests`);
      const rawRequests: any[] = response.data;

      return rawRequests.map((req) => ({
        ...req,
        requester: {
          id: req.user.id,
          displayName: req.user.displayName || undefined,
          photoUrl: req.user.photoUrl || undefined,
          customId: req.user.customId,
        },
      }));
    },
    enabled: !!groupId,
  });
};

export const useSendJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<JoinRequest> => {
      const response = await apiClient.post(`/groups/${groupId}/join-request`);
      return response.data;
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
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
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

export const useGroupJoinRequestsRealtime = (groupId: string) => {
  // Placeholder for future realtime implementation
  return;
};

export const useGroupEventsRealtime = (groupId: string) => {
  useEffect(() => {
    if (!groupId) return;

    joinGroupRoom(groupId);

    return () => {
      leaveGroupRoom(groupId);
    };
  }, [groupId]);
};

// ==========================================
// STATUS & MOODS
// ==========================================

export interface CreateStatusPayload {
  groupId: string;
  text: string;
  emoji?: string;
  mood?: string;
  owner_id?: string;
  is_custom?: boolean;
  notifies?: boolean;
}

export const useSetUserStatus = () => {
  const queryClient = useQueryClient();
  const updateGroupStatus = useAppStore((state) => state.updateGroupStatus);
  const updateGroupMood = useAppStore((state) => state.updateGroupMood);

  return useMutation({
    mutationFn: async (
      payload: CreateStatusPayload,
    ): Promise<UpdateStatusResponse> => {
      const response = await apiClient.post("/status", payload);
      return response.data;
    },
    onSuccess: (data) => {
      updateGroupStatus(data.groupId, {
        userId: data.userId,
        text: data.text,
        emoji: data.emoji,
        updatedAt: data.updatedAt,
      } as any);

      if (data.mood) {
        updateGroupMood(data.groupId, {
          userId: data.userId,
          mood: data.mood,
          updatedAt: data.updatedAt,
        } as any);
      }

      queryClient.invalidateQueries({
        queryKey: groupKeys.detail(data.groupId),
      });
    },
  });
};

// Legacy UseCreateMood adaptation
export const useCreateMood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: string;
      data: { text: string; emoji: string; mood: string };
    }): Promise<GroupMood> => {
      // Assuming endpoint is similar or we map it to status or group moods
      const response = await apiClient.post(`/groups/${groupId}/moods`, data);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: [...moodKeys.lists(), groupId],
      });
    },
  });
};

export const useMoods = (groupId?: string) => {
  return useQuery({
    queryKey: [...moodKeys.lists(), groupId || "all"],
    queryFn: async (): Promise<GroupMood[]> => {
      try {
        const response = await apiClient.get("/moods", { params: { groupId } });
        return response.data;
      } catch (e) {
        return [];
      }
    },
  });
};

export const useCustomStatuses = (groupId?: string, userId?: string) => {
  return useQuery({
    queryKey: statusKeys.custom(groupId, userId),
    queryFn: async (): Promise<any[]> => {
      return []; // Mock
    },
    initialData: [],
  });
};

export const useDefaultStatuses = () => {
  return useQuery({
    queryKey: statusKeys.default,
    queryFn: async (): Promise<any[]> => {
      const texts = [
        "Müsait",
        "Meşgul",
        "Toplantıda",
        "Okulda",
        "İşte",
        "Uykuda",
        "Spor yapıyor",
      ];
      return texts.map((text, index) => ({
        id: `default-${index}`,
        text,
        is_custom: false,
      }));
    },
    staleTime: Infinity,
  });
};

export const useDeleteStatus = () => {
  return useMutation({
    mutationFn: async () => {},
  });
};
export const useDeleteMood = () => {
  return useMutation({
    mutationFn: async () => {},
  });
};
export const useCreateStatus = () => {
  return useMutation({
    mutationFn: async () => {},
  });
};

// ==========================================
// NICKNAMES (Group Scoped)
// ==========================================

export const useGroupNicknames = (groupId: string) => {
  return useQuery({
    queryKey: nicknameKeys.group(groupId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get(`/groups/${groupId}/nicknames`);
      return response.data || [];
    },
    enabled: !!groupId,
  });
};

export const useNickname = (
  groupId: string,
  setterUserId: string,
  targetUserId: string,
) => {
  return useQuery({
    queryKey: nicknameKeys.specific(groupId, setterUserId, targetUserId),
    queryFn: async (): Promise<any | null> => {
      const response = await apiClient.get(`/nicknames/specific`, {
        params: { groupId, setterUserId, targetUserId },
      });
      return response.data || null;
    },
    enabled: !!(groupId && setterUserId && targetUserId),
  });
};

export const useCreateNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nicknameData: any): Promise<any> => {
      const response = await apiClient.post("/nicknames", nicknameData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({
        queryKey: nicknameKeys.group(data.group_id),
      });
    },
  });
};

export const useUpdateNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      setterUserId,
      targetUserId,
      updates,
    }: {
      groupId: string;
      setterUserId: string;
      targetUserId: string;
      updates: any;
    }): Promise<any> => {
      const response = await apiClient.patch("/nicknames", {
        groupId,
        setterUserId,
        targetUserId,
        ...updates,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({
        queryKey: nicknameKeys.group(data.group_id),
      });
    },
  });
};

export const useDeleteNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      setterUserId,
      targetUserId,
    }: {
      groupId: string;
      setterUserId: string;
      targetUserId: string;
    }): Promise<void> => {
      await apiClient.delete("/nicknames", {
        data: { groupId, setterUserId, targetUserId },
      });
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.group(groupId) });
    },
  });
};

export const useUpsertNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nicknameData: any): Promise<any> => {
      const response = await apiClient.post("/nicknames/upsert", nicknameData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({
        queryKey: nicknameKeys.group(data.group_id),
      });
    },
  });
};

// ==========================================
// EVENTS (Group Scoped)
// ==========================================

export const useGroupEvents = (groupId: string) => {
  return useQuery({
    queryKey: eventKeys.group(groupId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get(`/groups/${groupId}/events`);
      return response.data || [];
    },
    enabled: !!groupId,
  });
};

export const useUpcomingGroupEvents = (groupId: string) => {
  return useQuery({
    queryKey: eventKeys.upcoming(groupId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get(
        `/groups/${groupId}/events/upcoming`,
      );
      return response.data || [];
    },
    enabled: !!groupId,
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async (): Promise<any | null> => {
      const response = await apiClient.get(`/events/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: any): Promise<any> => {
      const response = await apiClient.post("/events", eventData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({
        queryKey: eventKeys.group(data.group_id),
      });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: any;
    }): Promise<any> => {
      const response = await apiClient.patch(`/events/${id}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: eventKeys.group(data.group_id),
      });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// ==========================================
// NOTIFICATIONS (Settings)
// ==========================================

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
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
};
