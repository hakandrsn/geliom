import { GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Share, StyleSheet, View } from "react-native";
import type { GroupWithOwner } from "@/types/database";

interface DashboardEmptyProps {
    group: GroupWithOwner;
}

export default function DashboardEmpty({ group }: DashboardEmptyProps) {
    const { colors } = useTheme();
    const router = useRouter();

    const handleShareInvite = useCallback(async () => {
        try {
            await Share.share({
                message: `${group.name} grubuna katıl!\n\nDavet Kodu: ${group.invite_code}\n\nUygulamayı indir ve bu kodu kullanarak gruba katıl.`,
                title: `${group.name} - Grup Daveti`,
            });
        } catch (error) {
            console.error('Davet paylaşılırken hata oluştu:', error);
        }
    }, [group.name, group.invite_code]);

    return (
        <View style={styles.emptyStateContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tertiary + '30' }]}>
                <Ionicons name="people-outline" size={48} color={colors.primary} />
            </View>

            <Typography variant="body" color={colors.secondaryText} style={styles.emptyStateText}>
                Bu grupta henüz başka kimse yok.
            </Typography>

            <GeliomButton
                state="active"
                size="medium"
                layout="full-width"
                icon="share-social"
                onPress={handleShareInvite}
                style={styles.inviteButton}
            >
                Davet Et
            </GeliomButton>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyStateContainer: {
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyStateText: {
        textAlign: 'center',
        marginBottom: 24,
    },
    inviteButton: {
        maxWidth: 300,
    },
});