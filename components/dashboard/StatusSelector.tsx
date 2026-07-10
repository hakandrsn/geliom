import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

// Hooks & Contexts
import {
  applySavedOrder,
  useCustomStatuses,
  useDefaultStatuses,
  useSetUserStatus,
  useStatusOrder,
} from "@/api";
import { useManageStatusMood } from "@/hooks/useManageStatusMood";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";

// Components
import { StatusMoodBottomSheet } from "@/components/bottomsheets";
import { Chip, Skeleton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";

interface StatusSelectorProps {
  groupId: string;
  currentStatusId?: string | number;
  onAddPress?: () => void;
}

function StatusSelector({
  groupId,
  currentStatusId,
  onAddPress,
}: StatusSelectorProps) {
  const user = useAppStore((state) => state.user);
  // Kendi mevcut status kaydım — mood'u ezmemek için seçimde korunur
  const myStatus = useAppStore((state) =>
    user ? state.session?.group.statuses[user.id] : undefined,
  );
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  // LOCAL STATE: Anında UI tepkisi için
  const [activeId, setActiveId] = useState<string | number | undefined>(
    currentStatusId,
  );

  // Prop (Veritabanı) değişirse local state'i senkronize et
  useEffect(() => {
    setActiveId(currentStatusId);
  }, [currentStatusId]);

  // Hook'lar
  const { handleAddStatus, checkSubscriptionAndProceed } =
    useManageStatusMood(groupId);
  const { data: defaultStatuses = [], isLoading: isLoadingDefault } =
    useDefaultStatuses();
  const { data: customStatuses = [], isLoading: isLoadingCustom } =
    useCustomStatuses(groupId, user?.id);
  const { data: statusOrder = [] } = useStatusOrder(user?.id, groupId);
  const setStatusMutation = useSetUserStatus();

  const handleStatusSelect = useCallback(
    (status: any) => {
      if (!user) return;

      // 1. UI'ı ANINDA güncelle
      setActiveId(status.id);

      // 2. Socket üzerinden paylaş — mevcut mood (ve emojisi) korunur
      setStatusMutation.mutate({
        text: status.text,
        emoji: status.emoji ?? myStatus?.emoji ?? undefined,
        mood: myStatus?.mood ?? undefined,
      });
    },
    [user, setStatusMutation, myStatus],
  );

  const isLoading = isLoadingDefault || isLoadingCustom;

  // Kullanıcının kaydettiği sıralama uygulanır; sıralama yoksa
  // custom'lar önce, sonra alfabetik
  const allStatuses = useMemo(() => {
    const sorted = [...customStatuses, ...defaultStatuses].sort((a, b) => {
      if (a.is_custom && !b.is_custom) return -1;
      if (!a.is_custom && b.is_custom) return 1;
      return a.text.localeCompare(b.text);
    });
    return applySavedOrder(sorted, statusOrder);
  }, [customStatuses, defaultStatuses, statusOrder]);

  if (isLoading) {
    return (
      <View style={styles.skeletonRow}>
        {[110, 90, 100, 84].map((w, i) => (
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
        {allStatuses.map((item) => (
          <Chip
            key={item.id.toString()}
            label={item.text}
            emoji={item.emoji}
            // Yerel seçim yoksa store'daki mevcut status metniyle eşleştir
            selected={
              activeId !== undefined
                ? activeId === item.id
                : item.text === myStatus?.text
            }
            onPress={() => handleStatusSelect(item)}
          />
        ))}

        <Chip
          dashed
          icon="add"
          label="Ekle"
          onPress={() =>
            checkSubscriptionAndProceed(() =>
              openBottomSheet(
                <StatusMoodBottomSheet
                  type="status"
                  onSave={async (text, emoji) => {
                    await handleAddStatus(text, emoji);
                    closeBottomSheet();
                  }}
                  onCancel={closeBottomSheet}
                />,
                { snapPoints: ["55%"] },
              ),
            )
          }
        />
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

export default React.memo(StatusSelector);
