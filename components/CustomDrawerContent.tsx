import { Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { colors, toggleTheme, isDark } = useTheme();
    const { user, signOut } = useAuth();
    const { closeBottomSheet } = useBottomSheet();
    const insets = useSafeAreaInsets();

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
        console.log('Navigate to Settings');
    };

    const handlePrivacy = () => {
        props.navigation.closeDrawer();
        console.log('Navigate to Privacy Policy');
    };

    const handleTerms = () => {
        props.navigation.closeDrawer();
        console.log('Navigate to Terms of Service');
    };

    const handleProfile = () => {
        props.navigation.closeDrawer();
        console.log('Navigate to Profile');
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
                    }
                ]}
            >
                <View style={[styles.avatar, { backgroundColor: colors.forest }]}>
                    <Typography variant="h4" color={colors.white}>
                        {user?.display_name?.charAt(0).toUpperCase() || 'G'}
                    </Typography>
                </View>
                <View style={styles.profileInfo}>
                    <Typography variant="h5" color={colors.text} style={styles.profileName}>
                        {user?.display_name || 'Geliom User'}
                    </Typography>
                    <Typography variant="caption" color={colors.secondaryText}>
                        {user?.email || 'user@geliom.app'}
                    </Typography>
                    <TouchableOpacity
                        style={[styles.profileButton, { backgroundColor: colors.sage }]}
                        onPress={handleProfile}
                    >
                        <Typography variant="caption" color={colors.white}>
                            Profili Görüntüle
                        </Typography>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Navigation Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                <DrawerItem
                    label="Ana Sayfa"
                    onPress={() => props.navigation.navigate('home')}
                    icon={({ color, size }) => <Ionicons name="home" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    focused={props.state.index === 0}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="Showroom"
                    onPress={() => props.navigation.navigate('showroom')}
                    icon={({ color, size }) => <Ionicons name="color-palette" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    focused={props.state.index === 1}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="API Test"
                    onPress={() => props.navigation.navigate('api-test')}
                    icon={({ color, size }) => <Ionicons name="code-slash" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    focused={props.state.index === 2}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.stroke }]} />

                {/* Settings Items */}
                <DrawerItem
                    label="Ayarlar"
                    onPress={handleSettings}
                    icon={({ color, size }) => <Ionicons name="settings" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label={isDark ? "Açık Tema" : "Koyu Tema"}
                    onPress={toggleTheme}
                    icon={({ color, size }) => (
                        <Ionicons name={isDark ? "sunny" : "moon"} size={size} color={color} />
                    )}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="Gizlilik Politikası"
                    onPress={handlePrivacy}
                    icon={({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="Kullanım Şartları"
                    onPress={handleTerms}
                    icon={({ color, size }) => <Ionicons name="document-text" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="Yardım & Destek"
                    onPress={() => {
                        props.navigation.closeDrawer();
                        console.log('Navigate to Help');
                    }}
                    icon={({ color, size }) => <Ionicons name="help-circle" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />
            </DrawerContentScrollView>

            {/* Alt Bölüm */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
                <DrawerItem
                    label="Çıkış Yap"
                    onPress={handleSignOut}
                    icon={({ color, size }) => <Ionicons name="log-out" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.error }]}
                    activeTintColor={colors.error}
                    inactiveTintColor={colors.error}
                />

                <View style={[styles.appInfo, { borderTopColor: colors.stroke }]}>
                    <Typography variant="caption" color={colors.secondaryText} style={styles.appVersion}>
                        Geliom v1.0.0
                    </Typography>
                    <Typography variant="caption" color={colors.secondaryText}>
                        🌿 Doğa ile bağlan
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        marginBottom: 4,
    },
    profileButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    scrollContent: {
        paddingTop: 0,
    },
    drawerLabel: {
        fontFamily: 'Comfortaa-Medium',
        fontSize: 16,
        marginLeft: -16,
    },
    divider: {
        height: 1,
        marginVertical: 10,
        marginHorizontal: 20,
    },
    bottomSection: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    appInfo: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    appVersion: {
        marginBottom: 4,
    },
});

export default CustomDrawerContent;
