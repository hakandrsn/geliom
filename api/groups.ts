import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateGroup,
  CreateGroupJoinRequest,
  CreateGroupMember,
  Group,
  GroupJoinRequest,
  GroupJoinRequestWithDetails,
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
  joinRequests: (groupId: string) => [...groupKeys.detail(groupId), 'join-requests'] as const,
  myJoinRequests: (userId: string) => [...groupKeys.all, 'join-requests', 'user', userId] as const,
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
      if (!userId) {
        return [];
      }
      
      // Önce kullanıcının gruplarını al
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          group:groups(
            *,
            owner:users!groups_owner_id_fkey(*)
          )
        `)
        .eq('user_id', userId);
      
      if (memberError) {
        console.error('Error fetching user groups:', memberError);
        throw memberError;
      }
      
      if (!memberData || memberData.length === 0) {
        return [];
      }

      // Her grup için üye sayısını al
      const groupIds = memberData.map(item => item.group_id).filter(Boolean) as string[];
      
      if (groupIds.length === 0) {
        return [];
      }
      
      const { data: countData, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);
      
      if (countError) {
        console.error('Error fetching group member counts:', countError);
        throw countError;
      }

      // Üye sayılarını hesapla
      const memberCounts: Record<string, number> = {};
      countData?.forEach(item => {
        if (item.group_id) {
          memberCounts[item.group_id] = (memberCounts[item.group_id] || 0) + 1;
        }
      });

      // Grupları üye sayıları ile birleştir
      const groups = memberData
        .map(item => {
          const group = item.group;
          if (!group) return null;
          return {
            ...group,
            member_count: memberCounts[item.group_id] || 0,
          };
        })
        .filter(Boolean) as unknown as GroupWithOwner[];
      
      return groups;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 dakika - cache'teki veri 5 dk boyunca fresh sayılır, tekrar fetch etmez
    structuralSharing: false, // Her zaman yeni array referansı - context güncellemeleri için gerekli
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
      queryClient.invalidateQueries({ queryKey: groupKeys.members(data.id) });
    },
  });
};

// Transfer group ownership (sadece mevcut owner yapabilir)
export const useTransferGroupOwnership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }): Promise<Group> => {
      const { data, error } = await supabase
        .from('groups')
        .update({ owner_id: newOwnerId })
        .eq('id', groupId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(data.id) });
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
      // Önce grup üyeliğini sil
      const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (memberError) throw memberError;

      // Kullanıcı gruptan atıldığında, group_join_requests'teki approved/rejected kayıtlarını sil
      // Bu sayede kullanıcı tekrar istek atabilir
      const { error: joinRequestError } = await supabase
        .from('group_join_requests')
        .delete()
        .eq('group_id', groupId)
        .eq('requester_id', userId)
        .in('status', ['approved', 'rejected']);

      if (joinRequestError) {
        console.error('Join request temizleme hatası (non-blocking):', joinRequestError);
        // Hata olsa bile devam et (non-blocking)
      } else {
        console.log('✅ Join request kayıtları temizlendi:', { groupId, userId });
      }
    },
    onSuccess: (_, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.joinRequests(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myJoinRequests(userId) });
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

// Group Join Request Queries
export const useGroupJoinRequests = (groupId: string, status?: 'pending' | 'approved' | 'rejected') => {
  return useQuery({
    queryKey: [...groupKeys.joinRequests(groupId), status],
    queryFn: async (): Promise<GroupJoinRequestWithDetails[]> => {
      let query = supabase
        .from('group_join_requests')
        .select(`
          *,
          group:groups(
            *,
            owner:users!groups_owner_id_fkey(*)
          ),
          requester:users!group_join_requests_requester_id_fkey(*)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useMyJoinRequests = (userId: string) => {
  return useQuery({
    queryKey: groupKeys.myJoinRequests(userId),
    queryFn: async (): Promise<GroupJoinRequestWithDetails[]> => {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select(`
          *,
          group:groups(
            *,
            owner:users!groups_owner_id_fkey(*)
          ),
          requester:users!group_join_requests_requester_id_fkey(*)
        `)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Realtime Subscription Hooks for Join Requests
export const useGroupJoinRequestsRealtime = (groupId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['group-join-requests-realtime', groupId],
    queryFn: () => {
      const channel = supabase
        .channel(`group-join-requests-changes-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_join_requests',
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            // Tüm status'ler için query'leri invalidate et
            queryClient.invalidateQueries({ queryKey: groupKeys.joinRequests(groupId) });
            queryClient.invalidateQueries({ queryKey: [...groupKeys.joinRequests(groupId), 'pending'] });
            queryClient.invalidateQueries({ queryKey: [...groupKeys.joinRequests(groupId), 'approved'] });
            queryClient.invalidateQueries({ queryKey: [...groupKeys.joinRequests(groupId), 'rejected'] });
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

export const useMyJoinRequestsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['my-join-requests-realtime', userId],
    queryFn: () => {
      const channel = supabase
        .channel(`my-join-requests-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_join_requests',
            filter: `requester_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: groupKeys.myJoinRequests(userId) });
          }
        )
        .subscribe();

      return channel;
    },
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Group Join Request Mutations
export const useCreateJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateGroupJoinRequest & { invite_code: string }): Promise<GroupJoinRequest> => {
      // RPC fonksiyonunu çağır
      const { data, error } = await supabase.rpc('create_join_request', {
        p_group_id: request.group_id,
        p_requester_id: request.requester_id,
        p_invite_code: request.invite_code,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Bilinmeyen bir hata oluştu');
      }

      // Başarılı işlem sonucunda dönen veriyi formatla
      // RPC'den dönen data.data içinde id, group_id, requester_id, status var
      // Ancak tam GroupJoinRequest objesi için created_at vb. eksik olabilir
      // Bu yüzden basitçe dönen veriyi kullanıyoruz veya tekrar fetch edebiliriz
      // Performans için dönen veriyi kullanıp eksikleri client'ta tamamlayabiliriz
      return {
        ...data.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as GroupJoinRequest;
    },
    onSuccess: async (data) => {
      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: groupKeys.joinRequests(data.group_id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myJoinRequests(data.requester_id) });

      // Bildirim gönder (async, hata olsa bile devam et)
      try {
        // Grup bilgilerini ve sahibini al
        const { data: groupData } = await supabase
          .from('groups')
          .select(`
            name,
            owner_id,
            owner:users!groups_owner_id_fkey(
              id,
              onesignal_player_id
            )
          `)
          .eq('id', data.group_id)
          .single();

        // İstek yapan kullanıcının bilgilerini al
        const { data: requesterData } = await supabase
          .from('users')
          .select('display_name, custom_user_id')
          .eq('id', data.requester_id)
          .single();

        if (groupData?.owner_id && groupData?.name && requesterData) {
          const { sendJoinRequestNotification } = await import('./notifications');
          await sendJoinRequestNotification(
            groupData.owner_id, // Supabase user ID (external_id olarak kullanılacak)
            data.group_id,
            groupData.name,
            requesterData.display_name || requesterData.custom_user_id,
            data.requester_id // Rate limiting için
          );
        }
      } catch (error) {
        console.error('Bildirim gönderme hatası (non-blocking):', error);
      }
    },
  });
};

export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, groupId }: { requestId: string; groupId: string }): Promise<void> => {
      // İsteği onayla
      const { data: request, error: requestError } = await supabase
        .from('group_join_requests')
        .select('requester_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('İstek bulunamadı');

      // Gruba üye ekle
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: request.requester_id,
        });

      if (memberError) throw memberError;

      // İstek durumunu güncelle
      const { error: updateError } = await supabase
        .from('group_join_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;
    },
    onSuccess: async (_, variables) => {
      // İstek bilgilerini al (requester_id için)
      const { data: requestData } = await supabase
        .from('group_join_requests')
        .select('requester_id, group_id')
        .eq('id', variables.requestId)
        .single();

      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: groupKeys.joinRequests(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(variables.groupId) });
      
      // Requester'ın grupları listesini invalidate et (önemli: yeni gruba katıldığı için)
      if (requestData?.requester_id) {
        queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(requestData.requester_id) });
      }

      // Bildirim gönder (async, hata olsa bile devam et)
      try {
        if (!requestData) return;

        // Grup bilgilerini al (owner_id dahil)
        const { data: groupData } = await supabase
          .from('groups')
          .select('name, owner_id')
          .eq('id', requestData.group_id)
          .single();

        if (groupData?.name && groupData?.owner_id && requestData.requester_id) {
          const { sendJoinRequestStatusNotification } = await import('./notifications');
          await sendJoinRequestStatusNotification(
            requestData.requester_id, // Supabase user ID (external_id olarak kullanılacak)
            variables.groupId,
            groupData.name,
            'approved',
            groupData.owner_id // Rate limiting için
          );
        }
      } catch (error) {
        console.error('Bildirim gönderme hatası (non-blocking):', error);
      }
    },
  });
};

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, groupId }: { requestId: string; groupId: string }): Promise<void> => {
      const { error } = await supabase
        .from('group_join_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: groupKeys.joinRequests(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myJoinRequests(variables.groupId) });

      // Bildirim gönder (async, hata olsa bile devam et)
      try {
        // İstek bilgilerini al
        const { data: requestData } = await supabase
          .from('group_join_requests')
          .select('requester_id, group_id')
          .eq('id', variables.requestId)
          .single();

        if (!requestData) return;

        // Grup bilgilerini al (owner_id dahil)
        const { data: groupData } = await supabase
          .from('groups')
          .select('name, owner_id')
          .eq('id', requestData.group_id)
          .single();

        if (groupData?.name && groupData?.owner_id && requestData.requester_id) {
          const { sendJoinRequestStatusNotification } = await import('./notifications');
          await sendJoinRequestStatusNotification(
            requestData.requester_id, // Supabase user ID (external_id olarak kullanılacak)
            variables.groupId,
            groupData.name,
            'rejected',
            groupData.owner_id // Rate limiting için
          );
        }
      } catch (error) {
        console.error('Bildirim gönderme hatası (non-blocking):', error);
      }
    },
  });
};
