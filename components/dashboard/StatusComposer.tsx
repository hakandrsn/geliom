import type { DashboardMember } from "@/api/dashboard";
import { useUpdateUserAvatar } from "@/api/users";
import { AvatarSelector } from "@/components/shared";
import { DropdownTrigger } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import React, { useRef } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MoodHero from "./MoodHero";
import type { PickerTab } from "./PickerDropdown";

interface StatusComposerProps {
  member: DashboardMember;
  /** Açık olan dropdown sekmesi (yoksa null) */
  activeTab: PickerTab | null;
  /** Sekmeye dokunuldu: kartın pencere koordinatındaki alt kenarı ile birlikte */
  onToggleTab: (tab: PickerTab, anchorBottomY: number) => void;
  /** Grup duraklatıldı: seçim yapılamaz, kart soluk görünür */
  disabled?: boolean;
}

/**
 * Ana ekranın aracı: kompakt kart. Üstte "şu an neredeyim" özeti, altında
 * birbirinden ayrı Durum / Ruh hali açılır butonları. Seçenekler kartın altında yüzen panelde açılır
 * (PickerDropdown), içerik aşağı itilmez.
 */
export default function StatusComposer({
  member,
  activeTab,
  onToggleTab,
  disabled = false,
}: StatusComposerProps) {
  const { colors, shadows } = useTheme();
  const cardRef = useRef<View>(null);

  const user = useAppStore((state) => state.user);
  const updateAvatar = useUpdateUserAvatar();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const openAvatarPicker = () => {
    if (!user) return;
    openBottomSheet(
      <AvatarSelector
        currentAvatar={user.photoUrl}
        name={user.displayName}
        seed={user.id}
        onCancel={closeBottomSheet}
        onSelect={async (avatar) => {
          try {
            await updateAvatar.mutateAsync(avatar);
            closeBottomSheet();
          } catch {
            closeBottomSheet();
            Alert.alert("Hata", "Avatar güncellenemedi");
          }
        }}
      />,
      { snapPoints: ["90%"], scrollable: true },
    );
  };

  const toggle = (tab: PickerTab) => {
    if (disabled) return;
    cardRef.current?.measureInWindow((_x, y, _w, h) => {
      onToggleTab(tab, y + h);
    });
  };

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[
        styles.card,
        { backgroundColor: colors.sheetBackground, borderColor: colors.stroke },
        shadows.card,
        disabled && styles.disabled,
      ]}
    >
      <MoodHero
        member={member}
        embedded
        onAvatarPress={openAvatarPicker}
        onPress={() => toggle(member.statusText ? "mood" : "status")}
      />

      <View style={styles.triggers}>
        <DropdownTrigger
          label="Durum"
          value={member.statusText}
          open={activeTab === "status"}
          onPress={() => toggle("status")}
        />
        <DropdownTrigger
          label="Ruh hali"
          value={member.moodText}
          open={activeTab === "mood"}
          onPress={() => toggle("mood")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  triggers: {
    flexDirection: "row",
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
});
