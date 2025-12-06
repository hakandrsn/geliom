import { useUserGroups } from '@/api/groups';
import { useAuth } from '@/contexts/AuthContext';
import { Session } from '@supabase/supabase-js';

export interface AppInitializationState {
  isInitialized: boolean;
  isLoading: boolean;
  session: Session | null;
  hasGroups: boolean;
  error: Error | null;
}

/**
 * App'in başlangıcında tüm kritik verileri yükler.
 * AuthContext'ten session ve user bilgilerini alır,
 * groups gibi ek verileri de yükler.
 * 
 * @returns {AppInitializationState} Initialization durumu
 */
export const useAppInitialization = (): AppInitializationState => {
  // AuthContext'ten session ve user bilgilerini al
  const { session, user, isLoading: authLoading } = useAuth();

  // Kullanıcının gruplarını yükle (user varsa)
  // Not: useUserGroups içinde zaten enabled kontrolü var (userId varsa)
  const { 
    data: groups = [], 
    isLoading: isGroupsLoading, 
    error: groupsError 
  } = useUserGroups(user?.id || '');

  // Genel loading durumu
  // 1. Auth loading bitmeli
  // 2. Session varsa user yüklenmeli (session var ama user yok ise bekle)
  // 3. Session ve user varsa gruplar yüklenmeli
  const isLoading = authLoading || (session && !user) || (session && user ? isGroupsLoading : false);

  // Genel hata durumu
  const error = groupsError || null;

  // Initialization tamamlandı mı?
  // Loading bitmeli ve hata olmamalı
  const isInitialized = !isLoading && !error;

  return {
    isInitialized,
    isLoading,
    session,
    hasGroups: groups.length > 0,
    error: error as Error | null,
  };
};

