import { DashboardMember } from "@/api/dashboard";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import type { GroupWithOwner } from "@/types/database";
import { groupTypeSelector } from "@/utils/group-type-selector";
import { Ionicons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Share, StyleSheet, TouchableOpacity, View } from "react-native";

// Components
import CurrentUserHeader from "@/components/dashboard/CurrentUserHeader";
import MoodSelector from "@/components/dashboard/MoodSelector";
import StatusSelector from "@/components/dashboard/StatusSelector";

interface DashboardHeaderProps {
  myMemberData?: DashboardMember;
  group: GroupWithOwner;
  otherMemberLength: number;
}

export default function DashboardHeader({
  myMemberData,
  group,
  otherMemberLength,
}: DashboardHeaderProps) {
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // Mapping global user to DashboardMember format if myMemberData is incomplete
  const selfMember: DashboardMember = useMemo(
    () => ({
      userId: user?.id || "",
      displayName: myMemberData?.displayName || user?.displayName || "",
      photoUrl: myMemberData?.photoUrl || user?.photoUrl || undefined,
      customId: myMemberData?.customId || user?.customId,
      ...myMemberData,
    }),
    [myMemberData, user],
  );

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `${group.name} grubuna katıl!\n\nDavet Kodu: ${group.invite_code}\n\nUygulamayı indir ve bu kodu kullanarak gruba katıl.`,
        title: `${group.name} - Grup Daveti`,
      });
    } catch (error) {
      console.error("Davet paylaşılırken hata oluştu:", error);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* 0. Top Bar (Group Info & Actions) */}
      <View style={styles.topBar}>
        <View style={styles.titleContainer}>
          <Typography variant="h2" color={colors.text} numberOfLines={1}>
            {group.name}
          </Typography>
          <Typography variant="caption" color={colors.secondaryText}>
            {groupTypeSelector(group.type || "")} • {otherMemberLength + 1} Üye
          </Typography>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleShareInvite}
            style={[
              styles.iconButton,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons
              name="share-social-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={[
              styles.iconButton,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons name="menu-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 1. Benim Kartım */}
      <View style={styles.paddedSection}>
        <CurrentUserHeader member={selfMember} />
      </View>

      {/* 2. Status & Mood Selectors */}
      <View style={styles.selectorsContainer}>
        <StatusSelector
          groupId={group.id}
          currentStatusId={undefined} // Handled by text/emoji matching eventually or store
        />
        <MoodSelector
          groupId={group.id}
          currentMoodId={undefined} // Handled by store or matching
        />
      </View>

      {/* 3. Alt Bölüm Başlığı */}
      <View style={styles.paddedSection}>
        <Typography
          variant="h5"
          color={colors.text}
          style={styles.sectionTitle}
        >
          {groupTypeSelector(group.type || "")} ({otherMemberLength})
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  paddedSection: {
    paddingHorizontal: 8,
  },
  selectorsContainer: {
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 4,
    marginLeft: 4,
    marginTop: 20,
  },
});
