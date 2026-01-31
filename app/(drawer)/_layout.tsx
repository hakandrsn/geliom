import { useGroupJoinRequestsRealtime } from "@/api/groups";
import { GroupListBottomSheet } from "@/components/bottomsheets";
import { useAppStore } from "@/store/useAppStore"; // Added Store
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomDrawerContent } from "../../components";
import { GroupHeader } from "../../components/shared";
// Removed Contexts
import { useBottomSheet } from "../../contexts/BottomSheetContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function DrawerLayout() {
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { openBottomSheet } = useBottomSheet();
  const { colors } = useTheme();
  const router = useRouter();

  const isLoading = false; // Auth check handled in root layout or store initialization
  const session = !!user; // Derived from store

  // Realtime subscription
  useGroupJoinRequestsRealtime(selectedGroup?.id || "");

  const createHandleGroupHeaderPress = useCallback(
    (navigation: any) => {
      return () => {
        if (!selectedGroup || groups.length === 0) {
          router.push("/(drawer)/(group)/create-group");
          return;
        }

        // Her açılışta yeni key ile render et - context güncellemelerini almak için
        openBottomSheet(<GroupListBottomSheet key={Date.now()} />, {
          snapPoints: ["60%"],
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

  const handleJoinRequestsPress = () => {
    if (selectedGroup) {
      router.push("/(drawer)/(group)/join-requests");
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
          fontFamily: "Comfortaa-SemiBold",
        },
        headerTitleAlign: "center", // Başlığı ortala
        drawerStyle: {
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.secondaryText,
        drawerLabelStyle: {
          fontFamily: "Comfortaa-Medium",
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen
        name="home"
        options={({ navigation }) => ({
          headerTitle: () => (
            <GroupHeader
              group={selectedGroup}
              onPress={createHandleGroupHeaderPress(navigation)}
            />
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {selectedGroup && (
                <TouchableOpacity
                  onPress={handleGroupManagementPress}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.cardBackground + "80",
                      borderColor: colors.stroke,
                    },
                  ]}
                >
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
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
        name="api-test"
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
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
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
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});
