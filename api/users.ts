import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import {
  eventKeys,
  mutedKeys,
  nicknameKeys,
  subscriptionKeys,
  userKeys,
} from "./keys";
import { User } from "./types";
// Import legacy types if needed or redefine.
// MutedNotification was in types/database previously.
// Let's define strictly what we need or import from types if available.
// api/types.ts has NotificationSetting which covers isMuted.
// But MutedNotification in database usually involves muter/muted IDs.
// I will adhere to types/api (api/types.ts) or generic returns.

interface MutedUserResponse {
  muter_user_id: string;
  muted_user_id: string;
  // created_at etc
}

// Subscriptions
interface Subscription {
  id: string;
  user_id: string;
  status: string; // active, past_due, etc.
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// Nicknames (DB type usually)
interface Nickname {
  id: string;
  group_id: string;
  setter_user_id: string; // The user who set the nickname
  target_user_id: string; // The user who has the nickname
  nickname: string;
}

// Queries
export const useCurrentUser = () => {
  const setUser = useAppStore((state) => state.setUser);

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await apiClient.get("/users/me");
        const user = response.data;
        setUser(user);
        return user;
      } catch (error: any) {
        if (error.response?.status === 401) {
          setUser(null);
          return null;
        }
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserByCustomId = (customId: string) => {
  return useQuery({
    queryKey: userKeys.byCustomId(customId),
    queryFn: async (): Promise<{ found: boolean; user?: User }> => {
      const response = await apiClient.get(`/users/by-custom-id/${customId}`);
      return response.data;
    },
    enabled: !!customId,
  });
};

// Subscriptions
export const useUserSubscription = (userId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.user(userId),
    queryFn: async (): Promise<Subscription | null> => {
      const response = await apiClient.get(`/users/${userId}/subscription`);
      return response.data || null;
    },
    enabled: !!userId,
  });
};

export const useCurrentUserSubscription = () => {
  return useQuery({
    queryKey: ["current-user-subscription"], // Could standardize this key
    queryFn: async (): Promise<Subscription | null> => {
      try {
        const response = await apiClient.get("/users/me/subscription");
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
  });
};

export const useIsSubscriptionActive = (userId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.active(userId),
    queryFn: async (): Promise<boolean> => {
      const response = await apiClient.get(
        `/users/${userId}/subscription/active`,
      );
      return !!response.data?.isActive;
    },
    enabled: !!userId,
  });
};

// Muted Notifications
export const useMutedNotifications = (userId: string) => {
  return useQuery({
    queryKey: mutedKeys.user(userId),
    queryFn: async (): Promise<MutedUserResponse[]> => {
      const response = await apiClient.get(`/users/${userId}/muted`);
      return response.data || [];
    },
    enabled: !!userId,
  });
};

export const useIsMuted = (muterUserId: string, mutedUserId: string) => {
  return useQuery({
    queryKey: mutedKeys.check(muterUserId, mutedUserId),
    queryFn: async (): Promise<boolean> => {
      const response = await apiClient.get(
        `/users/${muterUserId}/muted/check/${mutedUserId}`,
      );
      return !!response.data?.isMuted;
    },
    enabled: !!(muterUserId && mutedUserId),
  });
};

// User Nicknames
export const useUserNicknames = (userId: string) => {
  return useQuery({
    queryKey: nicknameKeys.user(userId),
    queryFn: async (): Promise<Nickname[]> => {
      const response = await apiClient.get(`/users/${userId}/nicknames`);
      return response.data || [];
    },
    enabled: !!userId,
  });
};

export const useUserSetNicknames = (userId: string) => {
  return useQuery({
    queryKey: [...nicknameKeys.user(userId), "set"],
    queryFn: async (): Promise<Nickname[]> => {
      const response = await apiClient.get(`/users/${userId}/nicknames/set`);
      return response.data || [];
    },
    enabled: !!userId,
  });
};

// Mutations
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const setUser = useAppStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (updates: {
      displayName?: string;
      photoUrl?: string;
    }): Promise<User> => {
      const response = await apiClient.patch("/users/me", updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      setUser(data);
    },
  });
};

// Onboarding is now local only, so useCompleteOnboarding is removed.

export const useUpdateUserAvatar = () => {
  const updateUser = useUpdateUser();
  return {
    ...updateUser,
    mutateAsync: async (avatarUrl: string | null) => {
      return updateUser.mutateAsync({ photoUrl: avatarUrl || undefined });
    },
  };
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const logout = useAppStore((state) => state.logout);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete("/users/me");
    },
    onSuccess: () => {
      queryClient.clear();
      logout();
    },
  });
};

// Subscription Mutations
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionData: any): Promise<Subscription> => {
      const response = await apiClient.post("/subscriptions", subscriptionData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.user(data.user_id),
      });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: any;
    }): Promise<Subscription> => {
      const response = await apiClient.patch(
        `/users/${userId}/subscription`,
        updates,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.user(data.user_id),
      });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<Subscription> => {
      const response = await apiClient.post(
        `/users/${userId}/subscription/cancel`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.user(data.user_id),
      });
    },
  });
};

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await apiClient.delete(`/users/${userId}/subscription`);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.user(userId),
      });
    },
  });
};

// Mute Mutations
export const useMuteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      muterUserId,
      mutedUserId,
    }: {
      muterUserId: string;
      mutedUserId: string;
    }): Promise<MutedUserResponse> => {
      const response = await apiClient.post("/muted", {
        muterUserId,
        mutedUserId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mutedKeys.all });
      queryClient.invalidateQueries({
        queryKey: mutedKeys.user(data.muter_user_id),
      });
      queryClient.invalidateQueries({
        queryKey: mutedKeys.check(data.muter_user_id, data.muted_user_id),
      });
    },
  });
};

export const useUnmuteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      muterUserId,
      mutedUserId,
    }: {
      muterUserId: string;
      mutedUserId: string;
    }): Promise<void> => {
      await apiClient.delete("/muted", { data: { muterUserId, mutedUserId } });
    },
    onSuccess: (_, { muterUserId, mutedUserId }) => {
      queryClient.invalidateQueries({ queryKey: mutedKeys.all });
      queryClient.invalidateQueries({ queryKey: mutedKeys.user(muterUserId) });
      queryClient.invalidateQueries({
        queryKey: mutedKeys.check(muterUserId, mutedUserId),
      });
    },
  });
};

export const useToggleMuteUser = () => {
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      muterUserId,
      mutedUserId,
      isCurrentlyMuted,
    }: {
      muterUserId: string;
      mutedUserId: string;
      isCurrentlyMuted: boolean;
    }): Promise<void> => {
      if (isCurrentlyMuted) {
        await unmuteUser.mutateAsync({ muterUserId, mutedUserId });
      } else {
        await muteUser.mutateAsync({ muterUserId, mutedUserId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mutedKeys.all });
    },
  });
};

// Events (User Scope)
export const useUserCreatedEvents = (userId: string) => {
  return useQuery({
    queryKey: eventKeys.user(userId),
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get(`/users/${userId}/events`);
      return response.data || [];
    },
    enabled: !!userId,
  });
};

export const useUserGroupsEvents = (userId: string) => {
  return useQuery({
    queryKey: [...eventKeys.all, "user-groups", userId],
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get(`/users/${userId}/groups/events`);
      return response.data || [];
    },
    enabled: !!userId,
  });
};
