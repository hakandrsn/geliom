import { useUpdateUser } from '@/api/users';
import { Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomSheet } from '@/contexts/BottomSheetContext';
import { useTheme } from '@/contexts/ThemeContext';
import { openPrivacyPolicy, openTermsOfUse } from '@/utils/linking';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { colors, toggleTheme, isDark } = useTheme();
    const { user, signOut } = useAuth();
    const { closeBottomSheet } = useBottomSheet();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [editNameModalVisible, setEditNameModalVisible] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const updateUserMutation = useUpdateUser();

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
        router.push('/(drawer)/settings');
    };

    const handleHelpSupport = () => {
        props.navigation.closeDrawer();
        router.push('/(drawer)/help-support');
    };

    const handlePrivacy = () => {
        props.navigation.closeDrawer();
        openPrivacyPolicy();
    };

    const handleTerms = () => {
        props.navigation.closeDrawer();
        openTermsOfUse();
    };

    const handleEditName = () => {
        setNewDisplayName(user?.display_name || '');
        setEditNameModalVisible(true);
    };

    const handleSaveDisplayName = () => {
        if (!user?.id) return;
        if (!newDisplayName.trim()) {
            Alert.alert('Hata', 'İsim boş olamaz');
            return;
        }

        updateUserMutation.mutate(
            { id: user.id, updates: { display_name: newDisplayName.trim() } },
            {
                onSuccess: () => {
                    setEditNameModalVisible(false);
                    Alert.alert('Başarılı', 'İsminiz güncellendi');
                },
                onError: (error) => {
                    Alert.alert('Hata', 'İsim güncellenirken bir hata oluştu');
                    console.error('Display name update error:', error);
                },
            }
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
                    }
                ]}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Typography variant="h4" color={colors.white}>
                        {user?.display_name?.charAt(0).toUpperCase() || 'G'}
                    </Typography>
                </View>
                <View style={styles.profileInfo}>
                    <View style={styles.nameContainer}>
                        <Typography variant="h5" color={colors.text} style={styles.profileName}>
                            {user?.display_name || 'Geliom User'}
                        </Typography>
                        <TouchableOpacity onPress={handleEditName} style={styles.editIcon}>
                            <Ionicons name="pencil" size={16} color={colors.secondaryText} />
                        </TouchableOpacity>
                    </View>
                    <Typography variant="caption" color={colors.secondaryText}>
                        {user?.email || 'user@geliom.app'}
                    </Typography>
                </View>
            </View>

            {/* Navigation Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                <DrawerItem
                    label="Gruplar"
                    onPress={() => props.navigation.navigate('home')}
                    icon={({ color, size }) => <Ionicons name="people" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    focused={props.state.index === 0}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                {/* Tema Değişikliği with Switch */}
                <View style={[styles.themeItem, { backgroundColor: 'transparent' }]}>
                    <View style={styles.themeLeft}>
                        <Ionicons 
                            name={isDark ? "moon" : "sunny"} 
                            size={22} 
                            color={colors.secondaryText} 
                            style={styles.themeIcon}
                        />
                        <Typography variant="body" color={colors.text} style={styles.drawerLabel}>
                            Tema
                        </Typography>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: colors.stroke, true: colors.primary + '80' }}
                        thumbColor={isDark ? colors.primary : colors.white}
                    />
                </View>

                <DrawerItem
                    label="Gizlilik Politikası"
                    onPress={handlePrivacy}
                    icon={({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                    style={styles.externalLinkItem}
                />

                <DrawerItem
                    label="Kullanım Şartları"
                    onPress={handleTerms}
                    icon={({ color, size }) => <Ionicons name="document-text" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                    style={styles.externalLinkItem}
                />

                <DrawerItem
                    label="Yardım & Destek"
                    onPress={handleHelpSupport}
                    icon={({ color, size }) => <Ionicons name="help-circle" size={size} color={color} />}
                    labelStyle={[styles.drawerLabel, { color: colors.text }]}
                    activeTintColor={colors.primary}
                    inactiveTintColor={colors.secondaryText}
                />

                <DrawerItem
                    label="Ayarlar"
                    onPress={handleSettings}
                    icon={({ color, size }) => <Ionicons name="settings" size={size} color={color} />}
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
                        👥 Birlikte daha güçlü
                    </Typography>
                </View>
            </View>

            {/* Edit Display Name Modal */}
            <Modal
                visible={editNameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditNameModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setEditNameModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <Typography variant="h4" color={colors.text} style={styles.modalTitle}>
                            İsminizi Düzenleyin
                        </Typography>
                        
                        <TextInput
                            style={[styles.textInput, { 
                                backgroundColor: colors.background, 
                                color: colors.text,
                                borderColor: colors.stroke 
                            }]}
                            value={newDisplayName}
                            onChangeText={setNewDisplayName}
                            placeholder="İsminiz"
                            placeholderTextColor={colors.secondaryText}
                            autoFocus
                            maxLength={50}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.stroke }]}
                                onPress={() => setEditNameModalVisible(false)}
                            >
                                <Typography variant="body" color={colors.text}>
                                    İptal
                                </Typography>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleSaveDisplayName}
                                disabled={updateUserMutation.isPending}
                            >
                                <Typography variant="body" color={colors.white}>
                                    {updateUserMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileName: {
        marginBottom: 4,
    },
    editIcon: {
        padding: 4,
    },
    scrollContent: {
        paddingTop: 0,
    },
    drawerLabel: {
        fontFamily: 'Comfortaa-Medium',
        fontSize: 16,
        marginLeft: 4,
    },
    themeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 8,
        marginVertical: 4,
    },
    themeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    themeIcon: {
        marginRight: 4,
    },
    externalLinkItem: {
        position: 'relative',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Comfortaa-Medium',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
});

export default CustomDrawerContent;
