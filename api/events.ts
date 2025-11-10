import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateScheduledEvent,
    ScheduledEvent,
    ScheduledEventWithDetails,
    UpdateScheduledEvent
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: string) => [...eventKeys.lists(), { filters }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  group: (groupId: string) => [...eventKeys.all, 'group', groupId] as const,
  user: (userId: string) => [...eventKeys.all, 'user', userId] as const,
  upcoming: (groupId: string) => [...eventKeys.group(groupId), 'upcoming'] as const,
};

// Queries
export const useGroupEvents = (groupId: string) => {
  return useQuery({
    queryKey: eventKeys.group(groupId),
    queryFn: async (): Promise<ScheduledEventWithDetails[]> => {
      const { data, error } = await supabase
        .from('scheduled_events')
        .select(`
          *,
          group:groups(*),
          creator:users(*)
        `)
        .eq('group_id', groupId)
        .order('event_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useUpcomingGroupEvents = (groupId: string) => {
  return useQuery({
    queryKey: eventKeys.upcoming(groupId),
    queryFn: async (): Promise<ScheduledEventWithDetails[]> => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('scheduled_events')
        .select(`
          *,
          group:groups(*),
          creator:users(*)
        `)
        .eq('group_id', groupId)
        .gte('event_time', now)
        .order('event_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useUserCreatedEvents = (userId: string) => {
  return useQuery({
    queryKey: eventKeys.user(userId),
    queryFn: async (): Promise<ScheduledEventWithDetails[]> => {
      const { data, error } = await supabase
        .from('scheduled_events')
        .select(`
          *,
          group:groups(*),
          creator:users(*)
        `)
        .eq('creator_id', userId)
        .order('event_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async (): Promise<ScheduledEventWithDetails | null> => {
      const { data, error } = await supabase
        .from('scheduled_events')
        .select(`
          *,
          group:groups(*),
          creator:users(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Kullanıcının dahil olduğu tüm gruplardaki eventleri getir
export const useUserGroupsEvents = (userId: string) => {
  return useQuery({
    queryKey: [...eventKeys.all, 'user-groups', userId],
    queryFn: async (): Promise<ScheduledEventWithDetails[]> => {
      // Önce kullanıcının dahil olduğu grupları al
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      
      if (groupsError) throw groupsError;
      
      if (!userGroups || userGroups.length === 0) return [];
      
      const groupIds = userGroups.map(g => g.group_id);
      
      // Bu gruplardaki eventleri al
      const { data, error } = await supabase
        .from('scheduled_events')
        .select(`
          *,
          group:groups(*),
          creator:users(*)
        `)
        .in('group_id', groupIds)
        .order('event_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: CreateScheduledEvent): Promise<ScheduledEvent> => {
      const { data, error } = await supabase
        .from('scheduled_events')
        .insert(eventData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.group(data.group_id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.user(data.creator_id) });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: UpdateScheduledEvent;
    }): Promise<ScheduledEvent> => {
      const { data, error } = await supabase
        .from('scheduled_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.group(data.group_id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.user(data.creator_id) });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('scheduled_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
};

// Realtime Subscription Hooks
export const useGroupEventsRealtime = (groupId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['group-events-realtime', groupId],
    queryFn: () => {
      const channel = supabase
        .channel(`group-events-changes-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scheduled_events',
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.group(groupId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.upcoming(groupId) });
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

export const useEventsRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['events-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('events-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scheduled_events',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
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
