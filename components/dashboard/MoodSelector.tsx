import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

// Hooks & Contexts
import {
  applySavedOrder,
  useMoodOrder,
  useMoods,
  useSetUserStatus,
} from "@/api";
import { useManageStatusMood } from "@/hooks/useManageStatusMood";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";

// Components
import { StatusMoodBottomSheet } from "@/components/bottomsheets";
import { Chip, Skeleton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";

interface MoodSelectorProps {
  groupId: string;
  currentMoodId?: string | number;
  onAddPress?: () => void;
}

function MoodSelector({
  groupId,
  currentMoodId,
  onAddPress,
}: MoodSelectorProps) {
  const user = useAppStore((state) => state.user);
  // Custom mood ekleme API'de admin (grup sahibi) + premium gerektirir —
  // "Ekle" chip'i yalnızca grup sahibine gösterilir
  const isOwner = useAppStore(
    (state) =>
      state.groups.find((g) => g.id === groupId)?.ownerId === state.user?.id,
  );
  // Kendi mevcut status kaydım — status metnini ezmemek için seçimde korunur
  const myStatus = useAppStore((state) =>
    user ? state.session?.group.statuses[user.id] : undefined,
  );
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  // LOCAL STATE: Anında UI tepkisi için
  const [activeId, setActiveId] = useState<string | number | undefined>(
    currentMoodId,
  );

  useEffect(() => {
    setActiveId(currentMoodId);
  }, [currentMoodId]);

  // Hook'lar
  const { handleAddMood, checkSubscriptionAndProceed } =
    useManageStatusMood(groupId);
  const { data: allMoods = [], isLoading } = useMoods(groupId);
  const { data: moodOrder = [] } = useMoodOrder(user?.id, groupId);
  const setStatusMutation = useSetUserStatus();

  const handleMoodSelect = useCallback(
    (mood: any) => {
      if (!user) return;

      setActiveId(mood.id);

      // Socket üzerinden paylaş — mevcut status metni korunur,
      // status yoksa text alanına mood adı yazılır (text zorunlu alan)
      setStatusMutation.mutate({
        text: myStatus?.text || mood.text,
        emoji: mood.emoji ?? undefined,
        mood: mood.mood,
      });
    },
    [user, setStatusMutation, myStatus],
  );

  // Kullanıcının kaydettiği sıralama uygulanır; sıralama yoksa
  // custom'lar önce, sonra alfabetik
  const sortedMoods = useMemo(() => {
    const sorted = [...allMoods].sort((a, b) => {
      if (a.isCustom && !b.isCustom) return -1;
      if (!a.isCustom && b.isCustom) return 1;
      return a.text.localeCompare(b.text);
    });
    return applySavedOrder(sorted, moodOrder);
  }, [allMoods, moodOrder]);

  if (isLoading) {
    return (
      <View style={styles.skeletonRow}>
        {[96, 88, 104, 80].map((w, i) => (
          <Skeleton key={i} width={w} height={40} radius={radius.full} />
        ))}
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {sortedMoods.map((item) => (
          <Chip
            key={item.id.toString()}
            label={item.text}
            emoji={item.emoji ?? undefined}
            // Yerel seçim yoksa store'daki mevcut mood key'iyle eşleştir
            selected={
              activeId !== undefined
                ? activeId === item.id
                : item.mood === myStatus?.mood
            }
            onPress={() => handleMoodSelect(item)}
          />
        ))}

        {isOwner && (
          <Chip
            dashed
            icon="add"
            label="Ekle"
            onPress={() =>
              checkSubscriptionAndProceed(() =>
                openBottomSheet(
                  <StatusMoodBottomSheet
                    type="mood"
                    onSave={async (text, emoji) => {
                      await handleAddMood(text, emoji);
                      closeBottomSheet();
                    }}
                    onCancel={closeBottomSheet}
                  />,
                  { snapPoints: ["50%"] },
                ),
              )
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
  },
});

export default React.memo(MoodSelector);
