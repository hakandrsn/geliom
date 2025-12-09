import { createOrUpdateUserProfile, getProviderFromUser, normalizeUserData } from '@/api/provider-auth';
import { supabase } from '@/api/supabase';
import { useCurrentUser, useUpdateUser, userKeys } from '@/api/users';
import { getOneSignalPlayerId, loginOneSignal, logoutOneSignal } from '@/services/onesignal';
import type { User as DatabaseUser } from '@/types/database';
import { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
// eslint-disable-next-line import/no-duplicates
import { useCompleteOnboarding } from '@/api/users';
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext({
    session: null as Session | null,
    user: null as DatabaseUser | null,
    isLoading: true,
    initializeAuth: async () => {},
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<DatabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const completeOnboardingMutation = useCompleteOnboarding();

    // useCurrentUser hook'u
    const {
        data: currentUserProfile,
        refetch: refetchUserProfile,
        error: currentUserError,
        // isLoading: currentUserLoading, // <-- Bunu artık kullanmıyoruz, state çakışması yaratıyor
    } = useCurrentUser();

    const queryClient = useQueryClient();
    const updateUser = useUpdateUser();

    const signOut = useCallback(async () => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('❌ Çıkış hatası:', error);
        } finally {
            setSession(null);
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const initializeAuth = useCallback(async () => {
        try {
            setIsLoading(true); // Yükleme başladı

            // 1. Session kontrolü
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (currentSession) {
                setSession(currentSession);

                // 2. Profil yükleme (Timeout ile)
                // Eğer profil 5sn içinde gelmezse hata fırlat ve catch'e düş
                const fetchProfilePromise = refetchUserProfile();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
                );

                try {
                    await Promise.race([fetchProfilePromise, timeoutPromise]);
                } catch (err) {
                    console.warn('⚠️ Profil yükleme zaman aşımı, devam ediliyor...');
                    // Profil yüklenemedi ama session var.
                    // User null kalacak ama isLoading false olacak.
                    // Bu sayede app açılacak ve _layout.tsx kullanıcıyı login'e atacak (çünkü session var ama user yoksa auth flow bozuk demektir) veya home'a atacak ve home boş görünecek.
                }

            } else {
                setSession(null);
                setUser(null);
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            setSession(null);
            setUser(null);
        } finally {
            setIsLoading(false); // HER DURUMDA yüklemeyi bitir
        }
    }, [refetchUserProfile]); // Dependency array temizlendi

    useEffect(() => {
        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            setSession(currentSession);

            if (currentSession?.user) {
                const supabaseUser = currentSession.user;

                // Onboarding check
                AsyncStorage.getItem('HAS_SEEN_ONBOARDING').then((val) => {
                    if (val === 'true') {
                        supabase.from('users')
                            .update({ has_completed_onboarding: true })
                            .eq('id', currentSession.user.id)
                            .then(({ error }) => {
                                if (error) console.error("Onboarding sync error:", error);
                            });
                    }
                });

                // Profil güncelleme ve OneSignal işlemleri...
                const provider = getProviderFromUser(supabaseUser);
                const normalizedData = normalizeUserData(supabaseUser, provider);

                createOrUpdateUserProfile(normalizedData).catch(console.error);

                loginOneSignal(supabaseUser.id).then(async () => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const playerId = await getOneSignalPlayerId();
                    if (playerId && supabaseUser.id) {
                        updateUser.mutate({ id: supabaseUser.id, updates: { onesignal_player_id: playerId } });
                    }
                }).catch(() => {});

                queryClient.invalidateQueries({ queryKey: userKeys.current() });
            } else {
                setUser(null);
                logoutOneSignal();
                queryClient.removeQueries({ queryKey: userKeys.all });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [queryClient]); // initializeAuth dependency'den çıkarıldı

    // Profil datası geldiğinde state'i güncelle
    useEffect(() => {
        setUser(currentUserProfile || null);
    }, [currentUserProfile]);

    // Kullanıcı silinmişse logout yap
    useEffect(() => {
        const errorCode = (currentUserError as any)?.code;
        if (currentUserError && errorCode === 'USER_NOT_FOUND' && session) {
            signOut();
        }
    }, [currentUserError, session, signOut]);

    // DİKKAT: Eski `useEffect` (isLoading state'ini currentUserLoading'e bağlayan) SİLİNDİ.
    // Bu, initializeAuth'un `setIsLoading(false)` çağrısını eziyordu.

    const value = React.useMemo(() => ({
        session,
        user,
        isLoading,
        initializeAuth,
        signOut
    }), [session, user, isLoading, initializeAuth, signOut]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};