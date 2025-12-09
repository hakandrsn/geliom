import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateMood,
    CreateUserGroupMood,
    Mood,
    UpdateMood,
    UserGroupMood
} from '../types/database';
import { supabase } from './supabase';
import { dashboardKeys, DashboardMember } from "@/api/dashboard";

export const moodKeys = {
    all: ['moods'] as const,
    lists: () => [...moodKeys.all, 'list'] as const,
    details: () => [...moodKeys.all, 'detail'] as const,
    detail: (id: number) => [...moodKeys.details(), id] as const,
};

export const useMoods = (groupId?: string) => {
    return useQuery({
        queryKey: [...moodKeys.lists(), groupId || 'all'],
        queryFn: async (): Promise<Mood[]> => {
            let query = supabase.from('moods').select('*');
            if (groupId) {
                query = query.or(`group_id.eq.${groupId},group_id.is.null`);
            }
            const { data, error } = await query.order('text');
            if (error) throw error;
            return data || [];
        },
    });
};

// --- OPTIMIZED MUTATION ---

type SetMoodVariables = CreateUserGroupMood & {
    // UI güncellemesi için gerekli ekstra alanlar
    mood_text?: string;
    mood_emoji?: string | null;
};

export const useSetUserGroupMood = () => {
    const queryClient = useQueryClient();

    return useMutation({
        onMutate: async (variables: SetMoodVariables) => {
            if (variables.group_id) {
                const dashboardKey = dashboardKeys.group(variables.group_id);

                await queryClient.cancelQueries({ queryKey: dashboardKey });

                const previousDashboardData = queryClient.getQueryData<DashboardMember[]>(dashboardKey);

                // Optimistic Update: Cache'i anında güncelle
                queryClient.setQueryData(dashboardKey, (old: DashboardMember[] | undefined) => {
                    if (!old) return [];
                    return old.map((member) => {
                        if (member.user_id === variables.user_id) {
                            return {
                                ...member,
                                mood_id: variables.mood_id,
                                mood_text: variables.mood_text || null,
                                mood_emoji: variables.mood_emoji || null,
                            };
                        }
                        return member;
                    });
                });

                return { previousDashboardData, dashboardKey };
            }
        },

        onError: (err, variables, context) => {
            if (context?.dashboardKey && context?.previousDashboardData) {
                queryClient.setQueryData(context.dashboardKey, context.previousDashboardData);
            }
            console.error("Mood update error:", err);
        },

        mutationFn: async (variables: SetMoodVariables): Promise<UserGroupMood> => {
            const { mood_text, mood_emoji, ...dbData } = variables;

            const conflictColumns = dbData.group_id ? 'user_id,group_id' : 'user_id';
            const { data, error } = await supabase
                .from('user_group_moods')
                .upsert(dbData, { onConflict: conflictColumns })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
    });
};

// ... (Create/Delete Mood admin fonksiyonları)
export const useCreateMood = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (moodData: CreateMood): Promise<Mood> => {
            const { data, error } = await supabase.from('moods').insert(moodData).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moodKeys.all });
            if (data.group_id) queryClient.invalidateQueries({ queryKey: [...moodKeys.lists(), data.group_id] });
        },
    });
};

export const useDeleteMood = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await supabase.from('user_group_moods').delete().eq('mood_id', id);
            const { error } = await supabase.from('moods').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: moodKeys.all });
        },
    });
};