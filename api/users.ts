import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateUser,
    UpdateUser,
    User,
    UserWithMood
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<UserWithMood[]> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          mood:moods(*)
        `)
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<UserWithMood | null> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          mood:moods(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<UserWithMood | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          mood:moods(*)
        `)
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useUserByCustomId = (customUserId: string) => {
  return useQuery({
    queryKey: userKeys.detail(customUserId),
    queryFn: async (): Promise<UserWithMood | null> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          mood:moods(*)
        `)
        .eq('custom_user_id', customUserId)
        .single();
      
      if (error) throw error;
      return data;
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
        .from('users')
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
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUser }): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Realtime Subscription Hook
export const useUsersRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('users-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
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
