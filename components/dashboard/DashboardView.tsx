import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Contexts & Theme
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// API
import { useDashboardRealtime, useGroupDashboardData } from "@/api/dashboard";
import type { GroupWithOwner } from '@/types/database';

// Business Components
import DashboardHeader from "@/components/business/DashboardHeader";
import DashboardMemberItem from "@/components/business/DashboardMembers";
import DashboardEmpty from "@/components/business/DashboardEmpty";

interface DashboardViewProps {
    group: GroupWithOwner;
}

function DashboardView({ group }: DashboardViewProps) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // 1. TEK KAYNAK: Veriyi çek
    const { data: members, isLoading } = useGroupDashboardData(group.id);

    // 2. REALTIME: Dinle
    useDashboardRealtime(group.id);

    // 3. AYRIŞTIR: Ben ve Diğerleri
    const myMemberInfo = useMemo(() =>
            members?.find(m => m.user_id === user?.id),
        [members, user]
    );

    const otherMembers = useMemo(() =>
            members?.filter(m => m.user_id !== user?.id) || [],
        [members, user]
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={otherMembers}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 20 }
                ]}
                // HEADER: group prop'u burada doğruca geçiliyor
                ListHeaderComponent={
                    <DashboardHeader
                        myMemberData={myMemberInfo}
                        group={group}
                        otherMemberLength={otherMembers.length}
                    />
                }
                // RENDER ITEM: group prop'unu her elemana iletiyoruz!
                renderItem={({ item }) => (
                    <DashboardMemberItem item={item} group={group} />
                )}
                // EMPTY STATE: group prop'u burada da gerekli!
                ListEmptyComponent={<DashboardEmpty group={group} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 0,
        paddingTop: 0,
    },
});

export default React.memo(DashboardView);