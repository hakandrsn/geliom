import { BaseLayout, Typography } from "@/components/shared";
import MemberProfile from "@/components/business/MemberProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function MemberProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { groupId, userId } = useLocalSearchParams<{ groupId?: string; userId?: string }>();

  return (
    <BaseLayout header={{
      leftIcon: {
        icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
        onPress: () => router.back(),
      },
      title: <Typography variant="h5" color={colors.text}>Nasıl gidiyor?</Typography>,
    }}>
      <MemberProfile groupId={typeof groupId === "string" ? groupId : ""}
        userId={typeof userId === "string" ? userId : ""} />
    </BaseLayout>
  );
}
