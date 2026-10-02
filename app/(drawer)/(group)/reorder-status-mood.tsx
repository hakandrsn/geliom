import { useGroupOptions, useGroupSession, useUpdateGroupOptions } from "@/api";
import { StatusMoodBottomSheet } from "@/components/bottomsheets";
import {
  STATUS_MOOD_SHEET_SNAP,
  type StatusMoodValue,
} from "@/components/bottomsheets/StatusMoodBottomSheet";
import { BaseLayout, Button, Typography } from "@/components/shared";
import {
  DraggableList,
  Emoji,
  EmptyState,
  IconButton,
  SegmentedControl,
} from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { getApiErrorMessage, getPremiumLimitCode } from "@/utils/api-error";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tab = "status" | "mood";

interface DraftItem {
  /** Var olan seçeneğin id'si ya da yeni seçenek için geçici "new-*" */
  id: string;
  text: string;
  emoji?: string | null;
  isDefault: boolean;
  /** Yalnızca durum: bu duruma geçince bildirim gitsin mi */
  notifies?: boolean;
  isNew?: boolean;
  isEdited?: boolean;
}

/** Sunucudaki MAX_OPTIONS ile aynı — liste başına TOPLAM seçenek hakkı */
const MAX_OPTIONS = 10;
const ROW_HEIGHT = 56;

/**
 * Grubun durum ve ruh hali listesini düzenleme — yalnızca grup sahibi.
 * Her liste toplam MAX_OPTIONS seçenek tutar; varsayılanlar dahil her
 * seçenek düzenlenebilir. Aynı ekranda: + ile ekle, satıra dokunarak düzenle,
 * soldaki tutamaçla sürükleyerek sırala, sağdaki çarpıyla sil. Değişiklikler
 * "Kaydet" ile tek seferde yazılır ve gruptaki herkese canlı yansır.
 * Düzenleme Premium gerektirir.
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
  const { statusOptions, moodOptions, isLoaded } = useGroupOptions(
    selectedGroup?.id,
  );

  const [tab, setTab] = useState<Tab>(
    params.tab === "mood" ? "mood" : "status",
  );
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
  const overLimit = items.length > MAX_OPTIONS;

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

  const isDuplicate = (text: string, exceptId?: string) =>
    items.some(
      (i) =>
        i.id !== exceptId &&
        i.text.toLocaleLowerCase("tr-TR") === text.toLocaleLowerCase("tr-TR"),
    );

  const openSheet = (item?: DraftItem) =>
    openBottomSheet(
      <StatusMoodBottomSheet
        key={`${tab}-${item?.id ?? "new"}-${Date.now()}`}
        type={tab}
        initial={
          item
            ? {
                text: item.text,
                emoji: item.emoji ?? "",
                notifies: item.notifies !== false,
              }
            : undefined
        }
        onSave={({ text, emoji, notifies }: StatusMoodValue) => {
          if (isDuplicate(text, item?.id)) {
            Alert.alert("Zaten var", `"${text}" listede zaten var.`);
            return;
          }
          const fields = {
            text,
            emoji: emoji || undefined,
            ...(tab === "status" && { notifies }),
          };
          setItems(
            item
              ? items.map((i) =>
                  i.id === item.id
                    ? { ...i, ...fields, isEdited: !i.isNew }
                    : i,
                )
              : [
                  ...items,
                  {
                    id: `new-${Date.now()}`,
                    isDefault: false,
                    isNew: true,
                    ...fields,
                  },
                ],
          );
          closeBottomSheet();
        }}
        onCancel={closeBottomSheet}
      />,
      // Emoji ızgarası kendi içinde kayar (BottomSheetFlatList)
      { snapPoints: [STATUS_MOOD_SHEET_SNAP], scrollable: true },
    );

  const handleAdd = () =>
    requirePremium(() => {
      if (items.length >= MAX_OPTIONS) {
        Alert.alert(
          "Liste dolu",
          `Bir listede en fazla ${MAX_OPTIONS} seçenek olabilir. Yer açmak için birini kaldır ya da var olanı düzenle.`,
        );
        return;
      }
      openSheet();
    });

  const handleEdit = (item: DraftItem) => requirePremium(() => openSheet(item));

  const save = async () => {
    if (!selectedGroup || !draft) return;
    const toInput = (list: DraftItem[]) =>
      list.map((i) => ({
        id: i.isNew ? undefined : i.id,
        text: i.text,
        emoji: i.emoji ?? undefined,
        notifies: i.notifies,
      }));
    try {
      await updateOptions.mutateAsync({
        groupId: selectedGroup.id,
        statusOptions: toInput(draft.status),
        moodOptions: toInput(draft.mood).map(
          ({ notifies: _n, ...rest }) => rest,
        ),
      });
      setDirty(false);
      router.back();
    } catch (error: any) {
      if (getPremiumLimitCode(error) === "OPTIONS_PREMIUM") {
        openPaywall();
        return;
      }
      Alert.alert(
        "Kaydedilemedi",
        getApiErrorMessage(error, "Liste kaydedilemedi."),
      );
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
      ? {
          icon: <Ionicons name="add" size={26} color={colors.primary} />,
          onPress: handleAdd,
        }
      : undefined,
    backgroundColor: colors.background,
  };

  if (!isOwner) {
    return (
      <BaseLayout
        headerShow
        header={header}
        backgroundColor={colors.background}
      >
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          items={[
            {
              key: "status",
              label: "Durum",
              hint: `${draft?.status.length ?? 0} seçenek`,
            },
            {
              key: "mood",
              label: "Ruh hali",
              hint: `${draft?.mood.length ?? 0} seçenek`,
            },
          ]}
        />

        <View style={styles.metaRow}>
          <Typography
            variant="caption"
            color={colors.secondaryText}
            style={styles.flex}
          >
            Dokunarak düzenle, tutamaçtan sürükleyerek sırala, çarpıyla kaldır.
            Gruptaki herkes bu listeyi görür.
          </Typography>
          <Typography
            variant="caption"
            fontWeight="semibold"
            color={overLimit ? colors.error : colors.secondaryText}
          >
            {items.length}/{MAX_OPTIONS}
          </Typography>
        </View>

        {overLimit && (
          <View
            style={[
              styles.premiumNote,
              { backgroundColor: colors.passiveState },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.error}
            />
            <Typography
              variant="caption"
              color={colors.text}
              style={styles.flex}
            >
              Bu listede {items.length} seçenek var; en fazla {MAX_OPTIONS}{" "}
              olabilir. Kaydetmeden önce {items.length - MAX_OPTIONS} tanesini
              kaldır.
            </Typography>
          </View>
        )}

        {!isPremium && (
          <View
            style={[
              styles.premiumNote,
              { backgroundColor: colors.passiveState },
            ]}
          >
            <Ionicons name="diamond-outline" size={16} color={colors.primary} />
            <Typography
              variant="caption"
              color={colors.text}
              style={styles.flex}
            >
              Listeyi düzenlemek Premium özelliğidir. Eklemek ya da düzenlemek
              istediğinde satın alma ekranı açılır.
            </Typography>
          </View>
        )}

        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.sheetBackground,
              borderColor: colors.stroke,
            },
          ]}
        >
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
                    <Ionicons
                      name="reorder-three"
                      size={24}
                      color={colors.lightText}
                    />
                  </View>,
                )}
                {/* Pressable doğrudan satırın esnek gövdesi: genişliği satırdan
                    alır, metin sütunu kalan alanın tamamını kaplar */}
                <Pressable
                  onPress={() => handleEdit(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.text} düzenle`}
                  style={({ pressed }) => [
                    styles.rowBody,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.emoji}>
                    {item.emoji ? (
                      <Emoji size={20}>{item.emoji}</Emoji>
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={16}
                        color={colors.lightText}
                      />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Typography
                      variant="body"
                      fontWeight="medium"
                      color={colors.text}
                      numberOfLines={1}
                    >
                      {item.text}
                    </Typography>
                    <RowMeta item={item} tab={tab} />
                  </View>
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.lightText}
                  />
                </Pressable>
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
          disabled={!dirty || overLimit}
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
  rowBody: {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
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

/** Satır alt bilgisi: Yeni / Düzenlendi / Varsayılan · bildirim kapalı */
function RowMeta({ item, tab }: { item: DraftItem; tab: Tab }) {
  const { colors } = useTheme();
  const parts: string[] = [];
  if (item.isNew) parts.push("Yeni");
  else if (item.isEdited) parts.push("Düzenlendi");
  else if (item.isDefault) parts.push("Varsayılan");
  if (tab === "status" && item.notifies === false)
    parts.push("Bildirim kapalı");
  if (parts.length === 0) return null;
  return (
    <Typography
      variant="caption"
      color={item.isNew || item.isEdited ? colors.primary : colors.lightText}
    >
      {parts.join(" · ")}
    </Typography>
  );
}
