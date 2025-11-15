import { GroupHeader } from '@/components/shared/GroupHeader';
import { GroupListBottomSheet } from '@/components/shared/GroupListBottomSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import GroupStackLayout from './(group)/_layout';
import ApiTestScreen from './api-test';
import CustomDrawerContent from './CustomDrawerContent';
import HomeScreen from './home';
import ShowroomScreen from './showroom';

const Drawer = createDrawerNavigator();

type DrawerParamList = {
    home: undefined;
    showroom: undefined;
    'api-test': undefined;
    '(group)': undefined;
};

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
        <Drawer.Navigator
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
                component={HomeScreen}
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
                component={ShowroomScreen}
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
                component={ApiTestScreen}
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
                component={GroupStackLayout}
                options={{
                    headerShown: false, // Stack navigator kendi header'ını kullanacak
                    drawerItemStyle: { display: 'none' }, // Drawer menüsünde gösterme
                }}
            />
        </Drawer.Navigator>
    );
}
