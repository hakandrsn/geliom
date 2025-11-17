import { CustomDrawerContent } from '@/components';
import { GroupHeader, GroupListBottomSheet } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function DrawerLayout() {
    const { isLoading, session } = useAuth();
    const { selectedGroup, groups } = useGroupContext();
    const { openBottomSheet } = useBottomSheet();
    const { colors } = useTheme();
    const router = useRouter();

    const createHandleGroupHeaderPress = useCallback((navigation: any) => {
        return () => {
            // Eğer grup yoksa, direkt create-group sayfasına git
            if (!selectedGroup || groups.length === 0) {
                // Expo Router kullanarak navigate et
                router.push('/(drawer)/(group)/create-group');
                return;
            }
            
            // Grup varsa bottom sheet aç
            openBottomSheet(<GroupListBottomSheet />, {
                snapPoints: ['70%'],
                enablePanDownToClose: true,
            });
        };
    }, [openBottomSheet, selectedGroup, groups, router]);

    // Loading state
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Auth olmamış kullanıcıları redirect et
    if (!session) {
        return null; // Auth layout handle edecek
    }

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: colors.background,
                    shadowColor: 'transparent',
                    elevation: 0,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontFamily: 'Comfortaa-SemiBold',
                    fontSize: 18,
                },
                drawerStyle: {
                    backgroundColor: colors.background,
                    width: '80%',
                },
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.secondaryText,
                drawerLabelStyle: {
                    fontFamily: 'Comfortaa-Medium',
                    fontSize: 16,
                },
            }}
        >
            <Drawer.Screen
                name="home"
                options={({ navigation }) => ({
                    headerTitle: () => <GroupHeader group={selectedGroup} onPress={createHandleGroupHeaderPress(navigation)} />,
                    drawerLabel: 'Ana Sayfa',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                })}
            />
            <Drawer.Screen
                name="showroom"
                options={{
                    title: 'Component Showroom',
                    drawerLabel: 'Showroom',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="color-palette" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="api-test"
                options={{
                    title: 'API Test',
                    drawerLabel: 'API Test',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="code-slash" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="(group)"
                options={{
                    headerShown: false, // Stack navigator kendi header'ını kullanacak
                    drawerItemStyle: { display: 'none' }, // Drawer menüsünde gösterme
                }}
            />
        </Drawer>
    );
}
