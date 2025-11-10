import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import ApiTestScreen from './api-test';
import CustomDrawerContent from './CustomDrawerContent';
import HomeScreen from './home';
import ShowroomScreen from './showroom';

const Drawer = createDrawerNavigator();

export default function DrawerLayout() {
    const { isLoading, session } = useAuth();
    const { colors } = useTheme();

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
                options={{
                    title: 'Geliom 🌿',
                    drawerLabel: 'Ana Sayfa',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
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
        </Drawer.Navigator>
    );
}
