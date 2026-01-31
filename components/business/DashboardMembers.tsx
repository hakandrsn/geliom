import type { DashboardMember } from "@/api/dashboard";
import MemberCard from "@/components/dashboard/MemberCard";
import type { GroupWithOwner } from "@/types/database";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

interface DashboardMemberItemProps {
  item: DashboardMember;
  group: GroupWithOwner;
}

export default function DashboardMemberItem({
  item,
  group,
}: DashboardMemberItemProps) {
  const router = useRouter();

  const handleMemberPress = useCallback(() => {
    // Edit sayfasına giderken legacy format gerekli (çünkü o sayfa eski yapıda)
    // Dönüşümü sadece ihtiyaç anında yapıyoruz
    const legacyMemberData = {
      group_id: group.id,
      user_id: item.userId,
      user: {
        id: item.userId,
        display_name: item.displayName,
        custom_user_id: item.customId,
        avatar: item.photoUrl,
      },
    };

    router.push({
      pathname: "/(drawer)/(group)/edit-member",
      params: {
        memberData: JSON.stringify(legacyMemberData),
      },
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
    paddingHorizontal: 8,
  },
});
