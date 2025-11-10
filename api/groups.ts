import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateGroup,
    CreateGroupMember,
    Group,
    GroupMember,
    GroupMemberWithUser,
    GroupWithOwner,
    UpdateGroup
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: string) => [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  members: (groupId: string) => [...groupKeys.detail(groupId), 'members'] as const,
  userGroups: (userId: string) => [...groupKeys.all, 'user', userId] as const,
};

// Group Queries
export const useGroups = () => {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async (): Promise<GroupWithOwner[]> => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          owner:users!groups_owner_id_fkey(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useGroup = (id: string) => {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async (): Promise<GroupWithOwner | null> => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          owner:users!groups_owner_id_fkey(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useGroupByInviteCode = (inviteCode: string) => {
  return useQuery({
    queryKey: [...groupKeys.lists(), { inviteCode }],
    queryFn: async (): Promise<GroupWithOwner | null> => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          owner:users!groups_owner_id_fkey(*)
        `)
        .eq('invite_code', inviteCode)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!inviteCode,
  });
};

export const useUserGroups = (userId: string) => {
  return useQuery({
    queryKey: groupKeys.userGroups(userId),
    queryFn: async (): Promise<GroupWithOwner[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:groups(
            *,
            owner:users!groups_owner_id_fkey(*)
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      const groups = data?.map(item => item.group) || [];
      return groups.filter(Boolean) as unknown as GroupWithOwner[];
    },
    enabled: !!userId,
  });
};

// Group Member Queries
export const useGroupMembers = (groupId: string) => {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async (): Promise<GroupMemberWithUser[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('group_id', groupId)
        .order('joined_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useIsGroupMember = (groupId: string, userId: string) => {
  return useQuery({
    queryKey: [...groupKeys.members(groupId), 'check', userId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!(groupId && userId),
  });
};

// Group Mutations
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupData: CreateGroup): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateGroup }): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(data.id) });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
};

// Group Member Mutations
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: CreateGroupMember): Promise<GroupMember> => {
      const { data, error } = await supabase
        .from('group_members')
        .insert(memberData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(data.group_id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(data.user_id) });
    },
  });
};

export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }): Promise<void> => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) });
    },
  });
};

// Realtime Subscription Hooks
export const useGroupsRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['groups-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('groups-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'groups',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.all });
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

export const useGroupMembersRealtime = (groupId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['group-members-realtime', groupId],
    queryFn: () => {
      const channel = supabase
        .channel(`group-members-changes-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
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
