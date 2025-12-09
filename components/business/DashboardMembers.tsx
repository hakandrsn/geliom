import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { DashboardMember } from "@/api/dashboard";
import type { GroupWithOwner } from "@/types/database";
import MemberCard from "@/components/dashboard/MemberCard";

interface DashboardMemberItemProps {
    item: DashboardMember;
    group: GroupWithOwner;
}

export default function DashboardMemberItem({ item, group }: DashboardMemberItemProps) {
    const router = useRouter();

    const handleMemberPress = useCallback(() => {
        // Edit sayfasına giderken legacy format gerekli (çünkü o sayfa eski yapıda)
        // Dönüşümü sadece ihtiyaç anında yapıyoruz
        const legacyMemberData = {
            group_id: group.id,
            user_id: item.user_id,
            user: {
                id: item.user_id,
                display_name: item.display_name,
                custom_user_id: item.custom_user_id,
                avatar: item.photo_url
            }
        };

        router.push({
            pathname: '/(drawer)/(group)/edit-member',
            params: {
                memberData: JSON.stringify(legacyMemberData),
            },
        });
    }, [router, item, group.id]);

    return (
        <View style={styles.paddedSection}>
            <MemberCard
                member={item}
                isMe={false}
                onPress={handleMemberPress}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    paddedSection: {
        paddingHorizontal: 8,
    },
});