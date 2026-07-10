import {
  useCreateCustomStatus,
  useCreateMood,
  useDeleteCustomStatus,
  useDeleteMood,
  useSetUserStatus,
} from "@/api";
import { FIRST_SUBSCRIPTION_PLACEMENT } from "@/constants/adapty";
import { showPaywall } from "@/services/purchase";
import { useAppStore } from "@/store/useAppStore";
import { Alert } from "react-native";

export function useManageStatusMood(groupId: string) {
  const user = useAppStore((state) => state.user);

  // Mutations
  const setStatus = useSetUserStatus();
  const createMood = useCreateMood();
  const deleteMood = useDeleteMood();
  const createCustomStatus = useCreateCustomStatus();
  const deleteCustomStatus = useDeleteCustomStatus();

  const isSubscribed = useAppStore((state) => state.isSubscribed);

  /**
   * Özel status: gruba özel lokal listeye kaydedilir (tekrar seçilebilsin
   * diye) ve socket üzerinden aktif session'a hemen paylaşılır.
   */
  const handleAddStatus = async (text: string, emoji?: string) => {
    if (!user) return;
    try {
      await createCustomStatus.mutateAsync({
        userId: user.id,
        groupId,
        text,
        emoji,
      });
      await setStatus.mutateAsync({ text, emoji });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Status ekleme hatası:", errorMessage);
      Alert.alert("Hata", "Status eklenirken bir hata oluştu.");
    }
  };

  /** Gruba custom mood ekler — Admin + Premium gerektirir (grup başına 10). */
  const handleAddMood = async (text: string, emoji: string) => {
    if (!user) return;

    if (!isSubscribed) {
      // Alert yerine doğrudan paywall — satın alma tamamlanırsa işlem devam eder
      showPaywall({
        placementId: FIRST_SUBSCRIPTION_PLACEMENT,
        onSuccess: () => handleAddMood(text, emoji),
      });
      return;
    }

    try {
      await createMood.mutateAsync({
        groupId,
        data: { text, emoji, mood: text.toLowerCase().replace(/\s/g, "_") },
      });
    } catch (error: any) {
      // 409: admin değil / limit dolu — backend mesajını göster
      const backendMessage = error?.response?.data?.message;
      const errorMessage =
        (Array.isArray(backendMessage) ? backendMessage[0] : backendMessage) ||
        (error instanceof Error ? error.message : String(error));
      console.error("Mood ekleme hatası:", errorMessage);
      Alert.alert("Hata", errorMessage || "Mood eklenirken bir hata oluştu.");
    }
  };

  /** Gruba özel lokal status'ü siler. */
  const handleDeleteStatus = (id: string) => {
    if (!user) return;
    Alert.alert("Status Sil", "Bu status'ü silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCustomStatus.mutateAsync({
              userId: user.id,
              groupId,
              statusId: id,
            });
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

  /** Gruptan custom mood siler — Admin gerektirir; herkese canlı yansır. */
  const handleDeleteMood = (id: string) => {
    Alert.alert("Mood Sil", "Bu mood'u silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMood.mutateAsync({ groupId, moodId: id });
          } catch (error: any) {
            // 409: admin değil — backend mesajını göster
            const backendMessage = error?.response?.data?.message;
            const errorMessage =
              (Array.isArray(backendMessage)
                ? backendMessage[0]
                : backendMessage) ||
              (error instanceof Error ? error.message : String(error));
            console.error("Mood silme hatası:", errorMessage);
            Alert.alert(
              "Hata",
              errorMessage || "Mood silinirken bir hata oluştu.",
            );
          }
        },
      },
    ]);
  };

  /**
   * Premium gerektiren aksiyonların kapısı.
   * Abone değilse paywall açılır; satın alma başarılıysa aksiyon otomatik devam eder.
   */
  const checkSubscriptionAndProceed = (onProceed: () => void) => {
    if (isSubscribed) {
      onProceed();
    } else {
      showPaywall({
        placementId: FIRST_SUBSCRIPTION_PLACEMENT,
        onSuccess: () => onProceed(),
      });
    }
  };

  return {
    handleAddStatus,
    handleAddMood,
    handleDeleteStatus,
    handleDeleteMood,
    checkSubscriptionAndProceed,
    isCreatingStatus: setStatus.isPending,
    isCreatingMood: createMood.isPending,
  };
}
