import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

// Hooks & Contexts
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomStatuses, useDefaultStatuses, useSetUserStatus } from '@/api/statuses';
import { useManageStatusMood } from '@/hooks/useManageStatusMood';

// Components
import AddStatusMoodModal from '@/components/dashboard/AddStatusMoodModal';
import { GeliomButton } from '@/components/shared';

interface StatusSelectorProps {
    groupId: string;
    currentStatusId?: number;
    onAddPress?: () => void;
}

function StatusSelector({ groupId, currentStatusId, onAddPress }: StatusSelectorProps) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);

    // LOCAL STATE: Anında UI tepkisi için
    const [activeId, setActiveId] = useState<number | undefined>(currentStatusId);

    // Prop (Veritabanı) değişirse local state'i senkronize et
    useEffect(() => {
        if (currentStatusId !== undefined) {
            setActiveId(currentStatusId);
        }
    }, [currentStatusId]);

    // Hook'lar
    const { handleAddStatus, checkSubscriptionAndProceed } = useManageStatusMood(groupId);
    const { data: defaultStatuses = [], isLoading: isLoadingDefault } = useDefaultStatuses();
    const { data: customStatuses = [], isLoading: isLoadingCustom } = useCustomStatuses(groupId, user?.id);
    const setStatusMutation = useSetUserStatus();

    const handleStatusSelect = useCallback((status: any) => {
        if (!user) return;

        // 1. UI'ı ANINDA güncelle
        setActiveId(status.id);

        // 2. Mutation'ı tetikle
        setStatusMutation.mutate({
            user_id: user.id,
            group_id: groupId,
            status_id: status.id,
            status_text: status.text,
            status_emoji: status.emoji,
            status_is_custom: status.is_custom,
            status_notifies: status.notifies,
        });
    }, [user, groupId, setStatusMutation]);

    const isLoading = isLoadingDefault || isLoadingCustom;

    // Tüm liste elemanlarını (Butonlar + Ekle butonu) tek bir dizide hazırla
    const allItems = useMemo(() => {
        const all = [...customStatuses, ...defaultStatuses].sort((a, b) => {
            if (a.is_custom && !b.is_custom) return -1;
            if (!a.is_custom && b.is_custom) return 1;
            return a.text.localeCompare(b.text);
        });

        // Ekle butonunu sona ekle
        return [...all, { id: -1, text: 'Ekle', is_custom: false }];
    }, [customStatuses, defaultStatuses]);

    if (isLoading) {
        return <ActivityIndicator size="small" color={colors.primary} />;
    }

    return (
        <View style={styles.container}>
            {/* LegendList yerine ScrollView kullanıyoruz */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            >
                {allItems.map((item) => {
                    // "Ekle" Butonu
                    if (item.id === -1) {
                        return (
                            <View key="add-button" style={styles.buttonWrapper}>
                                <GeliomButton
                                    state="passive"
                                    onPress={() => checkSubscriptionAndProceed(() => setIsModalVisible(true))}
                                    size="small"
                                    layout="icon-only"
                                    icon="add"
                                    style={{ borderColor: colors.stroke, borderWidth: 1, borderStyle: 'dashed' }}
                                />
                            </View>
                        );
                    }

                    // Normal Status Butonu
                    const isSelected = activeId === item.id;

                    return (
                        <View
                            key={item.id.toString()}
                            style={[
                                styles.buttonContainer,
                                isSelected && styles.buttonContainerSelected
                            ]}
                        >
                            {/* Arkaplan Dolgusu */}
                            <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
                                <View style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: colors.secondaryBackground }
                                ]} />
                            </View>

                            <GeliomButton
                                state={isSelected ? 'active' : 'passive'}
                                onPress={() => handleStatusSelect(item)}
                                size="small"
                                layout="icon-left"
                                icon={isSelected ? "radio-button-on" : "radio-button-off"}
                                backgroundColor="transparent"
                                textColor={isSelected ? colors.tertiary : colors.text}
                                textStyle={isSelected ? { fontWeight: 'bold' } : undefined}
                                style={[
                                    styles.button,
                                    { borderColor:isSelected ? colors.primary : 'transparent' }
                                ] as any}
                            >
                                {item.text}
                            </GeliomButton>
                        </View>
                    );
                })}
            </ScrollView>

            <AddStatusMoodModal
                visible={isModalVisible}
                type="status"
                onClose={() => setIsModalVisible(false)}
                onSave={handleAddStatus}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    listContent: {
        paddingLeft: 12,
        paddingRight: 12,
        gap: 12,
        paddingBottom: 8,
    },
    buttonWrapper: {
        marginBottom: 4,
    },
    buttonContainer: {
        marginBottom: 4,
        borderRadius: 12,
    },
    buttonContainerSelected: {
        transform: [{ translateY: 1 }],
    },
    button: {
        minWidth: 100,
        borderRadius: 12,
        borderWidth: 1,
        height: 40,
        zIndex: 2,
        marginBottom: 0,
    },
});

export default React.memo(StatusSelector);