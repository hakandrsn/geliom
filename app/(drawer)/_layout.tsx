import { GroupListBottomSheet } from "@/components/bottomsheets";
import { IconButton } from "@/components/ui";
import { fonts } from "@/theme/typography";
import { useAppStore } from "@/store/useAppStore"; // Added Store
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
import { CustomDrawerContent } from "../../components";
import { GroupHeader } from "../../components/shared";
// Removed Contexts
import { useBottomSheet } from "../../contexts/BottomSheetContext";
import { useTheme } from "../../contexts/ThemeContext";

/** Grup seçici sheet yüksekliği: içerik kadar, ekranın %70'ini geçmez. */
const groupSheetHeight = (groupCount: number) => {
  const chrome = 24 + 56 + 76 + 48; // tutamaç + başlık + aksiyonlar + alt boşluk (home bar)
  const rows = Math.max(groupCount, 1) * 72;
  const emptyState = groupCount === 0 ? 220 : 0;
  return Math.min(Math.round(Dimensions.get("window").height * 0.7), chrome + rows + emptyState);
};

export default function DrawerLayout() {
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { openBottomSheet } = useBottomSheet();
  const { colors } = useTheme();
  const router = useRouter();

  const isLoading = false; // Auth check handled in root layout or store initialization
  const session = !!user; // Derived from store

  const createHandleGroupHeaderPress = useCallback(
    (navigation: any) => {
      return () => {
        if (!selectedGroup || groups.length === 0) {
          router.push("/create-group");
          return;
        }

        // Her açılışta yeni key ile render et - context güncellemelerini almak için.
        // Yükseklik içeriğe göre: başlık + satırlar + aksiyonlar; en fazla %70
        openBottomSheet(<GroupListBottomSheet key={Date.now()} />, {
          snapPoints: [groupSheetHeight(groups.length)],
          enablePanDownToClose: true,
        });
      };
    },
    [openBottomSheet, selectedGroup, groups, router],
  );

  const handleGroupManagementPress = () => {
    if (selectedGroup) {
      router.push("/(drawer)/(group)/group-management");
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) return null;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: fonts.semibold,
        },
        headerTitleAlign: "center", // Başlığı ortala
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.secondaryText,
        drawerLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen
        name="home"
        options={({ navigation }) => ({
          headerTitle: () => (
            <GroupHeader
              group={selectedGroup ?? null}
              onPress={createHandleGroupHeaderPress(navigation)}
            />
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {selectedGroup && (
                <IconButton
                  icon="settings-outline"
                  size={36}
                  iconSize={18}
                  onPress={handleGroupManagementPress}
                />
              )}
            </View>
          ),
          drawerLabel: "Ana Sayfa",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        })}
      />
      {/* Diğer ekranları gizliyoruz, single page hissi için */}
      <Drawer.Screen
        name="showroom"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="(group)"
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="search-user"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="help-support"
        options={{
          title: "Yardım & Destek",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="premium"
        options={{
          title: "Premium",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          title: "Bildirimler",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="privacy"
        options={{
          title: "Gizlilik",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
});
