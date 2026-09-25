import React, { useCallback } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { useClearUserStatus, useGroupOptions, useSetUserStatus } from "@/api";
import { Chip, OptionRow } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import SelectorHeader from "./SelectorHeader";

interface MoodSelectorProps {
  groupId: string;
  /** Başlık sorusu (rastgele prompt); compact modda gösterilmez */
  title?: string;
  /** Composer/dropdown içinde: başlık yok, kenar boşluğu dışarıdan */
  compact?: boolean;
  /** Karo genişliği hesabı için kullanılabilir genişlik */
  availableWidth?: number;
  /** Dropdown: karo yerine kompakt satır listesi */
  layout?: "tiles" | "list";
  onSelect?: () => void;
  onWillOpenSheet?: () => void;
}

const COLUMNS = 4;

/** Grubun ruh hali seçenekleri — sahibin belirlediği liste ve sıra. */
function MoodSelector({
  groupId,
  title,
  compact = false,
  availableWidth,
  layout: layoutMode = "tiles",
  onSelect,
  onWillOpenSheet,
}: MoodSelectorProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const usable = availableWidth ?? screenWidth - layout.screenPadding * 2;
  const tileWidth = Math.floor((usable - spacing.sm * (COLUMNS - 1)) / COLUMNS);

  const user = useAppStore((state) => state.user);
  const isOwner = useAppStore(
    (state) => state.groups.find((g) => g.id === groupId)?.ownerId === state.user?.id,
  );
  const myStatus = useAppStore((state) =>
    user ? state.session?.group.statuses[user.id] : undefined,
  );
  const { moodOptions } = useGroupOptions(groupId);
  const setStatus = useSetUserStatus();
  const clearStatus = useClearUserStatus();

  const select = useCallback(
    (option: (typeof moodOptions)[number]) => {
      // Durum metni korunur, ruh hali bağımsız
      setStatus.mutate({
        text: myStatus?.text ?? undefined,
        emoji: option.emoji ?? undefined,
        mood: option.key,
      });
      onSelect?.();
    },
    [setStatus, myStatus, onSelect],
  );

  // Yalnızca ruh halini kaldır; durum metni varsa korunur, yoksa kayıt silinir
  const clear = useCallback(() => {
    if (myStatus?.text) {
      setStatus.mutate({ text: myStatus.text });
    } else {
      clearStatus.mutate();
    }
    onSelect?.();
  }, [myStatus, setStatus, clearStatus, onSelect]);

  const openEditor = () => {
    onWillOpenSheet?.();
    router.push("/(drawer)/(group)/reorder-status-mood?tab=mood");
  };

  const isSelected = (key: string) => key === myStatus?.mood;

  if (layoutMode === "list") {
    return (
      <View>
        {myStatus?.mood && (
          <OptionRow icon="close-circle-outline" label="Ruh halini kaldır" muted onPress={clear} />
        )}
        {moodOptions.map((option, index) => (
          <OptionRow
            key={option.id}
            label={option.text}
            emoji={option.emoji ?? undefined}
            selected={isSelected(option.key)}
            last={!isOwner && index === moodOptions.length - 1}
            onPress={() => select(option)}
          />
        ))}
        {isOwner && (
          <OptionRow icon="create-outline" label="Listeyi düzenle" accent last onPress={openEditor} />
        )}
      </View>
    );
  }

  return (
    <View>
      {!compact && title && (
        <SelectorHeader title={title} onClear={myStatus?.mood ? clear : undefined} />
      )}
      <View style={[styles.grid, compact && styles.gridCompact]}>
        {moodOptions.map((option) => (
          <Chip
            key={option.id}
            variant="tile"
            label={option.text}
            emoji={option.emoji ?? undefined}
            selected={isSelected(option.key)}
            onPress={() => select(option)}
            style={{ width: tileWidth }}
          />
        ))}
        {isOwner && (
          <Chip
            variant="tile"
            dashed
            icon="create-outline"
            label="Düzenle"
            onPress={openEditor}
            style={{ width: tileWidth }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
  },
  gridCompact: {
    paddingHorizontal: 0,
  },
});

export default React.memo(MoodSelector);
