import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
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
  custom: (groupId: string, ownerId?: string) => [...statusKeys.all, 'custom', groupId, ownerId || 'all'] as const,
  default: () => [...statusKeys.all, 'default'] as const,
};

export const userStatusKeys = {
  all: ['user-statuses'] as const,
  user: (userId: string, groupId?: string) => [...userStatusKeys.all, 'user', userId, groupId || 'global'] as const,
  group: (groupId: string) => [...userStatusKeys.all, 'group', groupId] as const,
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
        .is('group_id', null) // Default status'ler group_id = NULL olmalı
        .order('text');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCustomStatuses = (groupId: string, ownerId?: string) => {
  return useQuery({
    queryKey: statusKeys.custom(groupId, ownerId),
    queryFn: async (): Promise<Status[]> => {
      let query = supabase
        .from('statuses')
        .select('*')
        .eq('is_custom', true)
        .eq('group_id', groupId);

      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data, error } = await query.order('text');

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
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
export const useUserStatus = (userId: string, groupId?: string) => {
  return useQuery({
    queryKey: userStatusKeys.user(userId, groupId),
    queryFn: async (): Promise<UserStatusWithStatus | null> => {
      let query = supabase
        .from('user_statuses')
        .select(`
          *,
          status:statuses(*)
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

// Seçili grup için tüm kullanıcıların status'ları
export const useGroupUserStatuses = (groupId: string) => {
  return useQuery({
    queryKey: userStatusKeys.group(groupId),
    queryFn: async (): Promise<UserStatusWithStatus[]> => {
      // Seçili grup için status'lar + global status'lar (group_id IS NULL)
      const { data, error } = await supabase
        .from('user_statuses')
        .select(`
          *,
          status:statuses(*),
          user:users(*)
        `)
        .or(`group_id.eq.${groupId},group_id.is.null`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
    // Realtime updates için refetch ayarları
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Realtime ile güncellendiği için window focus'ta refetch gerekmez
    staleTime: 0, // Her zaman fresh data iste (realtime için önemli)
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      // Custom status oluşturulduysa, o grubun custom status'lerini de invalidate et
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: statusKeys.custom(data.group_id) });
      }
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
      // Önce bu status'u kullanan kayıtları temizle (Cascade delete simülasyonu)
      const { error: cleanupError } = await supabase
        .from('user_statuses')
        .delete()
        .eq('status_id', id);

      if (cleanupError) {
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.error('Status cleanup error:', errorMessage);
        // RLS veya başka bir hata olabilir, ama ana silme işlemini denemeye devam edelim
      }

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
    // Optimistic Update: Kullanıcı butona basar basmaz UI'ı güncelle
    onMutate: async (userStatusData: CreateUserStatus) => {
      // İlgili query'leri cancel et (refetch'i engelle)
      await queryClient.cancelQueries({ queryKey: userStatusKeys.all });

      // Mevcut cache'i al (rollback için)
      const previousGroupStatuses = userStatusData.group_id
        ? queryClient.getQueryData<UserStatusWithStatus[]>(userStatusKeys.group(userStatusData.group_id))
        : undefined;
      const previousUserStatus = userStatusData.group_id
        ? queryClient.getQueryData<UserStatusWithStatus>(userStatusKeys.user(userStatusData.user_id, userStatusData.group_id))
        : undefined;

      // Optimistic update: Status bilgisini cache'den al ve kullan
      if (userStatusData.group_id) {
        // Eski status bilgisini bul (status detayları için)
        const existingStatus = previousGroupStatuses?.find(s => 
          s.user_id === userStatusData.user_id && s.group_id === userStatusData.group_id
        );

        // Yeni status bilgisini al
        const statusInfo = await supabase
          .from('statuses')
          .select('*')
          .eq('id', userStatusData.status_id)
          .single();

        const userInfo = await supabase
          .from('users')
          .select('*')
          .eq('id', userStatusData.user_id)
          .single();

        const optimisticData = {
          ...userStatusData,
          updated_at: new Date().toISOString(),
          status: statusInfo.data || existingStatus?.status || null,
          user: userInfo.data || existingStatus?.user || null,
        } as UserStatusWithStatus;

        // 1. Grup query'sini güncelle
        queryClient.setQueryData<UserStatusWithStatus[]>(
          userStatusKeys.group(userStatusData.group_id),
          (old = []) => {
            const filtered = old.filter(
              s => !(s.user_id === userStatusData.user_id && s.group_id === userStatusData.group_id)
            );
            return [...filtered, optimisticData];
          }
        );

        // 2. Kullanıcının kendi query'sini de güncelle
        queryClient.setQueryData<UserStatusWithStatus>(
          userStatusKeys.user(userStatusData.user_id, userStatusData.group_id),
          optimisticData
        );
      }

      // Rollback için context döndür
      return { previousGroupStatuses, previousUserStatus };
    },
    // Başarılı olduğunda gerçek veriyi cache'e koy
    onSuccess: async (data, userStatusData) => {
      if (!userStatusData.group_id) return;

      // Mutation'dan dönen veriyi tam olarak fetch et (status ve user bilgileriyle)
      const { data: fullData } = await supabase
        .from('user_statuses')
        .select(`
          *,
          status:statuses(*),
          user:users(*)
        `)
        .eq('user_id', data.user_id)
        .eq('group_id', data.group_id)
        .single();

      if (fullData) {
        // 1. Grup query'sini güncelle (diğer kullanıcılar için)
        queryClient.setQueryData<UserStatusWithStatus[]>(
          userStatusKeys.group(userStatusData.group_id),
          (old = []) => {
            const filtered = old.filter(
              s => !(s.user_id === data.user_id && s.group_id === data.group_id)
            );
            return [...filtered, fullData as UserStatusWithStatus];
          }
        );

        // 2. Kullanıcının kendi query'sini de güncelle (StatusSelector için)
        queryClient.setQueryData<UserStatusWithStatus>(
          userStatusKeys.user(data.user_id, data.group_id),
          fullData as UserStatusWithStatus
        );
      }
    },
    // Hata durumunda rollback
    onError: (err, userStatusData, context) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Status update hatası, rollback yapılıyor:', errorMessage);
      
      if (userStatusData.group_id) {
        // Grup query'sini eski haline döndür
        if (context?.previousGroupStatuses) {
          queryClient.setQueryData(
            userStatusKeys.group(userStatusData.group_id),
            context.previousGroupStatuses
          );
        }
        // Kullanıcının kendi query'sini eski haline döndür
        if (context?.previousUserStatus) {
          queryClient.setQueryData(
            userStatusKeys.user(userStatusData.user_id, userStatusData.group_id),
            context.previousUserStatus
          );
        }
      }
    },
    mutationFn: async (userStatusData: CreateUserStatus): Promise<UserStatus> => {
      // Composite key için upsert: user_id ve group_id
      const conflictColumns = userStatusData.group_id
        ? 'user_id,group_id'
        : 'user_id';

      const { data, error } = await supabase
        .from('user_statuses')
        .upsert(userStatusData, {
          onConflict: conflictColumns
        })
        .select()
        .single();

      if (error) throw error;

      // Eğer grup için status değiştirildiyse ve notifies: true ise, pending notification oluştur/güncelle
      // Custom status'ler için de aynı mantık geçerlidir (statuses tablosunda notifies ve messages kontrol edilir)
      if (data.group_id) {
        try {
          // Status bilgisini al (notifies ve messages kontrolü için)
          // Custom status'ler için de messages array'i kullanılabilir
          const { data: statusData } = await supabase
            .from('statuses')
            .select('notifies, messages, is_custom')
            .eq('id', data.status_id)
            .single();

          // notifies: true ise bildirim gönder (custom veya default status fark etmez)
          if (statusData?.notifies) {
            // Grup üyelerini al (kendisi hariç)
            const { data: members } = await supabase
              .from('group_members')
              .select('user_id')
              .eq('group_id', data.group_id)
              .neq('user_id', data.user_id);

            if (members && members.length > 0) {
              const receiverIds = members.map(m => m.user_id);
              const scheduledAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 dakika sonra

              // Pending notification oluştur veya güncelle (sender_id, group_id unique)
              // Bu sayede kullanıcı sürekli status değiştirirse, sadece son status için bildirim gönderilir (debounce)
              const { error: pendingError } = await supabase
                .from('pending_notifications')
                .upsert({
                  sender_id: data.user_id,
                  receiver_ids: receiverIds,
                  group_id: data.group_id,
                  status_id: data.status_id,
                  scheduled_at: scheduledAt,
                }, {
                  onConflict: 'sender_id,group_id'
                });

              if (pendingError) {
                const errorMessage = pendingError instanceof Error ? pendingError.message : String(pendingError);
                console.error('Pending notification hatası:', errorMessage);
                // Hata olsa bile status güncellemesi başarılı sayılır (non-blocking)
              }
            }
          }
        } catch (error) {
          // Android'de Error objesi ile ilgili reflection sorununu önlemek için
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Pending notification işlemi hatası (non-blocking):', errorMessage);
        }
      }

      return data;
    },
  });
};

export const useRemoveUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, groupId }: { userId: string; groupId?: string }): Promise<void> => {
      let query = supabase
        .from('user_statuses')
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
      queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
      queryClient.invalidateQueries({ queryKey: userStatusKeys.user(userId, groupId) });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: userStatusKeys.group(groupId) });
      }
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

// Seçili grup için realtime subscription
export const useGroupStatusesRealtime = (groupId: string) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!groupId) {
      return;
    }

    const channelName = `group-statuses-changes-${groupId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statuses',
          // Filter kaldırıldı: Client-side filtering yapacağız
        },
        async (payload) => {
          // Client-side filtering: Sadece ilgili grup için işle
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // group_id kontrolü: NULL (global) veya seçili grup
          const isRelevant =
            newRecord?.group_id === groupId ||
            newRecord?.group_id === null ||
            oldRecord?.group_id === groupId ||
            oldRecord?.group_id === null;

          if (!isRelevant) {
            return;
          }

          // Direkt cache güncelleme (invalidate'e gerek yok, realtime güncel veriyi veriyor)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Status ve user bilgilerini fetch et
            try {
              const { data: statusData } = await supabase
                .from('statuses')
                .select('*')
                .eq('id', newRecord.status_id)
                .single();

              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', newRecord.user_id)
                .single();

              const updatedStatus: UserStatusWithStatus = {
                ...newRecord,
                status: statusData || undefined,
                user: userData || undefined,
              } as UserStatusWithStatus;

              // Cache'i direkt güncelle
              queryClient.setQueryData<UserStatusWithStatus[]>(
                userStatusKeys.group(groupId),
                (old = []) => {
                  if (payload.eventType === 'INSERT') {
                    // Yeni status ekle
                    return [...old, updatedStatus];
                  } else {
                    // Mevcut status'u güncelle
                    return old.map(s =>
                      s.user_id === updatedStatus.user_id &&
                        (s.group_id === updatedStatus.group_id || (s.group_id === null && updatedStatus.group_id === null))
                        ? updatedStatus
                        : s
                    );
                  }
                }
              );
            } catch (error) {
              // Android'de Error objesi ile ilgili reflection sorununu önlemek için
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('❌ Cache update hatası:', errorMessage);
              // Hata durumunda invalidate et
              queryClient.invalidateQueries({
                queryKey: userStatusKeys.group(groupId),
                refetchType: 'active'
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Status silindi, cache'den kaldır
            queryClient.setQueryData<UserStatusWithStatus[]>(
              userStatusKeys.group(groupId),
              (old = []) =>
                old.filter(s =>
                  !(s.user_id === oldRecord.user_id &&
                    (s.group_id === oldRecord.group_id || (s.group_id === null && oldRecord.group_id === null)))
                )
            );
          }
          // Cache direkt güncellendiği için invalidate'e gerek yok
        }
      )
      .subscribe((status, err) => {
        // Sadece hata durumlarında log
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Status realtime hatası:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Status realtime timeout');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
};
