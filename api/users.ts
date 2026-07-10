import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { userKeys } from "./keys";
import { FindUserResponse, User } from "./types";

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
    queryFn: async (): Promise<FindUserResponse> => {
      const response = await apiClient.get(`/users/by-custom-id/${customId}`);
      return response.data;
    },
    enabled: !!customId,
  });
};

// Mutations

/** PATCH /users/me — rate limit 10/dk; değişiklik üyesi olunan gruplara canlı yansır. */
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

export const useUpdateUserAvatar = () => {
  const updateUser = useUpdateUser();
  return {
    ...updateUser,
    mutateAsync: async (avatarUrl: string | null) => {
      return updateUser.mutateAsync({ photoUrl: avatarUrl || undefined });
    },
  };
};

/**
 * DELETE /users/me — hesabı kalıcı siler (sahibi olunan gruplar silinir).
 * Rate limit: 1/saat.
 */
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
