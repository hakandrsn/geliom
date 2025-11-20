import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MutedNotification } from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const mutedKeys = {
  all: ['muted-notifications'] as const,
  user: (userId: string) => [...mutedKeys.all, 'user', userId] as const,
  check: (muterUserId: string, mutedUserId: string) => 
    [...mutedKeys.all, 'check', muterUserId, mutedUserId] as const,
};

// Queries
export const useMutedNotifications = (userId: string) => {
  return useQuery({
    queryKey: mutedKeys.user(userId),
    queryFn: async (): Promise<MutedNotification[]> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('*')
        .eq('muter_user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useIsMuted = (muterUserId: string, mutedUserId: string) => {
  return useQuery({
    queryKey: mutedKeys.check(muterUserId, mutedUserId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .select('muted_user_id')
        .eq('muter_user_id', muterUserId)
        .eq('muted_user_id', mutedUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!(muterUserId && mutedUserId),
  });
};

// Mutations
export const useMuteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ muterUserId, mutedUserId }: { muterUserId: string; mutedUserId: string }): Promise<MutedNotification> => {
      const { data, error } = await supabase
        .from('muted_notifications')
        .insert({ muter_user_id: muterUserId, muted_user_id: mutedUserId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mutedKeys.all });
      queryClient.invalidateQueries({ queryKey: mutedKeys.user(data.muter_user_id) });
      queryClient.invalidateQueries({ queryKey: mutedKeys.check(data.muter_user_id, data.muted_user_id) });
    },
  });
};

export const useUnmuteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ muterUserId, mutedUserId }: { muterUserId: string; mutedUserId: string }): Promise<void> => {
      const { error } = await supabase
        .from('muted_notifications')
        .delete()
        .eq('muter_user_id', muterUserId)
        .eq('muted_user_id', mutedUserId);
      
      if (error) throw error;
    },
    onSuccess: (_, { muterUserId, mutedUserId }) => {
      queryClient.invalidateQueries({ queryKey: mutedKeys.all });
      queryClient.invalidateQueries({ queryKey: mutedKeys.user(muterUserId) });
      queryClient.invalidateQueries({ queryKey: mutedKeys.check(muterUserId, mutedUserId) });
    },
  });
};

export const useToggleMuteUser = () => {
  const queryClient = useQueryClient();
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  
  return useMutation({
    mutationFn: async ({ muterUserId, mutedUserId, isCurrentlyMuted }: { 
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

