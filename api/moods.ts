import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateMood,
  CreateUserGroupMood,
  Mood,
  UpdateMood,
  UserGroupMood,
  UserGroupMoodWithMood
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const moodKeys = {
  all: ['moods'] as const,
  lists: () => [...moodKeys.all, 'list'] as const,
  list: (filters: string) => [...moodKeys.lists(), { filters }] as const,
  details: () => [...moodKeys.all, 'detail'] as const,
  detail: (id: number) => [...moodKeys.details(), id] as const,
};

export const userGroupMoodKeys = {
  all: ['user-group-moods'] as const,
  user: (userId: string, groupId?: string) => [...userGroupMoodKeys.all, 'user', userId, groupId || 'global'] as const,
  group: (groupId: string) => [...userGroupMoodKeys.all, 'group', groupId] as const,
};

// Queries
export const useMoods = () => {
  return useQuery({
    queryKey: moodKeys.lists(),
    queryFn: async (): Promise<Mood[]> => {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .order('text');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMood = (id: number) => {
  return useQuery({
    queryKey: moodKeys.detail(id),
    queryFn: async (): Promise<Mood | null> => {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useMoodByText = (text: string) => {
  return useQuery({
    queryKey: [...moodKeys.lists(), { text }],
    queryFn: async (): Promise<Mood | null> => {
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('text', text)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!text,
  });
};

// Mutations
export const useCreateMood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (moodData: CreateMood): Promise<Mood> => {
      const { data, error } = await supabase
        .from('moods')
        .insert(moodData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodKeys.all });
    },
  });
};

export const useUpdateMood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateMood }): Promise<Mood> => {
      const { data, error } = await supabase
        .from('moods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: moodKeys.all });
      queryClient.invalidateQueries({ queryKey: moodKeys.detail(data.id) });
    },
  });
};

export const useDeleteMood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from('moods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moodKeys.all });
    },
  });
};

// User Group Mood Queries
export const useUserGroupMood = (userId: string, groupId?: string) => {
  return useQuery({
    queryKey: userGroupMoodKeys.user(userId, groupId),
    queryFn: async (): Promise<UserGroupMoodWithMood | null> => {
      let query = supabase
        .from('user_group_moods')
        .select(`
          *,
          mood:moods(*)
        `)
        .eq('user_id', userId);
      
      // group_id filtresi: NULL ise global, değilse spesifik grup
      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.is('group_id', null);
      }
      
      const { data, error } = await query.single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!userId,
  });
};

// Seçili grup için tüm kullanıcıların mood'ları
export const useGroupUserMoods = (groupId: string) => {
  return useQuery({
    queryKey: userGroupMoodKeys.group(groupId),
    queryFn: async (): Promise<UserGroupMoodWithMood[]> => {
      // Seçili grup için mood'lar + global mood'lar (group_id IS NULL)
      const { data, error } = await supabase
        .from('user_group_moods')
        .select(`
          *,
          mood:moods(*),
          user:users(*)
        `)
        .or(`group_id.eq.${groupId},group_id.is.null`)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

// User Group Mood Mutations
export const useSetUserGroupMood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userGroupMoodData: CreateUserGroupMood): Promise<UserGroupMood> => {
      // Composite key için upsert: user_id ve group_id
      const conflictColumns = userGroupMoodData.group_id 
        ? 'user_id,group_id' 
        : 'user_id';
      
      const { data, error } = await supabase
        .from('user_group_moods')
        .upsert(userGroupMoodData, {
          onConflict: conflictColumns
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.all });
      queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.user(data.user_id, data.group_id) });
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.group(data.group_id) });
      }
    },
  });
};

export const useRemoveUserGroupMood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, groupId }: { userId: string; groupId?: string }): Promise<void> => {
      let query = supabase
        .from('user_group_moods')
        .delete()
        .eq('user_id', userId);
      
      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.is('group_id', null);
      }
      
      const { error } = await query;
      
      if (error) throw error;
    },
    onSuccess: (_, { userId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.all });
      queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.user(userId, groupId) });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.group(groupId) });
      }
    },
  });
};

// Realtime Subscription Hooks
export const useMoodsRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['moods-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('moods-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'moods',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: moodKeys.all });
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

// Seçili grup için realtime subscription
export const useGroupMoodsRealtime = (groupId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['group-moods-realtime', groupId],
    queryFn: () => {
      const channel = supabase
        .channel(`group-moods-changes-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_group_moods',
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.group(groupId) });
            queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.all });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_group_moods',
            filter: 'group_id=is.null', // Global mood'lar da dinlenmeli
          },
          () => {
            queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.group(groupId) });
            queryClient.invalidateQueries({ queryKey: userGroupMoodKeys.all });
          }
        )
        .subscribe();

      return channel;
    },
    enabled: !!groupId,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
