import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateNickname,
    Nickname,
    UpdateNickname
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const nicknameKeys = {
  all: ['nicknames'] as const,
  lists: () => [...nicknameKeys.all, 'list'] as const,
  list: (filters: string) => [...nicknameKeys.lists(), { filters }] as const,
  group: (groupId: string) => [...nicknameKeys.all, 'group', groupId] as const,
  user: (userId: string) => [...nicknameKeys.all, 'user', userId] as const,
  specific: (groupId: string, setterUserId: string, targetUserId: string) => 
    [...nicknameKeys.all, 'specific', groupId, setterUserId, targetUserId] as const,
};

// Queries
export const useGroupNicknames = (groupId: string) => {
  return useQuery({
    queryKey: nicknameKeys.group(groupId),
    queryFn: async (): Promise<Nickname[]> => {
      const { data, error } = await supabase
        .from('nicknames')
        .select('*')
        .eq('group_id', groupId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useUserNicknames = (userId: string) => {
  return useQuery({
    queryKey: nicknameKeys.user(userId),
    queryFn: async (): Promise<Nickname[]> => {
      const { data, error } = await supabase
        .from('nicknames')
        .select('*')
        .eq('target_user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useUserSetNicknames = (userId: string) => {
  return useQuery({
    queryKey: [...nicknameKeys.user(userId), 'set'],
    queryFn: async (): Promise<Nickname[]> => {
      const { data, error } = await supabase
        .from('nicknames')
        .select('*')
        .eq('setter_user_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useNickname = (groupId: string, setterUserId: string, targetUserId: string) => {
  return useQuery({
    queryKey: nicknameKeys.specific(groupId, setterUserId, targetUserId),
    queryFn: async (): Promise<Nickname | null> => {
      const { data, error } = await supabase
        .from('nicknames')
        .select('*')
        .eq('group_id', groupId)
        .eq('setter_user_id', setterUserId)
        .eq('target_user_id', targetUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!(groupId && setterUserId && targetUserId),
  });
};

// Mutations
export const useCreateNickname = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nicknameData: CreateNickname): Promise<Nickname> => {
      const { data, error } = await supabase
        .from('nicknames')
        .insert(nicknameData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.group(data.group_id) });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.user(data.target_user_id) });
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
      updates 
    }: { 
      groupId: string; 
      setterUserId: string; 
      targetUserId: string; 
      updates: UpdateNickname;
    }): Promise<Nickname> => {
      const { data, error } = await supabase
        .from('nicknames')
        .update(updates)
        .eq('group_id', groupId)
        .eq('setter_user_id', setterUserId)
        .eq('target_user_id', targetUserId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.group(data.group_id) });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.user(data.target_user_id) });
      queryClient.invalidateQueries({ 
        queryKey: nicknameKeys.specific(data.group_id, data.setter_user_id, data.target_user_id) 
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
      targetUserId 
    }: { 
      groupId: string; 
      setterUserId: string; 
      targetUserId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('nicknames')
        .delete()
        .eq('group_id', groupId)
        .eq('setter_user_id', setterUserId)
        .eq('target_user_id', targetUserId);
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId, targetUserId }) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.user(targetUserId) });
    },
  });
};

// Upsert Nickname (Create or Update)
export const useUpsertNickname = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nicknameData: CreateNickname): Promise<Nickname> => {
      const { data, error } = await supabase
        .from('nicknames')
        .upsert(nicknameData, {
          onConflict: 'group_id,setter_user_id,target_user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.group(data.group_id) });
      queryClient.invalidateQueries({ queryKey: nicknameKeys.user(data.target_user_id) });
      queryClient.invalidateQueries({ 
        queryKey: nicknameKeys.specific(data.group_id, data.setter_user_id, data.target_user_id) 
      });
    },
  });
};

// Realtime Subscription Hook
export const useNicknamesRealtime = (groupId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['nicknames-realtime', groupId],
    queryFn: () => {
      const channel = supabase
        .channel(`nicknames-changes${groupId ? `-${groupId}` : ''}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nicknames',
            ...(groupId && { filter: `group_id=eq.${groupId}` }),
          },
          () => {
            queryClient.invalidateQueries({ queryKey: nicknameKeys.all });
            if (groupId) {
              queryClient.invalidateQueries({ queryKey: nicknameKeys.group(groupId) });
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
