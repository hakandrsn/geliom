import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
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
export const useMoods = (groupId?: string) => {
  return useQuery({
    queryKey: [...moodKeys.lists(), groupId || 'all'],
    queryFn: async (): Promise<Mood[]> => {
      let query = supabase.from('moods').select('*');

      if (groupId) {
        // Grup özel mood'lar + default mood'lar (group_id IS NULL)
        query = query.or(`group_id.eq.${groupId},group_id.is.null`);
      }

      const { data, error } = await query.order('text');

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: moodKeys.all });
      // Custom mood oluşturulduysa, o grubun mood'larını da invalidate et
      if (data.group_id) {
        queryClient.invalidateQueries({ queryKey: [...moodKeys.lists(), data.group_id] });
      }
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
      // Önce bu mood'u kullanan kayıtları temizle (Cascade delete simülasyonu)
      const { error: cleanupError } = await supabase
        .from('user_group_moods')
        .delete()
        .eq('mood_id', id);

      if (cleanupError) {
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.error('Mood cleanup error:', errorMessage);
      }

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
    // Realtime updates için refetch ayarları
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Realtime ile güncellendiği için window focus'ta refetch gerekmez
    staleTime: 0, // Her zaman fresh data iste (realtime için önemli)
  });
};

// User Group Mood Mutations
export const useSetUserGroupMood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Optimistic Update: Kullanıcı butona basar basmaz UI'ı güncelle
    onMutate: async (userGroupMoodData: CreateUserGroupMood) => {
      // İlgili query'leri cancel et (refetch'i engelle)
      await queryClient.cancelQueries({ queryKey: userGroupMoodKeys.all });

      // Mevcut cache'i al (rollback için)
      const previousGroupMoods = userGroupMoodData.group_id
        ? queryClient.getQueryData<UserGroupMoodWithMood[]>(userGroupMoodKeys.group(userGroupMoodData.group_id))
        : undefined;
      const previousUserMood = userGroupMoodData.group_id
        ? queryClient.getQueryData<UserGroupMoodWithMood>(userGroupMoodKeys.user(userGroupMoodData.user_id, userGroupMoodData.group_id))
        : undefined;

      // Optimistic update: Mood bilgisini cache'den al ve kullan
      if (userGroupMoodData.group_id) {
        // Eski mood bilgisini bul (mood detayları için)
        const existingMood = previousGroupMoods?.find(m => 
          m.user_id === userGroupMoodData.user_id && m.group_id === userGroupMoodData.group_id
        );

        // Yeni mood bilgisini al
        const moodInfo = await supabase
          .from('moods')
          .select('*')
          .eq('id', userGroupMoodData.mood_id)
          .single();

        const userInfo = await supabase
          .from('users')
          .select('*')
          .eq('id', userGroupMoodData.user_id)
          .single();

        const optimisticData = {
          ...userGroupMoodData,
          updated_at: new Date().toISOString(),
          mood: moodInfo.data || existingMood?.mood || null,
          user: userInfo.data || existingMood?.user_id || null,
        } as UserGroupMoodWithMood;

        // 1. Grup query'sini güncelle
        queryClient.setQueryData<UserGroupMoodWithMood[]>(
          userGroupMoodKeys.group(userGroupMoodData.group_id),
          (old = []) => {
            const filtered = old.filter(
              m => !(m.user_id === userGroupMoodData.user_id && m.group_id === userGroupMoodData.group_id)
            );
            return [...filtered, optimisticData];
          }
        );

        // 2. Kullanıcının kendi query'sini de güncelle
        queryClient.setQueryData<UserGroupMoodWithMood>(
          userGroupMoodKeys.user(userGroupMoodData.user_id, userGroupMoodData.group_id),
          optimisticData
        );
      }

      // Rollback için context döndür
      return { previousGroupMoods, previousUserMood };
    },
    // Başarılı olduğunda gerçek veriyi cache'e koy
    onSuccess: async (data, userGroupMoodData) => {
      if (!userGroupMoodData.group_id) return;

      // Mutation'dan dönen veriyi tam olarak fetch et (mood ve user bilgileriyle)
      const { data: fullData } = await supabase
        .from('user_group_moods')
        .select(`
          *,
          mood:moods(*),
          user:users(*)
        `)
        .eq('user_id', data.user_id)
        .eq('group_id', data.group_id)
        .single();

      if (fullData) {
        // 1. Grup query'sini güncelle (diğer kullanıcılar için)
        queryClient.setQueryData<UserGroupMoodWithMood[]>(
          userGroupMoodKeys.group(userGroupMoodData.group_id),
          (old = []) => {
            const filtered = old.filter(
              m => !(m.user_id === data.user_id && m.group_id === data.group_id)
            );
            return [...filtered, fullData as UserGroupMoodWithMood];
          }
        );

        // 2. Kullanıcının kendi query'sini de güncelle (MoodSelector için)
        queryClient.setQueryData<UserGroupMoodWithMood>(
          userGroupMoodKeys.user(data.user_id, data.group_id),
          fullData as UserGroupMoodWithMood
        );
      }
    },
    // Hata durumunda rollback
    onError: (err, userGroupMoodData, context) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Mood update hatası, rollback yapılıyor:', errorMessage);
      
      if (userGroupMoodData.group_id) {
        // Grup query'sini eski haline döndür
        if (context?.previousGroupMoods) {
          queryClient.setQueryData(
            userGroupMoodKeys.group(userGroupMoodData.group_id),
            context.previousGroupMoods
          );
        }
        // Kullanıcının kendi query'sini eski haline döndür
        if (context?.previousUserMood) {
          queryClient.setQueryData(
            userGroupMoodKeys.user(userGroupMoodData.user_id, userGroupMoodData.group_id),
            context.previousUserMood
          );
        }
      }
    },
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

  React.useEffect(() => {
    if (!groupId) {
      return;
    }

    const channelName = `group-moods-changes-${groupId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_group_moods',
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

          // Direkt cache güncelleme (invalidate'den önce, daha hızlı UI update)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Mood ve user bilgilerini fetch et
            try {
              const { data: moodData } = await supabase
                .from('moods')
                .select('*')
                .eq('id', newRecord.mood_id)
                .single();

              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', newRecord.user_id)
                .single();

              const updatedMood: UserGroupMoodWithMood = {
                ...newRecord,
                mood: moodData || undefined,
                user: userData || undefined,
              } as UserGroupMoodWithMood;

              // Cache'i direkt güncelle
              queryClient.setQueryData<UserGroupMoodWithMood[]>(
                userGroupMoodKeys.group(groupId),
                (old = []) => {
                  if (payload.eventType === 'INSERT') {
                    // Yeni mood ekle
                    return [...old, updatedMood];
                  } else {
                    // Mevcut mood'u güncelle
                    return old.map(m =>
                      m.user_id === updatedMood.user_id &&
                        (m.group_id === updatedMood.group_id || (m.group_id === null && updatedMood.group_id === null))
                        ? updatedMood
                        : m
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
                queryKey: userGroupMoodKeys.group(groupId),
                refetchType: 'active'
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Mood silindi, cache'den kaldır
            queryClient.setQueryData<UserGroupMoodWithMood[]>(
              userGroupMoodKeys.group(groupId),
              (old = []) =>
                old.filter(m =>
                  !(m.user_id === oldRecord.user_id &&
                    (m.group_id === oldRecord.group_id || (m.group_id === null && oldRecord.group_id === null)))
                )
            );
          }
          // Cache direkt güncellendiği için invalidate'e gerek yok
        }
      )
      .subscribe((status, err) => {
        // Sadece hata durumlarında log
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Mood realtime hatası:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Mood realtime timeout');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
};
