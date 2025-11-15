import { Stack } from 'expo-router';
import React from 'react';

export default function GroupStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Tüm stack ekranlarında header kapalı
      }}
    >
      <Stack.Screen
        name="create-group"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

