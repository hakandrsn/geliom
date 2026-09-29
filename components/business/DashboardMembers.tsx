import type { DashboardMember } from "@/api/dashboard";
import type { GroupSummary } from "@/api/types";
import MemberCard from "@/components/dashboard/MemberCard";
import { layout } from "@/theme/tokens";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

interface DashboardMemberItemProps {
  item: DashboardMember;
  group: GroupSummary;
}

export default function DashboardMemberItem({
  item,
  group,
}: DashboardMemberItemProps) {
  const router = useRouter();

  const handleMemberPress = useCallback(() => {
    router.push({
      pathname: "/(drawer)/(group)/edit-member",
      params: { groupId: group.id, userId: item.userId },
    });
  }, [router, item, group.id]);

  return (
    <View style={styles.paddedSection}>
      <MemberCard member={item} isMe={false} onPress={handleMemberPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  paddedSection: {
    paddingHorizontal: layout.screenPadding,
  },
});
