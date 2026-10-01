import { useDeleteUser } from "@/api";
import { ConfirmSheet } from "@/components/bottomsheets";
import { BaseLayout, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { showPremiumWelcome } from "@/components/monetization/PremiumWelcomeModal";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";

const CONFIRM_SHEET_HEIGHT = 380;

export default function SettingsScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, groups } = useAppStore();
  const router = useRouter();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();
  const { isNotificationsEnabled } = useNotificationSettings();
  const { isPremium, restore } = usePremiumGate();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  };

  const mutedCount = groups.filter((g) => g.notifications && !g.notifications.enabled).length;
  const notificationsSubtitle = !isNotificationsEnabled
    ? "Kapalı"
    : mutedCount > 0
      ? `Açık · ${mutedCount} grup sessizde`
      : "Açık";

  const ownedGroupCount = groups.filter((g) => g.ownerId === user?.id).length;

  const performDelete = async () => {
    try {
      await deleteUser.mutateAsync();
      closeBottomSheet();
      // Backend Firebase Auth kaydını da sildi — lokal oturumu kapat
      await auth().signOut().catch(() => {});
      router.replace("/(auth)/login");
    } catch (error: any) {
      closeBottomSheet();
      const backendMessage = error?.response?.data?.message;
      Alert.alert(
        "Hata",
        (Array.isArray(backendMessage) ? backendMessage[0] : backendMessage) ||
          "Hesap silinemedi. Lütfen tekrar deneyin.",
      );
    }
  };

  // App Store 5.1.1(v): uygulama içi hesap silme zorunlu. İki adım:
  // 1) ne olacağını anlatan bilgilendirme, 2) geri dönülmez son onay.
  const handleDeleteAccount = () => {
    openBottomSheet(
      <ConfirmSheet
        icon="warning-outline"
        title="Hesabını silmek üzeresin"
        message={
          ownedGroupCount > 0
            ? `Yöneticisi olduğun ${ownedGroupCount} grup tamamen silinir ve üyeleri gruba erişemez. Üyesi olduğun diğer gruplardan çıkarılırsın; durum kayıtların ve profilin kalıcı olarak silinir.`
            : "Üyesi olduğun gruplardan çıkarılırsın; durum kayıtların ve profilin kalıcı olarak silinir. Aynı hesapla tekrar giriş yaparsan sıfırdan başlarsın."
        }
        confirmLabel="Devam Et"
        cancelLabel="Vazgeç"
        onCancel={closeBottomSheet}
        onConfirm={() => {
          openBottomSheet(
            <ConfirmSheet
              icon="trash-outline"
              title="Son onay"
              message="Bu işlem geri alınamaz. Hesabını ve tüm verilerini kalıcı olarak silmek istediğine emin misin?"
              confirmLabel="Hesabımı Sil"
              cancelLabel="Vazgeç"
              destructive
              onCancel={closeBottomSheet}
              onConfirm={performDelete}
            />,
            { snapPoints: [CONFIRM_SHEET_HEIGHT] },
          );
        }}
      />,
      { snapPoints: [CONFIRM_SHEET_HEIGHT] },
    );
  };

  const handleClearCache = () => {
    openBottomSheet(
      <ConfirmSheet
        icon="refresh-outline"
        title="Önbelleği Temizle"
        message="Önbelleğe alınmış veriler silinir; gruplar ve durumlar sunucudan yeniden yüklenir. Oturumun açık kalır."
        confirmLabel="Temizle"
        onCancel={closeBottomSheet}
        onConfirm={() => {
          queryClient.clear();
          closeBottomSheet();
        }}
      />,
      { snapPoints: [CONFIRM_SHEET_HEIGHT - 40] },
    );
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          PREMIUM
        </Typography>
        <ListItem
          icon="diamond-outline"
          iconColor={colors.warning}
          title="Premium Avantajları"
          subtitle={isPremium ? "Aktif · aboneliğini yönet" : "Daha fazla grup, üye ve özel seçenek"}
          onPress={() => router.push("/(drawer)/premium")}
        />
        <ListItem
          icon="refresh-outline"
          iconColor={colors.text}
          title="Satın Alımları Geri Yükle"
          subtitle={isRestoring ? "Kontrol ediliyor…" : "Önceki aboneliğini bu cihaza getir"}
          onPress={handleRestore}
          disabled={isRestoring}
        />

        {/* Genel */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          GENEL
        </Typography>
        <ListItem
          icon={isDark ? "moon" : "sunny"}
          iconColor={colors.text}
          title="Koyu Tema"
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.stroke, true: colors.passiveState }}
              thumbColor={isDark ? colors.primary : colors.white}
            />
          }
        />
        <ListItem
          icon="notifications-outline"
          iconColor={colors.text}
          title="Bildirimler"
          subtitle={notificationsSubtitle}
          onPress={() => router.push("/(drawer)/notifications")}
        />
        <ListItem
          icon="refresh-outline"
          iconColor={colors.text}
          title="Önbelleği Temizle"
          subtitle="Veriler sunucudan yeniden yüklenir"
          onPress={handleClearCache}
        />

        {/* Gizlilik */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          GİZLİLİK
        </Typography>
        <ListItem
          icon="shield-checkmark-outline"
          iconColor={colors.text}
          title="Gizlilik ve Veriler"
          subtitle="Neleri sakladığımız, hata raporları, belgeler"
          onPress={() => router.push("/(drawer)/privacy")}
        />

        {/* Destek */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          DESTEK
        </Typography>
        <ListItem
          icon="help-circle-outline"
          iconColor={colors.text}
          title="Yardım & Destek"
          subtitle="SSS, bize yaz, e-posta"
          onPress={() => router.push("/(drawer)/help-support")}
        />

        {/* Yalnızca geliştirmede — release build'de görünmez */}
        {__DEV__ && (
          <>
            <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
              GELİŞTİRİCİ
            </Typography>
            <ListItem
              icon="sparkles-outline"
              iconColor={colors.text}
              title="Premium karşılama modalını göster"
              subtitle="Abonelik başlangıcı animasyonunu test et"
              onPress={showPremiumWelcome}
            />
          </>
        )}

        {/* Tehlikeli bölge — en altta, görsel olarak ayrılmış */}
        <View style={[styles.dangerZone, { borderColor: colors.error + "55" }]}>
          <View style={styles.dangerHeader}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Typography variant="label" fontWeight="semibold" color={colors.error} style={styles.dangerTitle}>
              TEHLİKELİ BÖLGE
            </Typography>
          </View>
          <ListItem
            icon="person-remove-outline"
            title="Hesabı Sil"
            subtitle="Tüm verilerin kalıcı olarak silinir. Geri alınamaz."
            destructive
            onPress={handleDeleteAccount}
          />
        </View>

        {user?.customId && (
          <Typography variant="caption" color={colors.lightText} style={styles.accountInfo}>
            Hesap: @{user.customId}
          </Typography>
        )}
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  dangerZone: {
    marginTop: spacing.xxxl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dangerTitle: {
    letterSpacing: 1,
  },
  accountInfo: {
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
