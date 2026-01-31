import { BaseLayout, Typography } from "@/components/shared";
// Removed Contexts
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

// ... (keep file content structure)

export default function SettingsScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user } = useAppStore();
  const router = useRouter();

  // Notification Hook
  const { isNotificationsEnabled, toggleNotifications, openSettings } =
    useNotificationSettings();

  const handleNotificationPress = () => {
    openSettings();
  };

  const handlePrivacySettings = () => {
    Alert.alert("Gizlilik", "Gizlilik ayarları yakında eklenecek");
  };
  // ...

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
            variant="h6"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
            GENEL
          </Typography>

          <View
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={22}
                color={colors.text}
              />
              <Typography
                variant="body"
                color={colors.text}
                style={styles.settingText}
              >
                Koyu Tema
              </Typography>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.stroke, true: colors.primary + "80" }}
              thumbColor={isDark ? colors.primary : colors.white}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
            activeOpacity={1}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={22} color={colors.text} />
              <Typography
                variant="body"
                color={colors.text}
                style={styles.settingText}
              >
                Bildirimler
              </Typography>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.stroke, true: colors.primary + "80" }}
              thumbColor={
                isNotificationsEnabled ? colors.primary : colors.white
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
            onPress={handleLanguageSettings}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={22} color={colors.text} />
              <Typography
                variant="body"
                color={colors.text}
                style={styles.settingText}
              >
                Dil
              </Typography>
            </View>
            <View style={styles.settingRight}>
              <Typography
                variant="caption"
                color={colors.secondaryText}
                style={{ marginRight: 8 }}
              >
                Türkçe
              </Typography>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.secondaryText}
              />
            </View>
          </TouchableOpacity>

          {/* Gizlilik & Güvenlik */}
          <Typography
            variant="h6"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
            GİZLİLİK & GÜVENLİK
          </Typography>

          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
            onPress={handlePrivacySettings}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={22} color={colors.text} />
              <Typography
                variant="body"
                color={colors.text}
                style={styles.settingText}
              >
                Gizlilik Ayarları
              </Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>

          {/* Diğer */}
          <Typography
            variant="h6"
            color={colors.secondaryText}
            style={styles.sectionTitle}
          >
            DİĞER
          </Typography>

          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash" size={22} color={colors.error} />
              <Typography
                variant="body"
                color={colors.error}
                style={styles.settingText}
              >
                Önbelleği Temizle
              </Typography>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.secondaryText}
            />
          </TouchableOpacity>

          {/* Kullanıcı Bilgileri */}
          <View
            style={[
              styles.userInfo,
              {
                backgroundColor: colors.secondaryBackground,
                borderColor: colors.stroke,
              },
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
    padding: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    marginLeft: 12,
  },
  userInfo: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
});
