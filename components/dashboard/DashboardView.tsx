import React, { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Contexts & Theme
import { useAppStore } from "@/store/useAppStore";

// API
import { useGroupDashboardData } from "@/api/dashboard";

// Business Components
import { GroupSummary } from "@/api";
import DashboardEmpty from "@/components/business/DashboardEmpty";
import DashboardHeader from "@/components/business/DashboardHeader";
import DashboardMemberItem from "@/components/business/DashboardMembers";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import PickerDropdown, { type PickerTab } from "@/components/dashboard/PickerDropdown";
import { MOOD_PROMPTS, STATUS_PROMPTS, pickRandom } from "@/constants/prompts";
import { spacing } from "@/theme/tokens";

interface DashboardViewProps {
  group: GroupSummary;
}

function DashboardView({ group }: DashboardViewProps) {
  const user = useAppStore((state) => state.user);
  const insets = useSafeAreaInsets();

  // Yüzen seçenek paneli: hangi sekme, kapsayıcıya göre nerede
  const containerRef = useRef<View>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [picker, setPicker] = useState<{ tab: PickerTab; top: number } | null>(null);
  // Ekrana her gelişte farklı, samimi bir soru
  const [statusPrompt] = useState(() => pickRandom(STATUS_PROMPTS));
  const [moodPrompt] = useState(() => pickRandom(MOOD_PROMPTS));

  const closePicker = useCallback(() => setPicker(null), []);

  const togglePicker = useCallback(
    (tab: PickerTab, anchorBottomY: number) => {
      if (picker?.tab === tab) {
        setPicker(null);
        return;
      }
      containerRef.current?.measureInWindow((_x, containerY) => {
        setPicker({ tab, top: anchorBottomY - containerY + spacing.sm });
      });
    },
    [picker?.tab],
  );

  // 1. TEK KAYNAK: Veriyi çek
  const { data: members, isLoading } = useGroupDashboardData(group.id);

  // Realtime akış: session yaşam döngüsü home'daki useGroupSession'da,
  // patch'ler store'a düşer ve useGroupDashboardData bunu okur.

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
    <View
      ref={containerRef}
      collapsable={false}
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        // Kaydırma başlayınca yüzen panel kapanır (konumu eskir)
        onScrollBeginDrag={closePicker}
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
            activePickerTab={picker?.tab ?? null}
            onTogglePicker={togglePicker}
          />
        }
        // RENDER ITEM: group prop'unu her elemana iletiyoruz!
        renderItem={({ item }) => (
          <DashboardMemberItem item={item} group={group} />
        )}
        // EMPTY STATE: group prop'u burada da gerekli!
        ListEmptyComponent={<DashboardEmpty group={group} />}
      />

      {picker && (
        <PickerDropdown
          tab={picker.tab}
          top={picker.top}
          containerHeight={containerHeight}
          groupId={group.id}
          prompt={picker.tab === "status" ? statusPrompt : moodPrompt}
          onClose={closePicker}
        />
      )}
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
