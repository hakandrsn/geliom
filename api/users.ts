import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateUser,
  UpdateUser,
  User
} from '../types/database';
import { supabase } from './supabase';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

// Queries
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCurrentUser = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<User | null> => {
      // Session kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('🔵 useCurrentUser: Session yok');
        return null;
      }

      const userId = session.user.id;
      console.log('🔵 useCurrentUser: User profile fetch ediliyor, user ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Eğer kullanıcı bulunamadıysa (PGRST116), database trigger henüz çalışmamış olabilir
        if (error.code === 'PGRST116') {
          console.log('⏳ useCurrentUser: User profile henüz oluşturulmamış, database trigger bekleniyor...');
          return null;
        }
        console.error('❌ useCurrentUser: Error:', error);
        throw error;
      }
      
      console.log('✅ useCurrentUser: User profile bulundu:', data?.id);
      return data;
    },
    // Session kontrolü queryFn içinde yapılıyor, enabled her zaman true
    enabled: true,
    retry: (failureCount, error: any) => {
      // PGRST116 hatası için retry yap (database trigger henüz çalışmamış olabilir)
      if (error?.code === 'PGRST116' && failureCount < 3) {
        return true;
      }
      // Diğer hatalar için retry yapma
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // Exponential backoff (max 2 saniye)
    refetchOnWindowFocus: false, // Window focus'ta refetch yapma
    refetchOnMount: true, // Mount'ta refetch yap
    staleTime: 0, // Her zaman fresh data iste
  });
};

export const useUserByCustomId = (customUserId: string) => {
  return useQuery({
    queryKey: [...userKeys.details(), 'custom', customUserId],
    queryFn: async (): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('custom_user_id', customUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!customUserId,
  });
};

// Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: CreateUser): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUser }): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Realtime Subscription Hook
export const useUsersRealtime = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users-realtime'],
    queryFn: () => {
      const channel = supabase
        .channel('users-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
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
