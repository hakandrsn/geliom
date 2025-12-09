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
import { dashboardKeys, DashboardMember } from "@/api/dashboard"; // Dashboard key'ini buradan alıyoruz

// ... (Mevcut Query Keys - Değişmedi)
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

// ... (Mevcut Okuma Query'leri - Değişmedi)
export const useStatuses = () => {
    return useQuery({
        queryKey: statusKeys.lists(),
        queryFn: async (): Promise<Status[]> => {
            const { data, error } = await supabase.from('statuses').select('*').order('text');
            if (error) throw error;
            return data || [];
        },
    });
};

export const useDefaultStatuses = () => {
    return useQuery({
        queryKey: statusKeys.default(),
        queryFn: async (): Promise<Status[]> => {
            const { data, error } = await supabase.from('statuses').select('*').eq('is_custom', false).is('group_id', null).order('text');
            if (error) throw error;
            return data || [];
        },
    });
};

export const useCustomStatuses = (groupId: string, ownerId?: string) => {
    return useQuery({
        queryKey: statusKeys.custom(groupId, ownerId),
        queryFn: async (): Promise<Status[]> => {
            let query = supabase.from('statuses').select('*').eq('is_custom', true).eq('group_id', groupId);
            if (ownerId) query = query.eq('owner_id', ownerId);
            const { data, error } = await query.order('text');
            if (error) throw error;
            return data || [];
        },
        enabled: !!groupId,
    });
};

// --- OPTIMIZED MUTATION ---

// Optimistic update için UI'ın ihtiyaç duyduğu ekstra alanlar
type SetStatusVariables = CreateUserStatus & {
    // Bu alanlar DB'ye gitmeyecek, sadece Cache'i güncellemek için
    status_text?: string;
    status_emoji?: string | null;
    status_is_custom?: boolean;
    status_notifies?: boolean;
};

export const useSetUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // 1. Optimistic Update: Butona basıldığı an çalışır
        onMutate: async (variables: SetStatusVariables) => {
            // Sadece grup içindeki değişikliği önemsiyoruz (Dashboard için)
            if (variables.group_id) {
                const dashboardKey = dashboardKeys.group(variables.group_id);

                // Olası çakışmaları önlemek için gelen refetch'leri iptal et
                await queryClient.cancelQueries({ queryKey: dashboardKey });

                // Mevcut datayı sakla (hata olursa geri dönmek için)
                const previousDashboardData = queryClient.getQueryData<DashboardMember[]>(dashboardKey);

                // Cache'i MANUEL olarak güncelle
                queryClient.setQueryData(dashboardKey, (old: DashboardMember[] | undefined) => {
                    if (!old) return [];
                    return old.map((member) => {
                        if (member.user_id === variables.user_id) {
                            return {
                                ...member,
                                status_id: variables.status_id,
                                status_text: variables.status_text || null,
                                status_emoji: variables.status_emoji || null,
                                status_is_custom: variables.status_is_custom || false,
                                status_notifies: variables.status_notifies || false,
                            };
                        }
                        return member;
                    });
                });

                // Context olarak eski datayı döndür
                return { previousDashboardData, dashboardKey };
            }
        },

        // 2. Hata Olursa: Eski datayı geri yükle
        onError: (err, variables, context) => {
            if (context?.dashboardKey && context?.previousDashboardData) {
                queryClient.setQueryData(context.dashboardKey, context.previousDashboardData);
            }
            console.error("Status update error:", err);
        },

        // 3. Her Durumda (Başarı/Hata):
        onSettled: (data, error, variables) => {
            // Opsiyonel: Verinin tutarlılığından emin olmak için arka planda yenile
            // if (variables.group_id) {
            //    queryClient.invalidateQueries({ queryKey: dashboardKeys.group(variables.group_id) });
            // }
        },

        // 4. Asıl API İsteği
        mutationFn: async (variables: SetStatusVariables): Promise<UserStatus> => {
            // Optimistic update için eklediğimiz UI alanlarını ayıkla, DB'ye sadece saf data gitsin
            const { status_text, status_emoji, status_is_custom, status_notifies, ...dbData } = variables;

            // Upsert işlemi (Varsa güncelle, yoksa ekle)
            const conflictColumns = dbData.group_id ? 'user_id,group_id' : 'user_id';
            const { data, error } = await supabase
                .from('user_statuses')
                .upsert(dbData, { onConflict: conflictColumns })
                .select()
                .single();

            if (error) throw error;

            // Bildirim Gönderme Mantığı (Eski kodunuzdan korundu)
            if (data.group_id && status_notifies) {
                try {
                    const { data: members } = await supabase
                        .from('group_members')
                        .select('user_id')
                        .eq('group_id', data.group_id)
                        .neq('user_id', data.user_id);

                    if (members && members.length > 0) {
                        const receiverIds = members.map(m => m.user_id);
                        const scheduledAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 dk debounce

                        await supabase.from('pending_notifications').upsert({
                            sender_id: data.user_id,
                            receiver_ids: receiverIds,
                            group_id: data.group_id,
                            status_id: data.status_id,
                            scheduled_at: scheduledAt,
                        }, { onConflict: 'sender_id,group_id' });
                    }
                } catch (e) {
                    console.error('Notification error (non-blocking):', e);
                }
            }

            return data;
        },
    });
};

// ... (CreateStatus, DeleteStatus gibi admin mutationları)
export const useCreateStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (statusData: CreateStatus): Promise<Status> => {
            const { data, error } = await supabase.from('statuses').insert(statusData).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: statusKeys.all });
            if (data.group_id) queryClient.invalidateQueries({ queryKey: statusKeys.custom(data.group_id) });
        },
    });
};

export const useDeleteStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await supabase.from('user_statuses').delete().eq('status_id', id); // Cleanup
            const { error } = await supabase.from('statuses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: statusKeys.all });
        },
    });
};