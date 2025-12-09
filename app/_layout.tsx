import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import Provider from './Provider';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutContent() {
    const { session } = useAuth();
    const { isDark, colors } = useTheme();

    const { isInitialized, isLoading } = useAppInitialization();
    const segments = useSegments();
    const router = useRouter();
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    // 1. Onboarding Kontrolü
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const value = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');
                setHasSeenOnboarding(value === 'true');
            } catch (e) {
                console.error(e);
            } finally {
                setOnboardingChecked(true);
            }
        };
        checkOnboarding();
    }, []);

    // 2. Routing Mantığı
    useEffect(() => {
        // Veriler hazır değilse hiçbir şey yapma
        if (!isInitialized || isLoading || !onboardingChecked) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === 'onboarding';
        const isRoot =segments.length as any === 0;
        console.log("segments:", segments);
        // A. Eğer onboarding görülmediyse -> Onboarding'e gönder
        // (Login olmuş olsa bile onboarding'i görmediyse görmeli)
        if (!hasSeenOnboarding) {
            if (!inOnboarding) {
                router.replace('/onboarding');
            }
            return; // Buradan sonraki kontrolleri yapma, onboarding'de kal
        }

        // B. Onboarding görüldüyse ve session yoksa -> Login'e gönder
        if (hasSeenOnboarding && !session && !inAuthGroup) {
            router.replace('/(auth)/login');
            return;
        }

        // C. Session varsa VE Onboarding görüldüyse -> Home'a gönder
        // (Düzeltme: hasSeenOnboarding kontrolü eklendi)
        if (session && hasSeenOnboarding && (inAuthGroup || inOnboarding || isRoot)) {
            router.replace('/(drawer)/home');
        }

    }, [session, isInitialized, isLoading, segments, onboardingChecked, hasSeenOnboarding, router]);

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            <Slot />
        </>
    );
}

export default function RootLayout() {
    return (
        <Provider>
            <RootLayoutContent />
        </Provider>
    );
}