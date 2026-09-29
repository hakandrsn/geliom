import type { GroupSummary } from "@/api/types";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { GeliomButton, Typography } from "@/components/shared";
import { Avatar, EmptyState, Skeleton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Header'daki grup adına dokununca açılan grup seçici.
 * Satır: tonlu baş harf rozeti + ad + "5 üye · Yönetici" + (sessizdeyse) zil-kapalı;
 * seçili satır tonlu zeminle ve onay işaretiyle vurgulanır.
 */
function GroupListBottomSheetComponent() {
  const groups = useAppStore((state) => state.groups);
  const isLoading = useAppStore((state) => state.isLoading);
  const currentGroupId = useAppStore((state) => state.currentGroupId);
  const setCurrentGroup = useAppStore((state) => state.setCurrentGroup);

  const { closeBottomSheet } = useBottomSheet();
  const { colors } = useTheme();
  const router = useRouter();

  const handleGroupSelect = useCallback(
    (group: GroupSummary) => {
      setCurrentGroup(group.id);
      closeBottomSheet();
    },
    [setCurrentGroup, closeBottomSheet],
  );

  // Sheet tamamen kapandıktan sonra navigate et (animasyon çakışmasın)
  const navigateAfterClose = useCallback(
    (path: "/create-group" | "/join-group") => {
      closeBottomSheet();
      setTimeout(() => router.push(path), 300);
    },
    [closeBottomSheet, router],
  );

  const renderRow = (group: GroupSummary, index: number) => {
    const isSelected = group.id === currentGroupId;
    const muted = group.notifications && !group.notifications.enabled;
    const meta = [
      `${group.memberCount} üye`,
      group.role === "ADMIN" ? "Yönetici" : "Üye",
    ].join(" · ");
    const paused = !!group.isPaused;

    return (
      <BouncyButton
        key={group.id}
        onPress={() => handleGroupSelect(group)}
        scaleTo={0.995}
        style={[
          styles.row,
          isSelected && { backgroundColor: colors.passiveState },
          !isSelected &&
            index < groups.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.stroke,
            },
        ]}
      >
        {/* Grup rozeti: ada göre sabit ton, baş harfler */}
        <Avatar name={group.name} seed={group.id} size={44} fallback="initials" />

        <View style={styles.rowText}>
          <Typography
            variant="body"
            fontWeight="semibold"
            color={isSelected ? colors.primary : colors.text}
            numberOfLines={1}
          >
            {group.name}
          </Typography>
          <View style={styles.metaRow}>
            <Typography variant="caption" color={colors.secondaryText} numberOfLines={1}>
              {meta}
            </Typography>
            {muted && (
              <Ionicons name="notifications-off-outline" size={12} color={colors.lightText} />
            )}
            {paused && (
              <Typography variant="caption" fontWeight="semibold" color={colors.error}>
                · Duraklatıldı
              </Typography>
            )}
          </View>
        </View>

        {isSelected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.lightText} />
        )}
      </BouncyButton>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h5" color={colors.text}>
          Gruplarım
        </Typography>
        {groups.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.passiveState }]}>
            <Typography variant="caption" fontWeight="semibold" color={colors.primary}>
              {groups.length}
            </Typography>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        bounces={groups.length > 4}
      >
        {isLoading ? (
          <View style={styles.skeletons}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <Skeleton width={44} height={44} radius={radius.full} />
                <View style={styles.skeletonText}>
                  <Skeleton width={140} height={14} radius={radius.sm} />
                  <Skeleton width={90} height={10} radius={radius.sm} />
                </View>
              </View>
            ))}
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Henüz grubun yok"
            description="Bir grup kur ya da davet koduyla katıl; arkadaşların burada görünecek."
            style={styles.empty}
          />
        ) : (
          groups.map(renderRow)
        )}
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: colors.stroke }]}>
        {/* BouncyButton stili iç Animated.View'a verir; flex dış Pressable'a
            ulaşmadığı için genişliği saran View belirler. */}
        <View style={styles.actionButton}>
          <GeliomButton
            state="active"
            size="medium"
            layout="icon-left"
            icon="add"
            onPress={() => navigateAfterClose("/create-group")}
          >
            Yeni Grup
          </GeliomButton>
        </View>
        <View style={styles.actionButton}>
          <GeliomButton
            state="passive"
            size="medium"
            layout="icon-left"
            icon="key-outline"
            onPress={() => navigateAfterClose("/join-group")}
          >
            Kod ile Katıl
          </GeliomButton>
        </View>
      </View>
    </View>
  );
}

// React.memo yok: her açılışta yeni key ile render edilir, store güncellemeleri yansır
export default GroupListBottomSheetComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: layout.touchTarget + spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  skeletons: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  skeletonText: {
    gap: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
  },
});
