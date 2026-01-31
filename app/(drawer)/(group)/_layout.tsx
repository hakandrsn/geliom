import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

export default function GroupStackLayout() {
  // Example logic, pending requests only visible to owner usually
  // const isOwner = selectedGroup?.owner_id === user?.id;

  // Note: join requests hook might return empty if not owner/admin
  // const { data: joinRequests = [] } = useGroupJoinRequests(selectedGroup?.id || '');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="create-group" />
      <Stack.Screen name="join-group" />
      <Stack.Screen name="join-requests" />
      <Stack.Screen name="search-user" />
      <Stack.Screen name="manage-members" />
      <Stack.Screen name="group-management" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
  // Styles kept for potential header usage if enabled
});
