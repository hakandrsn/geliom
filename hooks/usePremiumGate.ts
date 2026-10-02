import { FIRST_SUBSCRIPTION_PLACEMENT } from "@/constants/adapty";
import { restorePurchases, showPaywall, type RestoreStatus } from "@/services/purchase";
import { useAppStore } from "@/store/useAppStore";
import { useCallback } from "react";
import * as Device from "expo-device";
import { Alert } from "react-native";

/**
 * Paywall açılamayınca gerçek sebebi söyle — "internetini kontrol et" her
 * durumda yanıltıcıydı. Geliştirmede Adapty hata kodu da gösterilir.
 */
function paywallUnavailableMessage(error: unknown): [string, string] {
  const code = (error as { adaptyCode?: string } | undefined)?.adaptyCode;
  const detail = __DEV__ && code ? `\n\n[${code}] ${(error as Error).message ?? ""}` : "";

  if (!Device.isDevice) {
    return [
      "Simülatörde satın alma yok",
      "App Store ürünleri simülatörde yüklenmez. Gerçek cihazda dene ya da test hesabına Adapty panelinden Premium erişimi ver." +
        detail,
    ];
  }
  if (code === "networkFailed") {
    return ["İnternet bağlantısı yok", "Premium seçeneklerini yüklemek için internete bağlan ve tekrar dene." + detail];
  }
  if (code === "cantMakePayments") {
    return [
      "Satın alma kapalı",
      "Bu cihazda uygulama içi satın alma kısıtlı. Ekran Süresi ayarlarından izin verip tekrar dene." + detail,
    ];
  }
  return [
    "Premium şu an açılamıyor",
    "Satın alma seçenekleri yüklenemedi. Biraz sonra tekrar dene; sorun sürerse Yardım & Destek'ten bize yaz." + detail,
  ];
}

const RESTORE_MESSAGES: Record<RestoreStatus, [string, string]> = {
  restored: ["Premium geri yüklendi", "Premium özelliklerin yeniden aktif."],
  none: [
    "Aktif abonelik bulunamadı",
    "Bu Apple/Google hesabında geri yüklenecek aktif bir Premium aboneliği yok.",
  ],
  pending: [
    "Aboneliğin bulundu",
    "Premium hesabına işleniyor; birkaç dakika içinde aktif olur. Olmazsa Yardım & Destek'ten bize yaz.",
  ],
  offline: [
    "İnternet bağlantısı yok",
    "Satın alımlarını kontrol edebilmemiz için internete bağlan ve tekrar dene.",
  ],
  error: [
    "Şu an kontrol edilemedi",
    "Mağazaya ulaşırken bir sorun oldu. Biraz sonra tekrar dene; sorun sürerse Yardım & Destek'ten bize yaz.",
  ],
};

/**
 * Premium gerektiren her aksiyonun TEK kapısı.
 *
 * - Kullanıcı premium ise aksiyon hemen çalışır.
 * - Değilse Adapty paywall açılır; satın alma sunucuya yansıyınca aksiyon
 *   otomatik devam eder.
 * - Paywall gösterilemezse (SDK key yok, ağ yok) kullanıcı sessizce
 *   bırakılmaz: bilgi verilir ve aksiyon ÇALIŞMAZ (kapı açık kalmaz).
 *
 * Premium'un tek kaynağı Adapty; sunucu onu users.isPremium'a yazar ve
 * store.isSubscribed = user.isPremium (bkz. services/purchase.ts).
 */
export function usePremiumGate() {
  const isSubscribed = useAppStore((state) => state.isSubscribed);

  const openPaywall = useCallback((onSuccess?: () => void) => {
    showPaywall({
      placementId: FIRST_SUBSCRIPTION_PLACEMENT,
      onSuccess: () => onSuccess?.(),
      onUnavailable: (error) => {
        const [title, message] = paywallUnavailableMessage(error);
        Alert.alert(title, message);
      },
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

  /** App Store 3.1.1: abonelikli uygulamada "Satın Alımları Geri Yükle" zorunlu. */
  const restore = useCallback(async () => {
    const { status, error } = await restorePurchases();
    const [title, message] = RESTORE_MESSAGES[status];
    // Simülatörde mağaza yok — "ulaşılamadı" yerine gerçek sebebi söyle
    if (status === "error" && !Device.isDevice) {
      Alert.alert(...paywallUnavailableMessage(error));
      return false;
    }
    const code = (error as { adaptyCode?: string } | undefined)?.adaptyCode;
    const detail = __DEV__ && error ? `\n\n[${code ?? "error"}] ${(error as Error).message ?? ""}` : "";
    Alert.alert(title, message + detail);
    return status === "restored";
  }, []);

  return { isPremium: isSubscribed, requirePremium, openPaywall, restore };
}
