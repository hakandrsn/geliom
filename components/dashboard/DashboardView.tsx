import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexts & Theme
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";

// API
import { useDashboardRealtime, useGroupDashboardData } from "@/api/dashboard";

// Business Components
import { Group } from "@/api";
import DashboardEmpty from "@/components/business/DashboardEmpty";
import DashboardHeader from "@/components/business/DashboardHeader";
import DashboardMemberItem from "@/components/business/DashboardMembers";

interface DashboardViewProps {
  group: Group;
}

function DashboardView({ group }: DashboardViewProps) {
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);
  const insets = useSafeAreaInsets();

  // 1. TEK KAYNAK: Veriyi çek
  const { data: members, isLoading } = useGroupDashboardData(group.id);

  // 2. REALTIME: Dinle
  useDashboardRealtime(group.id);

  // 3. AYRIŞTIR: Ben ve Diğerleri
  const myMemberInfo = useMemo(
    () => members?.find((m) => m.userId === user?.id),
    [members, user],
  );

  const otherMembers = useMemo(
    () => members?.filter((m) => m.userId !== user?.id) || [],
    [members, user],
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
        keyExtractor={(item) => item.userId}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
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
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});

export default React.memo(DashboardView);
