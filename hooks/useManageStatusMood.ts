import {
  useCreateMood,
  useDeleteMood,
  useDeleteStatus,
  useSetUserStatus,
} from "@/api";
import { useAppStore } from "@/store/useAppStore";
import { Alert } from "react-native";

export function useManageStatusMood(groupId: string) {
  const user = useAppStore((state) => state.user);

  // Mutations
  const createStatus = useSetUserStatus();
  const deleteStatus = useDeleteStatus();
  const createMood = useCreateMood();
  const deleteMood = useDeleteMood();

  const isSubscribed = useAppStore((state) => state.isSubscribed);

  const handleAddStatus = async (text: string, emoji?: string) => {
    if (!user) return;
    try {
      await createStatus.mutateAsync({
        text,
        emoji,
        owner_id: user.id,
        groupId, // Changed to match payload
        is_custom: true,
        notifies: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Status ekleme hatası:", errorMessage);
      Alert.alert("Hata", "Status eklenirken bir hata oluştu.");
    }
  };

  const handleAddMood = async (text: string, emoji: string) => {
    if (!user) return;

    if (!isSubscribed) {
      Alert.alert(
        "Premium Özellik",
        "Mood eklemek için premium üye olmalısınız.",
      );
      return;
    }

    try {
      await createMood.mutateAsync({
        groupId,
        data: { text, emoji, mood: "custom" }, // Adjusted payload structure for useCreateMood
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Mood ekleme hatası:", errorMessage);
      Alert.alert("Hata", "Mood eklenirken bir hata oluştu.");
    }
  };

  const handleDeleteStatus = (id: string) => {
    // Changed id to string based on mutation type likely
    Alert.alert("Status Sil", "Bu statusu silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStatus.mutateAsync(); // useDeleteStatus warns distinct handling not impl?
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("Status silme hatası:", errorMessage);
            Alert.alert("Hata", "Status silinirken bir hata oluştu.");
          }
        },
      },
    ]);
  };

  const handleDeleteMood = (id: string) => {
    Alert.alert("Mood Sil", "Bu moodu silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMood.mutateAsync();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("Mood silme hatası:", errorMessage);
            Alert.alert("Hata", "Mood silinirken bir hata oluştu.");
          }
        },
      },
    ]);
  };

  const checkSubscriptionAndProceed = (onProceed: () => void) => {
    if (isSubscribed) {
      onProceed();
    } else {
      Alert.alert(
        "Premium Özellik",
        "Bu özellik için premium üye olmalısınız.",
      );
    }
  };

  return {
    handleAddStatus,
    handleAddMood,
    handleDeleteStatus,
    handleDeleteMood,
    checkSubscriptionAndProceed,
    isCreatingStatus: createStatus.isPending,
    isCreatingMood: createMood.isPending,
  };
}
