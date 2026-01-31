import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

// Hooks & Contexts
import { useMoods, useSetUserStatus } from "@/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useManageStatusMood } from "@/hooks/useManageStatusMood";
import { useAppStore } from "@/store/useAppStore";

// Components
import AddStatusMoodModal from "@/components/dashboard/AddStatusMoodModal";
import { GeliomButton } from "@/components/shared";

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
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // LOCAL STATE
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
  const setStatusMutation = useSetUserStatus();

  const handleMoodSelect = useCallback(
    (mood: any) => {
      if (!user) return;

      setActiveId(mood.id);

      setStatusMutation.mutate({
        groupId: groupId,
        text: mood.text,
        emoji: mood.emoji,
        mood: mood.text, // Assuming mood name is passed as mood field
      });
    },
    [user, groupId, setStatusMutation],
  );

  // Tüm liste elemanlarını hazırla
  const allItems = useMemo(() => {
    const sorted = [...allMoods].sort((a, b) => {
      const aIsCustom = a.groupId != null;
      const bIsCustom = b.groupId != null;
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      return a.text.localeCompare(b.text);
    });
    return [...sorted, { id: -1, text: "Ekle", emoji: "➕", groupId: null }];
  }, [allMoods]);

  if (isLoading) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {allItems.map((item) => {
          if (item.id === -1) {
            return (
              <View key="add-button" style={styles.buttonWrapper}>
                <GeliomButton
                  state="passive"
                  onPress={() =>
                    checkSubscriptionAndProceed(() => setIsModalVisible(true))
                  }
                  size="small"
                  layout="icon-only"
                  icon="add"
                  style={{
                    borderColor: colors.stroke,
                    borderWidth: 1,
                    borderStyle: "dashed",
                  }}
                />
              </View>
            );
          }

          const isSelected = activeId === item.id;

          return (
            <View
              key={item.id.toString()}
              style={[
                styles.buttonContainer,
                isSelected && styles.buttonContainerSelected,
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: 12, overflow: "hidden" },
                ]}
              >
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: colors.secondaryBackground },
                  ]}
                />
              </View>

              <GeliomButton
                state={isSelected ? "active" : "passive"}
                onPress={() => handleMoodSelect(item)}
                size="small"
                backgroundColor="transparent"
                textColor={isSelected ? colors.tertiary : colors.text}
                textStyle={isSelected ? { fontWeight: "bold" } : undefined}
                style={
                  [
                    styles.button,
                    {
                      borderColor: isSelected ? colors.primary : "transparent",
                    },
                  ] as any
                }
              >
                {item.emoji} {item.text}
              </GeliomButton>
            </View>
          );
        })}
      </ScrollView>

      <AddStatusMoodModal
        visible={isModalVisible}
        type="mood"
        onClose={() => setIsModalVisible(false)}
        onSave={(text, emoji) => handleAddMood(text, emoji)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  listContent: {
    paddingLeft: 12,
    paddingRight: 12,
    gap: 12,
    paddingBottom: 8,
  },
  buttonWrapper: {
    marginBottom: 4,
  },
  buttonContainer: {
    marginBottom: 4,
    borderRadius: 12,
  },
  buttonContainerSelected: {
    transform: [{ translateY: 1 }],
  },
  button: {
    minWidth: 80,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    zIndex: 2,
    marginBottom: 0,
  },
});

export default React.memo(MoodSelector);
