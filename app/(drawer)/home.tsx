import { useGroupMoodsRealtime } from "@/api/moods";
import { useGroupStatusesRealtime } from "@/api/statuses";
import { BaseLayout, Typography } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupContext } from "@/contexts/GroupContext";
import { useTheme } from "@/contexts/ThemeContext";
import { MOCK_MOODS } from "@/types/user";
import { useNavigation } from '@react-navigation/native';
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
    const { user, signOut } = useAuth();
    const { selectedGroup } = useGroupContext();
    const { colors, toggleTheme, isDark } = useTheme();
    const navigation = useNavigation();

    // Seçili grup için realtime subscription'lar
    useGroupStatusesRealtime(selectedGroup?.id || '');
    useGroupMoodsRealtime(selectedGroup?.id || '');

    return (
        <BaseLayout
            headerShow={false} // Drawer navigation kendi header'ını kullanacak
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                }}
            >
                {/* Kullanıcı Bilgileri */}
                <View style={{
                    backgroundColor: colors.cardBackground,
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 20,
                    width: '100%',
                    alignItems: 'center',
                }}>
                    <Typography variant="h3" color={colors.text} style={{ marginBottom: 8 }}>
                        Hoş Geldin! 👋
                    </Typography>
                    <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 12 }}>
                        {user?.display_name || 'Geliom User'}
                    </Typography>
                    <Typography variant="caption" color={colors.secondaryText}>
                        Bugünkü ruh halin: {MOCK_MOODS[Math.floor(Math.random() * MOCK_MOODS.length)].emoji}
                    </Typography>
                </View>

                {/* Showroom Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        borderRadius: 12,
                        marginTop: 20,
                    }}
                    onPress={() => navigation.navigate('showroom' as never)}
                >
                    <Typography
                        variant="button"
                        color={colors.white}
                        style={{ textAlign: 'center' }}
                    >
                        🎨 Component Showroom
                    </Typography>
                </TouchableOpacity>

                {/* Test Buttons */}
                <View style={{
                    flexDirection: 'row',
                    gap: 12,
                    marginTop: 20,
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <TouchableOpacity
                        style={{
                            backgroundColor: colors.secondary,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 8,
                        }}
                        onPress={toggleTheme}
                    >
                        <Typography variant="caption" color={colors.white}>
                            {isDark ? '☀️ Açık' : '🌙 Koyu'} Tema
                        </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            backgroundColor: colors.error,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 8,
                        }}
                        onPress={signOut}
                    >
                        <Typography variant="caption" color={colors.white}>
                            🚪 Çıkış Yap
                        </Typography>
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View style={{
                    backgroundColor: colors.tertiary,
                    padding: 16,
                    borderRadius: 12,
                    marginTop: 32,
                    width: '100%',
                }}>
                    <Typography variant="body" color={colors.text} style={{ textAlign: 'center' }}>
                        🌿 Geliom ile doğanın ritmine uyum sağla
                    </Typography>
                </View>
            </View>
        </BaseLayout>
    );
}
