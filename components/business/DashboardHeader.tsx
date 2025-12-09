import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography } from "@/components/shared";
import { groupTypeSelector } from "@/utils/group-type-selector";
import type { GroupWithOwner } from "@/types/database";
import type { DashboardMember } from "@/api/dashboard";

// Components
import CurrentUserHeader from "@/components/dashboard/CurrentUserHeader";
import StatusSelector from "@/components/dashboard/StatusSelector";
import MoodSelector from "@/components/dashboard/MoodSelector";

interface DashboardHeaderProps {
    myMemberData?: DashboardMember;
    group: GroupWithOwner;
    otherMemberLength: number;
}

export default function DashboardHeader({ myMemberData, group, otherMemberLength }: DashboardHeaderProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.headerContainer}>
            {/* 1. Benim Kartım */}
            {myMemberData && (
                <View style={styles.paddedSection}>
                    <CurrentUserHeader member={myMemberData} />
                </View>
            )}

            {/* 2. Status Selector */}
            <StatusSelector
                groupId={group.id}
                currentStatusId={myMemberData?.status_id || undefined}
            />

            {/* 3. Mood Selector */}
            <MoodSelector
                groupId={group.id}
                currentMoodId={myMemberData?.mood_id || undefined}
            />

            {/* 4. Alt Bölüm Başlığı */}
            <View style={styles.paddedSection}>
                <Typography variant="h5" color={colors.text} style={styles.sectionTitle}>
                    {groupTypeSelector(group.type)} ({otherMemberLength})
                </Typography>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        marginBottom: 8,
    },
    paddedSection: {
        paddingHorizontal: 8,
    },
    sectionTitle: {
        marginBottom: 4,
        marginLeft: 4,
        marginTop: 20,
    },
});