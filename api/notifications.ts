import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateMutedNotification,
    MutedNotification
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  muted: () => [...notificationKeys.all, 'muted'] as const,
  mutedBy: (muterId: string) => [...notificationKeys.muted(), 'by', muterId] as const,
  mutedFor: (mutedId: string) => [...notificationKeys.muted(), 'for', mutedId] as const,
  isMuted: (muterId: string, mutedId: string) => [...notificationKeys.muted(), 'check', muterId, mutedId] as const,
};

// Queries
export const useMutedNotifications = (muterId: string) => {
  return useQuery({
    queryKey: notificationKeys.mutedBy(muterId),
    queryFn: async (): Promise<MutedNotification[]> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('*')
        .eq('muter_user_id', muterId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!muterId,
  });
};

export const useWhoMutedUser = (mutedUserId: string) => {
  return useQuery({
    queryKey: notificationKeys.mutedFor(mutedUserId),
    queryFn: async (): Promise<MutedNotification[]> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('*')
        .eq('muted_user_id', mutedUserId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!mutedUserId,
  });
};

export const useIsMuted = (muterId: string, mutedUserId: string) => {
  return useQuery({
    queryKey: notificationKeys.isMuted(muterId, mutedUserId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('muter_user_id')
        .eq('muter_user_id', muterId)
        .eq('muted_user_id', mutedUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!(muterId && mutedUserId),
  });
};

export const useAllMutedNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.muted(),
    queryFn: async (): Promise<MutedNotification[]> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Mutations
export const useMuteNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (muteData: CreateMutedNotification): Promise<MutedNotification> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .insert(muteData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedBy(data.muter_user_id) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedFor(data.muted_user_id) });
      queryClient.invalidateQueries({ 
        queryKey: notificationKeys.isMuted(data.muter_user_id, data.muted_user_id) 
      });
    },
  });
};

export const useUnmuteNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      muterId, 
      mutedUserId 
    }: { 
      muterId: string; 
      mutedUserId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('muted_notifications')
        .delete()
        .eq('muter_user_id', muterId)
        .eq('muted_user_id', mutedUserId);
      
      if (error) throw error;
    },
    onSuccess: (_, { muterId, mutedUserId }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedBy(muterId) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedFor(mutedUserId) });
      queryClient.invalidateQueries({ 
        queryKey: notificationKeys.isMuted(muterId, mutedUserId) 
      });
    },
  });
};

export const useToggleMuteNotifications = () => {
  const muteNotifications = useMuteNotifications();
  const unmuteNotifications = useUnmuteNotifications();
  
  return useMutation({
    mutationFn: async ({ 
      muterId, 
      mutedUserId, 
      isMuted 
    }: { 
      muterId: string; 
      mutedUserId: string; 
      isMuted: boolean;
    }): Promise<void> => {
      if (isMuted) {
        await unmuteNotifications.mutateAsync({ muterId, mutedUserId });
      } else {
        await muteNotifications.mutateAsync({ 
          muter_user_id: muterId, 
          muted_user_id: mutedUserId 
        });
      }
    },
  });
};

// Bulk Operations
export const useMuteMultipleUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      muterId, 
      mutedUserIds 
    }: { 
      muterId: string; 
      mutedUserIds: string[];
    }): Promise<MutedNotification[]> => {
      const muteData = mutedUserIds.map(mutedUserId => ({
        muter_user_id: muterId,
        muted_user_id: mutedUserId,
      }));

      const { data, error } = await supabase
        .from('muted_notifications')
        .insert(muteData)
        .select();
      
      if (error) throw error;
      return data || [];
    },
    onSuccess: (_, { muterId }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedBy(muterId) });
    },
  });
};

export const useUnmuteAllNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (muterId: string): Promise<void> => {
      const { error } = await supabase
        .from('muted_notifications')
        .delete()
        .eq('muter_user_id', muterId);
      
      if (error) throw error;
    },
    onSuccess: (_, muterId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.mutedBy(muterId) });
    },
  });
};

// Realtime Subscription Hook
export const useMutedNotificationsRealtime = (userId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['muted-notifications-realtime', userId],
    queryFn: () => {
      const channel = supabase
        .channel(`muted-notifications-changes${userId ? `-${userId}` : ''}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'muted_notifications',
            ...(userId && { filter: `muter_user_id=eq.${userId}` }),
          },
          () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            if (userId) {
              queryClient.invalidateQueries({ queryKey: notificationKeys.mutedBy(userId) });
            }
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
