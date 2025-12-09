import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// Contexts & Theme
import { useGroupContext } from "@/contexts/GroupContext";
import { useTheme } from "@/contexts/ThemeContext";

// Components
import { DashboardView, EmptyStateView } from "@/components/dashboard";
import { BaseLayout } from "@/components/shared";

// Events Realtime (DashboardView dışında event dinlemek gerekebilir diye bırakıyoruz)
import { useGroupEventsRealtime } from "@/api/events";

export default function HomeScreen() {
    const { selectedGroup, isLoading } = useGroupContext();
    const { colors } = useTheme();

    // Sadece Events için dinleme yapıyoruz.
    // Status ve Mood artık DashboardView -> useDashboardRealtime içinde yönetiliyor.
    useGroupEventsRealtime(selectedGroup?.id || '');

    // İçerik Render Mantığı
    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary}/>
                </View>
            );
        }

        if (selectedGroup) {
            return <DashboardView group={selectedGroup}/>;
        }

        // Grup seçili değilse genel karşılama ekranı
        return <EmptyStateView />;
    };

    return (
        <BaseLayout
            headerShow={false}
            backgroundColor={colors.background}
        >
            {renderContent()}
        </BaseLayout>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});