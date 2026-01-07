import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateUser, UpdateUser, User } from "../types/database";
import { supabase } from "./supabase";

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, "current"] as const,
};

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("display_name");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<User | null> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCurrentUser = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<User | null> => {
      // Session kontrolü
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Eğer kullanıcı bulunamadıysa (PGRST116), database trigger henüz çalışmamış olabilir
        if (error.code === "PGRST116") {
          return null;
        }
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ useCurrentUser: Error:", errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    },
    // Session kontrolü queryFn içinde yapılıyor, enabled her zaman true
    enabled: true,
    // ÖNEMLİ: Network durumu ne olursa olsun çalıştır (Simülatör/Offline için kritik)
    networkMode: "always",
    retry: (failureCount, error: any) => {
      // PGRST116 hatası için retry yap (database trigger henüz çalışmamış olabilir)
      if (error?.code === "PGRST116" && failureCount < 3) {
        return true;
      }
      if (error?.code === "PGRST116" && failureCount >= 3) {
        const userNotFoundError = new Error(
          "User not found in database after retries"
        );
        (userNotFoundError as any).code = "USER_NOT_FOUND";
        (userNotFoundError as any).originalError = error;
        throw userNotFoundError;
      }
      // Diğer hatalar için daha az retry
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
  });
};

export const useUserByCustomId = (customUserId: string) => {
  return useQuery({
    queryKey: [...userKeys.details(), "custom", customUserId],
    queryFn: async (): Promise<User | null> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("custom_user_id", customUserId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!customUserId,
  });
};

// Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUser): Promise<User> => {
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateUser;
    }): Promise<User> => {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        // Kullanıcı bulunamadıysa (DB'den silinmişse), özel error code ile throw et
        // AuthContext bu hatayı yakalayıp logout yapacak
        if (error.code === "PGRST116") {
          const userNotFoundError = new Error("User not found in database");
          (userNotFoundError as any).code = "USER_NOT_FOUND";
          (userNotFoundError as any).originalError = error;
          throw userNotFoundError;
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateUserAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      avatar,
    }: {
      userId: string;
      avatar: string | null;
    }): Promise<User> => {
      const { data, error } = await supabase
        .from("users")
        .update({ avatar })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const userNotFoundError = new Error("User not found in database");
          (userNotFoundError as any).code = "USER_NOT_FOUND";
          (userNotFoundError as any).originalError = error;
          throw userNotFoundError;
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
};

// Realtime Subscription Hook
export const useUsersRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["users-realtime"],
    queryFn: () => {
      const channel = supabase
        .channel("users-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "users",
          },
          () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
          }
        )
        .subscribe();

      return channel;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const { error } = await supabase
        .from("users")
        .update({ has_completed_onboarding: true })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      // 1. Invalidate queries so they refetch
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      // 2. Directly update the cache for the current user to ensure immediate UI reflection
      // This prevents the race condition where _layout redirects back to onboarding because the refetch hasn't finished
      queryClient.setQueryData(
        userKeys.current(),
        (oldData: User | null | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            has_completed_onboarding: true,
          };
        }
      );

      queryClient.setQueryData(
        userKeys.detail(userId),
        (oldData: User | null | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            has_completed_onboarding: true,
          };
        }
      );
    },
  });
};
