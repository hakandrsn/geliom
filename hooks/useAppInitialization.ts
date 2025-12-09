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
 * * @returns {AppInitializationState} Initialization durumu
 */
export const useAppInitialization = (): AppInitializationState => {
    // AuthContext'ten session ve user bilgilerini al
    const { session, user, isLoading: authLoading } = useAuth();

    // Kullanıcının gruplarını yükle (user varsa)
    const {
        data: groups = [],
        isLoading: isGroupsLoading,
        error: groupsError
    } = useUserGroups(user?.id || '');

    // DÜZELTME: Genel loading durumu
    // Eski hali: const isLoading = authLoading || (session && !user) || (session && user ? isGroupsLoading : false);
    // Yeni hali: Eğer authLoading bittiyse (false ise), user null olsa bile loading'i durdurmalıyız.
    // Aksi takdirde profil yüklenemezse uygulama sonsuz döngüde kalır.

    const isLoading = authLoading || (session && user ? isGroupsLoading : false);

    // Genel hata durumu
    const error = groupsError || null;

    // Initialization tamamlandı mı?
    // Loading bitmeli. Hata olması init'i durdurmaz (UI'da hata gösterilir)
    const isInitialized = !isLoading;

    return {
        isInitialized,
        isLoading,
        session,
        hasGroups: groups.length > 0,
        error: error as Error | null,
    };
};