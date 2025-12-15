import { useTheme } from '@/contexts/ThemeContext';
import { Slot } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import Provider from './Provider';

function RootLayoutContent() {
    const { isDark, colors } = useTheme();

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
                translucent
            />
            {/* Slot, index.tsx veya yönlendirilen diğer sayfaları render eder */}
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