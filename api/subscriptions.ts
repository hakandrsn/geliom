import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateSubscription,
    Subscription,
    UpdateSubscription
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  user: (userId: string) => [...subscriptionKeys.all, 'user', userId] as const,
  active: (userId: string) => [...subscriptionKeys.user(userId), 'active'] as const,
};

// Queries
export const useUserSubscription = (userId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.user(userId),
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!userId,
  });
};

export const useCurrentUserSubscription = () => {
  return useQuery({
    queryKey: ['current-user-subscription'],
    queryFn: async (): Promise<Subscription | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });
};

export const useIsSubscriptionActive = (userId: string) => {
  return useQuery({
    queryKey: subscriptionKeys.active(userId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return false;
      
      // Abonelik süresi kontrol et
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        return expiresAt > now;
      }
      
      return true; // expires_at null ise sınırsız abonelik
    },
    enabled: !!userId,
  });
};

// Mutations
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscriptionData: CreateSubscription): Promise<Subscription> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.user(data.user_id) });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: UpdateSubscription;
    }): Promise<Subscription> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.user(data.user_id) });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<Subscription> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.user(data.user_id) });
    },
  });
};

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.user(userId) });
    },
  });
};

// Realtime Subscription Hook - Sadece kendi aboneliğini dinler
export const useSubscriptionRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['subscription-realtime', userId],
    queryFn: () => {
      const channel = supabase
        .channel(`subscription-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.user(userId) });
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
