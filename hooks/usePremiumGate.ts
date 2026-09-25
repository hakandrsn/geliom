import { FIRST_SUBSCRIPTION_PLACEMENT } from "@/constants/adapty";
import { showPaywall } from "@/services/purchase";
import { useAppStore } from "@/store/useAppStore";
import { useCallback } from "react";
import { Alert } from "react-native";

/**
 * Premium gerektiren her aksiyonun TEK kapısı.
 *
 * - Kullanıcı premium ise aksiyon hemen çalışır.
 * - Değilse Adapty paywall açılır; satın alma sunucuya yansıyınca aksiyon
 *   otomatik devam eder.
 * - Paywall gösterilemezse (SDK key yok, ağ yok) kullanıcı sessizce
 *   bırakılmaz: bilgi verilir ve aksiyon ÇALIŞMAZ (kapı açık kalmaz).
 *
 * Premium'un doğruluk kaynağı backend'dir (store.isSubscribed = user.isPremium).
 */
export function usePremiumGate() {
  const isSubscribed = useAppStore((state) => state.isSubscribed);

  const openPaywall = useCallback((onSuccess?: () => void) => {
    showPaywall({
      placementId: FIRST_SUBSCRIPTION_PLACEMENT,
      onSuccess: () => onSuccess?.(),
      onUnavailable: () =>
        Alert.alert(
          "Premium şu an açılamıyor",
          "Satın alma ekranı yüklenemedi. İnternet bağlantını kontrol edip biraz sonra tekrar dene.",
        ),
      onFailure: (error: any) => {
        // Kullanıcının iptal etmesi hata değildir; yalnızca gerçek hatalar
        if (error?.message) Alert.alert("Satın alma tamamlanamadı", error.message);
      },
    });
  }, []);

  /**
   * Premium ise onProceed'i çalıştırır, değilse paywall açar.
   * Değer render closure'ından değil store'dan okunur: satın almadan hemen
   * sonra açılan sheet'lerin eski closure'ı ikinci kez paywall açmasın.
   */
  const requirePremium = useCallback(
    (onProceed: () => void) => {
      if (useAppStore.getState().isSubscribed) onProceed();
      else openPaywall(onProceed);
    },
    [openPaywall],
  );

  return { isPremium: isSubscribed, requirePremium, openPaywall };
}
