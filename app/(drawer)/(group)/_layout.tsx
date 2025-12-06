import { useGroupJoinRequests } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function GroupStackLayout() {
  const { selectedGroup } = useGroupContext();
  const { user } = useAuth();
  const { colors } = useTheme();
  const isOwner = selectedGroup?.owner_id === user?.id;
  const { data: joinRequests = [] } = useGroupJoinRequests(selectedGroup?.id || '', 'pending');
  const pendingRequestsCount = joinRequests.length;
  const handleJoinRequestsPress = () => {
    if (selectedGroup) {
      router.push('/(drawer)/(group)/join-requests');
    }
  };


  return (
    <Stack
      screenOptions={{
        headerShown: false, // Tüm stack ekranlarında header kapalı
      }}
    >
      <Stack.Screen
        name="create-group"

      />
      <Stack.Screen
        name="join-group"

      />
      <Stack.Screen
        name="join-requests"

      />
      <Stack.Screen
        name="search-user"

      />
      <Stack.Screen
        name="manage-members"

      />
      <Stack.Screen
        name="group-management"
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});