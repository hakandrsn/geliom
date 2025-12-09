import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Dashboard için birleşik veri tipi (SQL ile birebir uyumlu)
export interface DashboardMember {
    user_id: string;
    display_name: string;
    photo_url: string | null;
    custom_user_id: string;
    is_owner: boolean;
    // Status
    status_id: number | null;
    status_text: string | null;
    status_emoji: string | null;
    status_is_custom: boolean | null;
    status_notifies: boolean | null;
    // Mood
    mood_id: number | null;
    mood_text: string | null;
    mood_emoji: string | null;
    // Other
    nickname: string | null;
}

export const dashboardKeys = {
    group: (groupId: string) => ['dashboard-data', groupId] as const,
};

// 1. TEK SEFERDE TÜM DATAYI ÇEKEN HOOK
export const useGroupDashboardData = (groupId: string) => {
    return useQuery({
        queryKey: dashboardKeys.group(groupId),
        queryFn: async (): Promise<DashboardMember[]> => {
            const { data, error } = await supabase.rpc('get_group_dashboard_data', {
                p_group_id: groupId,
            });

            if (error) throw error;
            return data || [];
        },
        enabled: !!groupId,
        staleTime: Infinity, // Realtime güncelleyeceği için stale olmasına gerek yok
    });
};

// 2. REALTIME LISTENER (Kendi datanı DİNLEMEZ)
export const useDashboardRealtime = (groupId: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (!groupId || !user) return;

        const channel = supabase.channel(`dashboard-realtime-${groupId}`)
            // Status Değişiklikleri
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_statuses',
                },
                async (payload) => {
                    const newRecord = payload.new as any;

                    // CRITICAL: Kendi değişikliğimi yoksay (Optimistic update zaten yaptı)
                    if (newRecord.user_id === user.id) return;

                    // Sadece ilgili grup veya global status (group_id null ise)
                    const isRelevant = newRecord.group_id === groupId || newRecord.group_id === null;
                    if (!isRelevant) return;

                    // Status detaylarını çek
                    const { data: statusData } = await supabase
                        .from('statuses')
                        .select('id, text, emoji, is_custom, notifies')
                        .eq('id', newRecord.status_id)
                        .single();

                    if (statusData) {
                        updateMemberInCache(queryClient, groupId, newRecord.user_id, {
                            status_id: statusData.id,
                            status_text: statusData.text,
                            status_emoji: statusData.emoji,
                            status_is_custom: statusData.is_custom,
                            status_notifies: statusData.notifies
                        });
                    }
                }
            )
            // Mood Değişiklikleri
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_group_moods',
                },
                async (payload) => {
                    const newRecord = payload.new as any;

                    // CRITICAL: Kendi değişikliğimi yoksay
                    if (newRecord.user_id === user.id) return;

                    const isRelevant = newRecord.group_id === groupId || newRecord.group_id === null;
                    if (!isRelevant) return;

                    const { data: moodData } = await supabase
                        .from('moods')
                        .select('id, text, emoji')
                        .eq('id', newRecord.mood_id)
                        .single();

                    if (moodData) {
                        updateMemberInCache(queryClient, groupId, newRecord.user_id, {
                            mood_id: moodData.id,
                            mood_text: moodData.text,
                            mood_emoji: moodData.emoji
                        });
                    }
                }
            )
            // Nickname Değişiklikleri
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'nicknames',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    const newRecord = payload.new as any;
                    // Sadece benim koyduğum nickname'ler beni ilgilendirir
                    if (newRecord.setter_user_id !== user.id) return;

                    updateMemberInCache(queryClient, groupId, newRecord.target_user_id, {
                        nickname: newRecord.nickname
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, user, queryClient]);
};

// Cache güncelleme yardımcısı
function updateMemberInCache(queryClient: any, groupId: string, userId: string, updates: Partial<DashboardMember>) {
    queryClient.setQueryData(dashboardKeys.group(groupId), (oldData: DashboardMember[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(member =>
            member.user_id === userId ? { ...member, ...updates } : member
        );
    });
}