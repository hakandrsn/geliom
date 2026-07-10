import React, { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexts & Theme
import { useAppStore } from "@/store/useAppStore";

// API
import { useDashboardRealtime, useGroupDashboardData } from "@/api/dashboard";

// Business Components
import { GroupSummary } from "@/api";
import DashboardEmpty from "@/components/business/DashboardEmpty";
import DashboardHeader from "@/components/business/DashboardHeader";
import DashboardMemberItem from "@/components/business/DashboardMembers";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { spacing } from "@/theme/tokens";

interface DashboardViewProps {
  group: GroupSummary;
}

function DashboardView({ group }: DashboardViewProps) {
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

  // Spinner yerine gerçek yerleşimi taklit eden iskelet göster
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={otherMembers}
        keyExtractor={(item) => item.userId}
        // Bounce kapalı; üye yoksa scroll da gereksiz — her şey ekrana sığar
        bounces={false}
        overScrollMode="never"
        scrollEnabled={otherMembers.length > 0}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
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
  listContent: {
    // Liste boşken ListEmptyComponent'in kalan alanı doldurup ortalanabilmesi için
    flexGrow: 1,
  },
});

export default React.memo(DashboardView);
