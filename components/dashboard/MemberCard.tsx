import { Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { DashboardMember } from "@/api/dashboard";
import { getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface MemberCardProps {
    member: DashboardMember; // YENİ TİP
    isMe?: boolean;
    onPress?: () => void;
}

function MemberCard({ member, isMe, onPress }: MemberCardProps) {
    const { colors } = useTheme();

    // Animation Values
    const moodScale = useSharedValue(1);
    const statusOpacity = useSharedValue(0);

    // Status değiştiğinde glow efekti
    useEffect(() => {
        if (member.status_text) {
            statusOpacity.value = withSequence(
                withTiming(1, { duration: 300 }),
                withRepeat(withTiming(0.5, { duration: 800 }), 2, true),
                withTiming(0, { duration: 300 })
            );
        }
    }, [member.status_id]); // ID değiştiğinde tetikle

    // Mood değiştiğinde scale efekti
    useEffect(() => {
        if (member.mood_emoji) {
            moodScale.value = withSequence(
                withSpring(1.5),
                withSpring(1)
            );
        }
    }, [member.mood_id]);

    const animatedMoodStyle = useAnimatedStyle(() => ({
        transform: [{ scale: moodScale.value }],
    }));

    const animatedStatusGlowStyle = useAnimatedStyle(() => ({
        opacity: statusOpacity.value,
    }));

    const displayName = member.nickname || member.display_name || member.custom_user_id || '';
    const realName = member.nickname ? (member.display_name || member.custom_user_id) : undefined;

    const statusColor = member.status_is_custom
        ? colors.primary
        : (member.status_notifies ? colors.warning : colors.secondaryText);

    const cardContent = (
        <View style={[
            styles.container,
            {
                backgroundColor: isMe ? colors.tertiary + '20' : colors.cardBackground,
                borderColor: isMe ? colors.primary : colors.stroke,
            }
        ]}>
            {/* Glow Effect */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: statusColor, borderRadius: 16 },
                    animatedStatusGlowStyle
                ]}
            />

            <View style={styles.contentWrapper}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.tertiary }]}>
                    <Image
                        source={getAvatarSource(member.photo_url)}
                        style={styles.avatarImage}
                        contentFit="cover"
                    />
                    {member.mood_emoji && (
                        <Animated.View style={[styles.moodBadge, animatedMoodStyle]}>
                            <Typography variant="h6">{member.mood_emoji}</Typography>
                        </Animated.View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                            <Typography
                                variant="body"
                                fontWeight="semibold"
                                color={colors.text}
                                numberOfLines={1}
                            >
                                {displayName} {isMe && '(Sen)'}
                            </Typography>
                            {realName && (
                                <Typography
                                    variant="caption"
                                    color={colors.secondaryText}
                                    numberOfLines={1}
                                    style={{ marginTop: 2 }}
                                >
                                    {realName}
                                </Typography>
                            )}
                        </View>
                    </View>

                    {member.status_text ? (
                        <View style={styles.statusRow}>
                            <Ionicons name="radio-button-on" size={12} color={statusColor} />
                            <Typography
                                variant="caption"
                                color={statusColor}
                                numberOfLines={1}
                                style={{ marginLeft: 4, flex: 1 }}
                            >
                                {member.status_text}
                            </Typography>
                        </View>
                    ) : (
                        <Typography variant="caption" color={colors.secondaryText} style={{ fontStyle: 'italic' }}>
                            Durum yok
                        </Typography>
                    )}
                </View>
            </View>
        </View>
    );

    if (onPress && !isMe) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    contentWrapper: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    moodBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default React.memo(MemberCard);