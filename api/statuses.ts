import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateStatus,
    CreateUserStatus,
    Status,
    UpdateStatus,
    UserStatus,
    UserStatusWithStatus
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const statusKeys = {
  all: ['statuses'] as const,
  lists: () => [...statusKeys.all, 'list'] as const,
  list: (filters: string) => [...statusKeys.lists(), { filters }] as const,
  details: () => [...statusKeys.all, 'detail'] as const,
  detail: (id: number) => [...statusKeys.details(), id] as const,
  custom: (ownerId: string) => [...statusKeys.all, 'custom', ownerId] as const,
  default: () => [...statusKeys.all, 'default'] as const,
};

export const userStatusKeys = {
  all: ['user-statuses'] as const,
  user: (userId: string) => [...userStatusKeys.all, 'user', userId] as const,
};

// Status Queries
export const useStatuses = () => {
  return useQuery({
    queryKey: statusKeys.lists(),
    queryFn: async (): Promise<Status[]> => {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .order('text');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useDefaultStatuses = () => {
  return useQuery({
    queryKey: statusKeys.default(),
    queryFn: async (): Promise<Status[]> => {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('is_custom', false)
        .order('text');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCustomStatuses = (ownerId: string) => {
  return useQuery({
    queryKey: statusKeys.custom(ownerId),
    queryFn: async (): Promise<Status[]> => {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('is_custom', true)
        .eq('owner_id', ownerId)
        .order('text');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerId,
  });
};

export const useStatus = (id: number) => {
  return useQuery({
    queryKey: statusKeys.detail(id),
    queryFn: async (): Promise<Status | null> => {
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// User Status Queries
export const useUserStatus = (userId: string) => {
  return useQuery({
    queryKey: userStatusKeys.user(userId),
    queryFn: async (): Promise<UserStatusWithStatus | null> => {
      const { data, error } = await supabase
        .from('user_statuses')
        .select(`
          *,
          status:statuses(*)
        `)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!userId,
  });
};

export const useUsersWithStatuses = () => {
  return useQuery({
    queryKey: [...userStatusKeys.all, 'with-users'],
    queryFn: async (): Promise<UserStatusWithStatus[]> => {
      const { data, error } = await supabase
        .from('user_statuses')
        .select(`
          *,
          status:statuses(*),
          user:users(*)
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Status Mutations
export const useCreateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (statusData: CreateStatus): Promise<Status> => {
      const { data, error } = await supabase
        .from('statuses')
        .insert(statusData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
    },
  });
};

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateStatus }): Promise<Status> => {
      const { data, error } = await supabase
        .from('statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.detail(data.id) });
    },
  });
};

export const useDeleteStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('statuses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
    },
  });
};

// User Status Mutations
export const useSetUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userStatusData: CreateUserStatus): Promise<UserStatus> => {
      const { data, error } = await supabase
        .from('user_statuses')
        .upsert(userStatusData, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
      queryClient.invalidateQueries({ queryKey: userStatusKeys.user(data.user_id) });
    },
  });
};

export const useRemoveUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const { error } = await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
      queryClient.invalidateQueries({ queryKey: userStatusKeys.user(userId) });
    },
  });
};

// Realtime Subscription Hooks
export const useStatusesRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['statuses-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('statuses-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'statuses',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: statusKeys.all });
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

export const useUserStatusesRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['user-statuses-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('user-statuses-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_statuses',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
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
