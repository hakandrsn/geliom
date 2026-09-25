import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { useClearUserStatus, useGroupOptions, useSetUserStatus } from "@/api";
import { Chip, OptionRow } from "@/components/ui";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import SelectorHeader from "./SelectorHeader";

interface StatusSelectorProps {
  groupId: string;
  /** Başlık sorusu (rastgele prompt); compact modda gösterilmez */
  title?: string;
  /** Composer/dropdown içinde: başlık yok, kenar boşluğu dışarıdan */
  compact?: boolean;
  /** Dropdown: chip yerine kompakt satır listesi */
  layout?: "chips" | "list";
  /** Bir seçim/kaldırma yapıldığında (dropdown kapatmak için) */
  onSelect?: () => void;
  /** Başka ekrana/sheet'e geçmeden hemen önce (dropdown kapatmak için) */
  onWillOpenSheet?: () => void;
}

/**
 * Grubun durum seçenekleri — liste grubun sahibi tarafından belirlenir,
 * herkes aynı sırayı görür. Durum ve ruh hali bağımsızdır.
 */
function StatusSelector({
  groupId,
  title,
  compact = false,
  layout: layoutMode = "chips",
  onSelect,
  onWillOpenSheet,
}: StatusSelectorProps) {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const isOwner = useAppStore(
    (state) => state.groups.find((g) => g.id === groupId)?.ownerId === state.user?.id,
  );
  const myStatus = useAppStore((state) =>
    user ? state.session?.group.statuses[user.id] : undefined,
  );
  const { statusOptions } = useGroupOptions(groupId);
  const setStatus = useSetUserStatus();
  const clearStatus = useClearUserStatus();

  const select = useCallback(
    (option: (typeof statusOptions)[number]) => {
      // Ruh hali korunur; durum emojisi yalnızca ruh hali yoksa kullanılır
      setStatus.mutate({
        text: option.text,
        emoji: myStatus?.mood ? (myStatus.emoji ?? undefined) : (option.emoji ?? undefined),
        mood: myStatus?.mood ?? undefined,
      });
      onSelect?.();
    },
    [setStatus, myStatus, onSelect],
  );

  // Yalnızca durum metnini kaldır; ruh hali varsa korunur, yoksa kayıt silinir
  const clear = useCallback(() => {
    if (myStatus?.mood) {
      setStatus.mutate({ mood: myStatus.mood, emoji: myStatus.emoji ?? undefined });
    } else {
      clearStatus.mutate();
    }
    onSelect?.();
  }, [myStatus, setStatus, clearStatus, onSelect]);

  const openEditor = () => {
    onWillOpenSheet?.();
    router.push("/(drawer)/(group)/reorder-status-mood?tab=status");
  };

  const isSelected = (text: string) => text === myStatus?.text;

  if (layoutMode === "list") {
    return (
      <View>
        {myStatus?.text && (
          <OptionRow icon="close-circle-outline" label="Durumu kaldır" muted onPress={clear} />
        )}
        {statusOptions.map((option, index) => (
          <OptionRow
            key={option.id}
            label={option.text}
            emoji={option.emoji ?? undefined}
            icon={option.emoji ? undefined : "ellipse-outline"}
            selected={isSelected(option.text)}
            last={!isOwner && index === statusOptions.length - 1}
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
        <SelectorHeader title={title} onClear={myStatus?.text ? clear : undefined} />
      )}
      <View style={[styles.wrap, compact && styles.wrapCompact]}>
        {statusOptions.map((option) => (
          <Chip
            key={option.id}
            label={option.text}
            emoji={option.emoji ?? undefined}
            filled
            selected={isSelected(option.text)}
            onPress={() => select(option)}
          />
        ))}
        {isOwner && <Chip dashed icon="create-outline" label="Düzenle" onPress={openEditor} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
  },
  wrapCompact: {
    paddingHorizontal: 0,
  },
});

export default React.memo(StatusSelector);
