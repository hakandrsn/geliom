import { useDeleteUser } from "@/api";
import { BaseLayout, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Switch, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function SettingsScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user } = useAppStore();
  const router = useRouter();
  const deleteUser = useDeleteUser();

  // Notification Hook
  const { isNotificationsEnabled, toggleNotifications } =
    useNotificationSettings();

  // App Store 5.1.1(v): hesap oluşturulabilen uygulamada uygulama içi hesap silme zorunlu
  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınız kalıcı olarak silinecek. Sahibi olduğunuz gruplar tamamen silinir, üyesi olduklarınızdan çıkarılırsınız. Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Devam Et",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Emin misiniz?",
              "Tüm verileriniz kalıcı olarak silinecek.",
              [
                { text: "Vazgeç", style: "cancel" },
                {
                  text: "Hesabımı Sil",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteUser.mutateAsync();
                      // Backend Firebase Auth kaydını da sildi — lokal oturumu kapat
                      await auth().signOut().catch(() => {});
                      router.replace("/(auth)/login");
                    } catch (error: any) {
                      const backendMessage = error?.response?.data?.message;
                      Alert.alert(
                        "Hata",
                        (Array.isArray(backendMessage)
                          ? backendMessage[0]
                          : backendMessage) ||
                          "Hesap silinemedi. Lütfen tekrar deneyin.",
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert("Gizlilik", "Gizlilik ayarları yakında eklenecek");
  };

  const handleLanguageSettings = () => {
    Alert.alert("Dil", "Dil ayarları yakında eklenecek");
  };

  const handleClearCache = () => {
    Alert.alert("Önbelleği Temizle", "Önbelleğiniz temizlensin mi?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Temizle",
        onPress: () => Alert.alert("Başarılı", "Önbellek temizlendi"),
      },
    ]);
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Genel Ayarlar */}
          <Typography
            variant="label"
            fontWeight="semibold"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
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
            icon="notifications"
            iconColor={colors.text}
            title="Bildirimler"
            right={
              <Switch
                value={isNotificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.stroke, true: colors.passiveState }}
                thumbColor={
                  isNotificationsEnabled ? colors.primary : colors.white
                }
              />
            }
          />

          <ListItem
            icon="language"
            iconColor={colors.text}
            title="Dil"
            subtitle="Türkçe"
            onPress={handleLanguageSettings}
          />

          {/* Gizlilik & Güvenlik */}
          <Typography
            variant="label"
            fontWeight="semibold"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
            GİZLİLİK & GÜVENLİK
          </Typography>

          <ListItem
            icon="shield-checkmark"
            iconColor={colors.text}
            title="Gizlilik Ayarları"
            onPress={handlePrivacySettings}
          />

          {/* Diğer */}
          <Typography
            variant="label"
            fontWeight="semibold"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
            DİĞER
          </Typography>

          <ListItem
            icon="trash"
            title="Önbelleği Temizle"
            destructive
            onPress={handleClearCache}
          />

          <ListItem
            icon="person-remove"
            title="Hesabı Sil"
            subtitle="Tüm verileriniz kalıcı olarak silinir"
            destructive
            onPress={handleDeleteAccount}
          />

          {/* Kullanıcı Bilgileri */}
          <View
            style={[
              styles.userInfo,
              { backgroundColor: colors.secondaryBackground },
            ]}
          >
            <Typography variant="caption" color={colors.secondaryText}>
              Oturum açan: {user?.customId}
            </Typography>
          </View>
        </View>
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
  },
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  userInfo: {
    marginTop: spacing.xxxl,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
});
