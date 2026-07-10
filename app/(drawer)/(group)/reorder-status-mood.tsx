import {
  MoodOption as Mood,
  StatusOption as Status,
  statusKeys,
  useCustomStatuses,
  useDefaultStatuses,
  useGroupSession,
  useMoods,
} from "@/api";
import { StatusMoodBottomSheet } from "@/components/bottomsheets";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { IconButton, Skeleton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useManageStatusMood } from "@/hooks/useManageStatusMood";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import {
  getMoodOrder,
  getStatusOrder,
  saveMoodOrder,
  saveStatusOrder,
} from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

/**
 * Sıralama ekranı.
 *
 * NOT: Önceden react-native-draggable-flatlist kullanılıyordu; paket
 * Reanimated 4 ile uyumsuz olduğu için sürükleme hiç tetiklenmiyordu.
 * Yukarı/aşağı ok butonlarıyla deterministik sıralamaya geçildi.
 */
export default function ReorderStatusMoodScreen() {
  const { colors } = useTheme();
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const [activeTab, setActiveTab] = useState<"status" | "mood">("status");
  const [statusOrder, setStatusOrder] = useState<string[]>([]);
  const [moodOrder, setMoodOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Ekran açıkken session'ı canlı tut — custom mood'lar session'dan gelir
  useGroupSession(selectedGroup?.id);

  // Status ve mood verilerini çek
  const { data: defaultStatuses = [] } = useDefaultStatuses();
  const { data: customStatuses = [] } = useCustomStatuses(
    selectedGroup?.id || "",
    user?.id,
  );
  const { data: allMoods = [] } = useMoods(selectedGroup?.id);

  // Management Hook
  const {
    handleAddStatus,
    handleAddMood,
    handleDeleteStatus,
    handleDeleteMood,
    checkSubscriptionAndProceed,
  } = useManageStatusMood(selectedGroup?.id || "");

  // Local storage'dan sıralamayı yükle (kullanıcı + grup başına)
  useEffect(() => {
    const loadOrders = async () => {
      if (user?.id && selectedGroup?.id) {
        const [statusOrderData, moodOrderData] = await Promise.all([
          getStatusOrder(user.id, selectedGroup.id),
          getMoodOrder(user.id, selectedGroup.id),
        ]);
        setStatusOrder(statusOrderData.map(String));
        setMoodOrder(moodOrderData);
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [user?.id, selectedGroup?.id]);

  // Kayıtlı sıralamayı uygula; sıralamada olmayanlar mevcut sırayla sona eklenir
  const applyOrder = <T extends { id: string | number }>(
    items: T[],
    order: string[],
  ): T[] => {
    if (!order.length) return items;
    const ordered: T[] = [];
    order.forEach((id) => {
      const item = items.find((i) => String(i.id) === id);
      if (item) ordered.push(item);
    });
    const rest = items.filter((i) => !order.includes(String(i.id)));
    return [...ordered, ...rest];
  };

  const sortedStatuses = useMemo(
    () => applyOrder([...customStatuses, ...defaultStatuses], statusOrder),
    [customStatuses, defaultStatuses, statusOrder],
  );

  const sortedMoods = useMemo(() => {
    const customs = allMoods.filter((m) => m.isCustom);
    const defaults = allMoods.filter((m) => !m.isCustom);
    return applyOrder([...customs, ...defaults], moodOrder);
  }, [allMoods, moodOrder]);

  // Bir elemanı bir pozisyon yukarı/aşağı taşı
  const moveItem = (index: number, direction: -1 | 1) => {
    const items = activeTab === "status" ? sortedStatuses : sortedMoods;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const ids = items.map((i) => String(i.id));
    [ids[index], ids[target]] = [ids[target], ids[index]];

    if (activeTab === "status") {
      setStatusOrder(ids);
    } else {
      setMoodOrder(ids);
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id || !selectedGroup?.id) return;

    try {
      await Promise.all([
        saveStatusOrder(user.id, selectedGroup.id, statusOrder),
        saveMoodOrder(user.id, selectedGroup.id, moodOrder),
      ]);
      // Seçicilerdeki (StatusSelector/MoodSelector) sıralama query'lerini tazele
      queryClient.invalidateQueries({
        queryKey: statusKeys.order("status", user.id, selectedGroup.id),
      });
      queryClient.invalidateQueries({
        queryKey: statusKeys.order("mood", user.id, selectedGroup.id),
      });
      setHasChanges(false);
      router.back();
    } catch (error) {
      console.error("Sıralama kaydetme hatası:", error);
    }
  };

  const handleOpenBottomSheet = () => {
    checkSubscriptionAndProceed(() => {
      openBottomSheet(
        <StatusMoodBottomSheet
          type={activeTab}
          onSave={async (text, emoji) => {
            if (activeTab === "status") {
              await handleAddStatus(text, emoji);
            } else {
              await handleAddMood(text, emoji || "");
            }
            closeBottomSheet();
          }}
          onCancel={closeBottomSheet}
        />,
        { snapPoints: activeTab === "status" ? ["55%"] : ["50%"] },
      );
    });
  };

  // Ortak satır — zeminsiz, ok butonlarıyla taşınır
  const renderRow = (
    item: Status | Mood,
    index: number,
    total: number,
    isCustom: boolean,
    onDelete: () => void,
  ) => (
    <View
      key={String(item.id)}
      style={[styles.row, { borderBottomColor: colors.stroke }]}
    >
      {item.emoji ? (
        <Typography variant="h6" style={styles.rowEmoji}>
          {item.emoji}
        </Typography>
      ) : null}

      <Typography
        variant="body"
        color={colors.text}
        style={styles.rowText}
        numberOfLines={1}
      >
        {item.text}
      </Typography>

      {isCustom && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}

      <IconButton
        icon="chevron-up"
        variant="ghost"
        size={36}
        iconSize={20}
        color={index === 0 ? colors.disabled : colors.secondaryText}
        disabled={index === 0}
        onPress={() => moveItem(index, -1)}
      />
      <IconButton
        icon="chevron-down"
        variant="ghost"
        size={36}
        iconSize={20}
        color={index === total - 1 ? colors.disabled : colors.secondaryText}
        disabled={index === total - 1}
        onPress={() => moveItem(index, 1)}
      />
    </View>
  );

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: (
          <Typography variant="h5" color={colors.text}>
            Sıralama
          </Typography>
        ),
        rightIcon: {
          icon: hasChanges ? (
            <GeliomButton state="active" size="small" onPress={handleSave}>
              Kaydet
            </GeliomButton>
          ) : (
            <TouchableOpacity onPress={handleOpenBottomSheet}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
          onPress: hasChanges ? handleSave : handleOpenBottomSheet,
        },
        backgroundColor: colors.background,
        style: { borderBottomWidth: 0 },
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tab Selector */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.secondaryBackground },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("status")}
            style={[
              styles.tab,
              activeTab === "status" && { backgroundColor: colors.primary },
            ]}
          >
            <Typography
              variant="body"
              color={activeTab === "status" ? "#FFFFFF" : colors.text}
              fontWeight={activeTab === "status" ? "semibold" : "regular"}
            >
              Status
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("mood")}
            style={[
              styles.tab,
              activeTab === "mood" && { backgroundColor: colors.primary },
            ]}
          >
            <Typography
              variant="body"
              color={activeTab === "mood" ? "#FFFFFF" : colors.text}
              fontWeight={activeTab === "mood" ? "semibold" : "regular"}
            >
              Mood
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Typography
            variant="caption"
            color={colors.secondaryText}
            style={{ textAlign: "center", paddingHorizontal: spacing.lg }}
          >
            Ok butonlarıyla sırayı değiştir. Özel olanları silebilirsin.
          </Typography>
        </View>

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={44} />
            ))}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "status"
              ? sortedStatuses.map((item, index) =>
                  renderRow(
                    item,
                    index,
                    sortedStatuses.length,
                    !!item.is_custom,
                    () => handleDeleteStatus(String(item.id)),
                  ),
                )
              : sortedMoods.map((item, index) =>
                  renderRow(
                    item,
                    index,
                    sortedMoods.length,
                    !!(item as Mood).isCustom,
                    () => handleDeleteMood(String(item.id)),
                  ),
                )}
          </ScrollView>
        )}
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    margin: layout.screenPadding,
    padding: spacing.xs,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  infoContainer: {
    paddingBottom: spacing.md,
    paddingHorizontal: layout.screenPadding,
  },
  skeletonList: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 96,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowEmoji: {
    marginRight: spacing.xs,
  },
  rowText: {
    flex: 1,
  },
  deleteButton: {
    padding: spacing.sm,
  },
});
