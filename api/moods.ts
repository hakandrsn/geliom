import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMood, Mood, UpdateMood } from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const moodKeys = {
  all: ['moods'] as const,
  lists: () => [...moodKeys.all, 'list'] as const,
  list: (filters: string) => [...moodKeys.lists(), { filters }] as const,
  details: () => [...moodKeys.all, 'detail'] as const,
  detail: (id: number) => [...moodKeys.details(), id] as const,
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

// Realtime Subscription Hook
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
