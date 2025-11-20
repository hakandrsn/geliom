import { useGroupMoodsRealtime } from "@/api/moods";
import { useGroupStatusesRealtime } from "@/api/statuses";
import { DashboardView, EmptyStateView } from "@/components/dashboard";
import { BaseLayout } from "@/components/shared";
import { useGroupContext } from "@/contexts/GroupContext";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
    const { selectedGroup, isLoading } = useGroupContext();
    const { colors } = useTheme();

    // Seçili grup için realtime subscription'ları başlat
    // Bu hooklar arka planda Supabase listener'larını yönetir
    // selectedGroup değiştiğinde otomatik olarak yeni grubu dinlemeye başlar
    useGroupStatusesRealtime(selectedGroup?.id || '');
    useGroupMoodsRealtime(selectedGroup?.id || '');

    // Loading durumu
    if (isLoading) {
        return (
            <BaseLayout headerShow={false}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </BaseLayout>
        );
    }

    return (
        <BaseLayout
            headerShow={false} // Drawer navigation kendi header'ını kullanıyor (GroupHeader sayesinde)
            backgroundColor={colors.background}
        >
            {selectedGroup ? (
                // Bir grup seçiliyse Dashboard'u göster
                <DashboardView group={selectedGroup} />
            ) : (
                // Grup yoksa veya seçilmediyse Empty State göster
                <EmptyStateView />
            )}
        </BaseLayout>
    );
}