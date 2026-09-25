import { useUpdateUser, useUpdateUserAvatar } from "@/api/users";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { TextInputSheet } from "@/components/bottomsheets";
import { AvatarSelector, Typography } from "@/components/shared";
import { Avatar, IconButton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { spacing } from "@/theme/tokens";
import { fonts } from "@/theme/typography";
import { getAppVersionLabel } from "@/utils/app-info";
import { openPrivacyPolicy, openTermsOfUse } from "@/utils/linking";
import auth from "@react-native-firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "expo-router/drawer";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, clearState } = useAppStore();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const updateUserMutation = useUpdateUser();
  const updateAvatar = useUpdateUserAvatar();

  const signOut = async () => {
    try {
      // Firebase oturumunu kapat — _layout'taki auth listener socket + push
      // bağlantılarını (disconnectUserServices) buradan tetiklenerek kapatır
      await auth().signOut();
      clearState(); // Clear app store state
      router.replace("/(auth)/login"); // Redirect to login
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

  const handleEditAvatar = () => {
    if (!user) return;
    props.navigation.closeDrawer();
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

  const handleEditName = () => {
    props.navigation.closeDrawer();
    openBottomSheet(
      <TextInputSheet
        title="İsmini Düzenle"
        description="Grup arkadaşların seni bu isimle görür."
        initialValue={user?.displayName || ""}
        placeholder="İsmin"
        maxLength={50}
        onCancel={closeBottomSheet}
        onSave={async (displayName) => {
          try {
            await updateUserMutation.mutateAsync({ displayName });
            closeBottomSheet();
          } catch (error) {
            closeBottomSheet();
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("Display name update error:", errorMessage);
            Alert.alert("Hata", "İsim güncellenirken bir hata oluştu");
          }
        }}
      />,
      { snapPoints: ["45%"] },
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
        {/* Avatara dokununca karakter seçici açılır */}
        <BouncyButton onPress={handleEditAvatar} style={styles.avatar}>
          <Avatar photoUrl={user?.photoUrl} name={user?.displayName} seed={user?.id} size={56} />
          <View style={[styles.avatarEdit, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name="brush" size={10} color="#FFFFFF" />
          </View>
        </BouncyButton>
        <View style={styles.profileInfo}>
          <View style={styles.nameContainer}>
            <Typography
              variant="h5"
              color={colors.text}
              numberOfLines={1}
              style={styles.profileName}
            >
              {user?.displayName || "Geliom Kullanıcısı"}
            </Typography>
            <IconButton
              icon="pencil"
              variant="ghost"
              size={32}
              iconSize={16}
              color={colors.secondaryText}
              onPress={handleEditName}
            />
          </View>
          {user?.customId && (
            <Typography variant="caption" color={colors.lightText}>
              @{user.customId}
            </Typography>
          )}
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
        style={[
          styles.bottomSection,
          { paddingBottom: insets.bottom + 20, borderTopColor: colors.stroke },
        ]}
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
          <Typography variant="caption" color={colors.lightText}>
            Sürüm {getAppVersionLabel()}
          </Typography>
        </View>
      </View>

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
    marginRight: spacing.lg,
  },
  avatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  drawerLabel: {
    fontFamily: fonts.medium,
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
  },
  appInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: "center",
  },
});

export default CustomDrawerContent;
