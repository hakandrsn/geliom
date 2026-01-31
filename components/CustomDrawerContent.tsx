import { useUpdateUser } from "@/api/users";
import { Typography } from "@/components/shared";
// Removed Context
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
// import { supabase } from "@/lib/supabase"; // Removed Supabase
import { useAppStore } from "@/store/useAppStore"; // Added Store
import { getAvatarSource } from "@/utils/avatar";
import { openPrivacyPolicy, openTermsOfUse } from "@/utils/linking";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, setUser, clearState } = useAppStore(); // Use store
  const { closeBottomSheet } = useBottomSheet();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const updateUserMutation = useUpdateUser();

  // Simulate signOut without Supabase
  const signOut = async () => {
    try {
      // If there is an API call for logout (e.g. invalidate session cookie), call it here.
      // e.g. await apiClient.post('/auth/logout');
      // For now, client-side clear is what was requested/compatible with context removal.
      clearState(); // Clear app store state
      router.replace("/(auth)/welcome"); // Redirect to welcome
    } catch (e) {
      console.error("Sign out exception:", e);
    }
  };

  // Drawer açıldığında bottom sheet'i kapat
  useEffect(() => {
    closeBottomSheet();
  }, [closeBottomSheet]);

  const handleSignOut = () => {
    props.navigation.closeDrawer();
    signOut();
  };

  const handleSettings = () => {
    props.navigation.closeDrawer();
    router.push("/(drawer)/settings");
  };

  const handleHelpSupport = () => {
    props.navigation.closeDrawer();
    router.push("/(drawer)/help-support");
  };

  const handlePrivacy = () => {
    props.navigation.closeDrawer();
    openPrivacyPolicy();
  };

  const handleTerms = () => {
    props.navigation.closeDrawer();
    openTermsOfUse();
  };

  const handleEditName = () => {
    setNewDisplayName(user?.displayName || "");
    setEditNameModalVisible(true);
  };

  const handleSaveDisplayName = () => {
    if (!user?.id) return;
    if (!newDisplayName.trim()) {
      Alert.alert("Hata", "İsim boş olamaz");
      return;
    }

    updateUserMutation.mutate(
      { id: user.id, updates: { displayName: newDisplayName.trim() } },
      {
        onSuccess: () => {
          setEditNameModalVisible(false);
          Alert.alert("Başarılı", "İsminiz güncellendi");
        },
        onError: (error) => {
          Alert.alert("Hata", "İsim güncellenirken bir hata oluştu");
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("Display name update error:", errorMessage);
        },
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profil Bölümü */}
      <View
        style={[
          styles.profileSection,
          {
            borderBottomColor: colors.stroke,
            paddingTop: insets.top + 20,
          },
        ]}
      >
        <Image
          source={getAvatarSource(user?.photoUrl)}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.profileInfo}>
          <View style={styles.nameContainer}>
            <Typography
              variant="h5"
              color={colors.text}
              style={styles.profileName}
            >
              {user?.displayName || "Geliom User"}
            </Typography>
            <TouchableOpacity onPress={handleEditName} style={styles.editIcon}>
              <Ionicons name="pencil" size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <DrawerItem
          label="Gruplar"
          onPress={() => props.navigation.navigate("home")}
          icon={({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.text }]}
          focused={props.state.index === 0}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.secondaryText}
        />

        {/* Tema Değişikliği with Switch */}
        <View style={[styles.themeItem, { backgroundColor: "transparent" }]}>
          <View style={styles.themeLeft}>
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={22}
              color={colors.secondaryText}
              style={styles.themeIcon}
            />
            <Typography
              variant="body"
              color={colors.text}
              style={styles.drawerLabel}
            >
              Tema
            </Typography>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.stroke, true: colors.primary + "80" }}
            thumbColor={isDark ? colors.primary : colors.white}
          />
        </View>

        <DrawerItem
          label="Gizlilik Politikası"
          onPress={handlePrivacy}
          icon={({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.text }]}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.secondaryText}
          style={styles.externalLinkItem}
        />

        <DrawerItem
          label="Kullanım Şartları"
          onPress={handleTerms}
          icon={({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.text }]}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.secondaryText}
          style={styles.externalLinkItem}
        />

        <DrawerItem
          label="Yardım & Destek"
          onPress={handleHelpSupport}
          icon={({ color, size }) => (
            <Ionicons name="help-circle" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.text }]}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.secondaryText}
        />

        <DrawerItem
          label="Ayarlar"
          onPress={handleSettings}
          icon={({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.text }]}
          activeTintColor={colors.primary}
          inactiveTintColor={colors.secondaryText}
        />
      </DrawerContentScrollView>

      {/* Alt Bölüm */}
      <View
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}
      >
        <DrawerItem
          label="Çıkış Yap"
          onPress={handleSignOut}
          icon={({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          )}
          labelStyle={[styles.drawerLabel, { color: colors.error }]}
          activeTintColor={colors.error}
          inactiveTintColor={colors.error}
        />

        <View style={[styles.appInfo, { borderTopColor: colors.stroke }]}>
          <Typography
            variant="caption"
            color={colors.secondaryText}
            style={styles.appVersion}
          >
            Geliom v1.0.0
          </Typography>
          <Typography variant="caption" color={colors.secondaryText}>
            👥 Birlikte daha güçlü
          </Typography>
        </View>
      </View>

      {/* Edit Display Name Modal */}
      <Modal
        visible={editNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditNameModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={(e: GestureResponderEvent) => e.stopPropagation()}
          >
            <Typography
              variant="h4"
              color={colors.text}
              style={styles.modalTitle}
            >
              İsminizi Düzenleyin
            </Typography>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.stroke,
                },
              ]}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              placeholder="İsminiz"
              placeholderTextColor={colors.secondaryText}
              autoFocus
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.stroke }]}
                onPress={() => setEditNameModalVisible(false)}
              >
                <Typography variant="body" color={colors.text}>
                  İptal
                </Typography>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveDisplayName}
                disabled={updateUserMutation.isPending}
              >
                <Typography variant="body" color={colors.white}>
                  {updateUserMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Typography>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    marginBottom: 4,
  },
  editIcon: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 0,
  },
  drawerLabel: {
    fontFamily: "Comfortaa-Medium",
    fontSize: 16,
    marginLeft: 4,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  themeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeIcon: {
    marginRight: 4,
  },
  externalLinkItem: {
    position: "relative",
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  appInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: "center",
  },
  appVersion: {
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: "Comfortaa-Medium",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});

export default CustomDrawerContent;
