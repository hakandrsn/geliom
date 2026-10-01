import { useGroupOptions, useGroupSession, useUpdateGroupOptions } from "@/api";
import { StatusMoodBottomSheet } from "@/components/bottomsheets";
import { BaseLayout, Button, Typography } from "@/components/shared";
import { DraggableList, Emoji, EmptyState, IconButton, SegmentedControl } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { getApiErrorMessage, getPremiumLimitCode } from "@/utils/api-error";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tab = "status" | "mood";

interface DraftItem {
  /** Var olan seçeneğin id'si ya da yeni seçenek için geçici "new-*" */
  id: string;
  text: string;
  emoji?: string | null;
  isDefault: boolean;
  isNew?: boolean;
}

/** Sunucudaki MAX_CUSTOM_OPTIONS ile aynı */
const MAX_CUSTOM = 10;
const ROW_HEIGHT = 56;

/**
 * Grubun durum ve ruh hali listesini düzenleme — yalnızca grup sahibi.
 * Aynı ekranda: + ile ekle, soldaki tutamaçla sürükleyerek sırala, sağdaki
 * kırmızı çarpıyla sil. Değişiklikler "Kaydet" ile tek seferde yazılır ve
 * gruptaki herkese canlı yansır. Düzenleme Premium gerektirir.
 */
export default function GroupOptionsEditorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const isOwner = !!selectedGroup && selectedGroup.ownerId === user?.id;
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();
  const { isPremium, requirePremium, openPaywall } = usePremiumGate();
  const updateOptions = useUpdateGroupOptions();

  useGroupSession(selectedGroup?.id);
  const { statusOptions, moodOptions, isLoaded } = useGroupOptions(selectedGroup?.id);

  const [tab, setTab] = useState<Tab>(params.tab === "mood" ? "mood" : "status");
  const [draft, setDraft] = useState<Record<Tab, DraftItem[]> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Taslak, session yüklenince bir kez kurulur (sonraki canlı değişiklikler
  // düzenleme sırasında taslağı ezmesin) — render sırasında, effect değil
  if (isLoaded && !draft) {
    setDraft({
      status: statusOptions.map((o) => ({ ...o })),
      mood: moodOptions.map((o) => ({ ...o })),
    });
  }

  const items = useMemo(() => draft?.[tab] ?? [], [draft, tab]);
  const customCount = items.filter((i) => !i.isDefault).length;

  const setItems = (next: DraftItem[]) => {
    setDraft((d) => (d ? { ...d, [tab]: next } : d));
    setDirty(true);
  };

  const handleRemove = (id: string) => {
    if (items.length <= 1) {
      Alert.alert("Son seçenek", "Listede en az bir seçenek kalmalı.");
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  };

  const handleAdd = () =>
    requirePremium(() => {
      if (customCount >= MAX_CUSTOM) {
        Alert.alert("Limit doldu", `Bir listeye en fazla ${MAX_CUSTOM} özel seçenek eklenebilir.`);
        return;
      }
      openBottomSheet(
        <StatusMoodBottomSheet
          key={`${tab}-${Date.now()}`}
          type={tab}
          onSave={async (text, emoji) => {
            const exists = items.some(
              (i) => i.text.toLocaleLowerCase("tr-TR") === text.toLocaleLowerCase("tr-TR"),
            );
            if (exists) {
              Alert.alert("Zaten var", `"${text}" listede zaten var.`);
              return;
            }
            setItems([
              ...items,
              { id: `new-${Date.now()}`, text, emoji: emoji || undefined, isDefault: false, isNew: true },
            ]);
            closeBottomSheet();
          }}
          onCancel={closeBottomSheet}
        />,
        // Emoji seçici kendi içinde kayar (BottomSheetScrollView)
        { snapPoints: ["85%"], scrollable: true },
      );
    });

  const save = async () => {
    if (!selectedGroup || !draft) return;
    const toInput = (list: DraftItem[]) =>
      list.map((i) => ({
        id: i.isNew ? undefined : i.id,
        text: i.text,
        emoji: i.emoji ?? undefined,
      }));
    try {
      await updateOptions.mutateAsync({
        groupId: selectedGroup.id,
        statusOptions: toInput(draft.status),
        moodOptions: toInput(draft.mood),
      });
      setDirty(false);
      router.back();
    } catch (error: any) {
      if (getPremiumLimitCode(error) === "OPTIONS_PREMIUM") {
        openPaywall();
        return;
      }
      Alert.alert("Kaydedilemedi", getApiErrorMessage(error, "Liste kaydedilemedi."));
    }
  };

  const header = {
    leftIcon: {
      icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
      onPress: () => router.back(),
    },
    title: (
      <Typography variant="h5" color={colors.text}>
        Durum ve Ruh Halleri
      </Typography>
    ),
    rightIcon: isOwner
      ? { icon: <Ionicons name="add" size={26} color={colors.primary} />, onPress: handleAdd }
      : undefined,
    backgroundColor: colors.background,
  };

  if (!isOwner) {
    return (
      <BaseLayout headerShow header={header} backgroundColor={colors.background}>
        <EmptyState
          fullScreen
          icon="lock-closed-outline"
          title="Yalnızca grup sahibi"
          description="Grubun durum ve ruh hali listesini yalnızca grubu kuran kişi düzenleyebilir."
        />
      </BaseLayout>
    );
  }

  return (
    <BaseLayout headerShow header={header} backgroundColor={colors.background}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { key: "status", label: "Durum", hint: `${draft?.status.length ?? 0} seçenek` },
            { key: "mood", label: "Ruh hali", hint: `${draft?.mood.length ?? 0} seçenek` },
          ]}
        />

        <View style={styles.metaRow}>
          <Typography variant="caption" color={colors.secondaryText} style={styles.flex}>
            Tutamaçtan sürükleyerek sırala, çarpıyla kaldır. Gruptaki herkes bu sırayı görür.
          </Typography>
          <Typography variant="caption" fontWeight="semibold" color={colors.secondaryText}>
            Özel {customCount}/{MAX_CUSTOM}
          </Typography>
        </View>

        {!isPremium && (
          <View style={[styles.premiumNote, { backgroundColor: colors.passiveState }]}>
            <Ionicons name="diamond-outline" size={16} color={colors.primary} />
            <Typography variant="caption" color={colors.text} style={styles.flex}>
              Listeyi düzenlemek Premium özelliğidir. Değişiklikleri kaydederken satın alma ekranı açılır.
            </Typography>
          </View>
        )}

        <View style={[styles.listCard, { backgroundColor: colors.sheetBackground, borderColor: colors.stroke }]}>
          <DraggableList
            data={items}
            keyExtractor={(i) => i.id}
            rowHeight={ROW_HEIGHT}
            onReorder={setItems}
            onDragStateChange={setDragging}
            renderItem={(item, { handle, index }) => (
              <View
                style={[
                  styles.row,
                  { backgroundColor: colors.sheetBackground },
                  index < items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.stroke,
                  },
                ]}
              >
                {handle(
                  <View style={styles.handle}>
                    <Ionicons name="reorder-three" size={24} color={colors.lightText} />
                  </View>,
                )}
                <View style={styles.emoji}>
                  {item.emoji ? (
                    <Emoji size={20}>{item.emoji}</Emoji>
                  ) : (
                    <Ionicons name="ellipse-outline" size={16} color={colors.lightText} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Typography variant="body" fontWeight="medium" color={colors.text} numberOfLines={1}>
                    {item.text}
                  </Typography>
                  {(item.isDefault || item.isNew) && (
                    <Typography variant="caption" color={item.isNew ? colors.primary : colors.lightText}>
                      {item.isNew ? "Yeni" : "Varsayılan"}
                    </Typography>
                  )}
                </View>
                <IconButton
                  icon="close"
                  variant="ghost"
                  size={36}
                  iconSize={20}
                  color={colors.error}
                  onPress={() => handleRemove(item.id)}
                />
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.background,
            borderTopColor: colors.stroke,
          },
        ]}
      >
        <Button
          variant="gradient"
          title={dirty ? "Kaydet" : "Değişiklik yok"}
          disabled={!dirty}
          loading={updateOptions.isPending}
          onPress={() => requirePremium(() => void save())}
        />
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  premiumNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  handle: {
    width: 44,
    height: ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    width: 28,
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
