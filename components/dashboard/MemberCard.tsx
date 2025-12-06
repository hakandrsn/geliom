import { Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser, UserGroupMoodWithMood, UserStatusWithStatus } from '@/types/database';
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
  member: GroupMemberWithUser;
  status?: UserStatusWithStatus;
  mood?: UserGroupMoodWithMood;
  isMe?: boolean;
  nickname?: string;
  variant?: 'default' | 'large'; // 'large' is now the "Minimalist Status Header"
  onPress?: () => void;
}

function MemberCard({
  member,
  status,
  mood,
  isMe,
  nickname,
  variant = 'default',
  onPress
}: MemberCardProps) {
  const { colors } = useTheme();
  const user = member.user;

  // Animation Values
  const moodScale = useSharedValue(1);
  const statusOpacity = useSharedValue(0);

  // Status değiştiğinde glow efekti
  useEffect(() => {
    if (status?.status?.text) {
      statusOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withRepeat(withTiming(0.5, { duration: 800 }), 2, true),
        withTiming(0, { duration: 300 })
      );
    }
  }, [status?.status?.id]); // ID değiştiğinde tetikle

  // Mood değiştiğinde scale efekti
  useEffect(() => {
    if (mood?.mood?.emoji) {
      moodScale.value = withSequence(
        withSpring(1.5),
        withSpring(1)
      );
    }
  }, [mood?.mood?.id]);

  const animatedMoodStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moodScale.value }],
  }));

  const animatedStatusGlowStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  // Görüntülenecek isim - memoize edildi
  const displayName = useMemo(
    () => nickname || user?.display_name || user?.custom_user_id || '',
    [nickname, user?.display_name, user?.custom_user_id]
  );
  
  const realName = useMemo(
    () => nickname ? (user?.display_name || user?.custom_user_id) : undefined,
    [nickname, user?.display_name, user?.custom_user_id]
  );

  // Durum rengi ve ikonu - memoize edildi
  const statusColor = useMemo(
    () => status?.status?.is_custom ? colors.primary : (status?.status?.notifies ? colors.warning : colors.secondaryText),
    [status?.status?.is_custom, status?.status?.notifies, colors]
  );
  
  const statusText = useMemo(() => status?.status?.text, [status?.status?.text]);
  const isLarge = useMemo(() => variant === 'large', [variant]);

  if (!user) return null;

  const cardContent = (
    <View style={[
      styles.container,
      isLarge && styles.largeContainer,
      {
        backgroundColor: isLarge
          ? 'transparent' // Minimalist: No background
          : (isMe ? colors.tertiary + '20' : colors.cardBackground),
        borderColor: isLarge ? 'transparent' : (isMe ? colors.primary : colors.stroke),
        borderWidth: isLarge ? 0 : 1,
      }
    ]}>
      {/* Glow Effect Background (for status change) - Only for default cards or subtle for large */}
      {!isLarge && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: statusColor, borderRadius: 16 },
            animatedStatusGlowStyle
          ]}
        />
      )}

      {/* İçerik Container */}
      <View style={[styles.contentWrapper, isLarge && styles.largeContentWrapper]}>
        {/* Avatar Bölümü */}
        <View style={[
          styles.avatarContainer,
          isLarge && styles.largeAvatarContainer,
          { backgroundColor: colors.tertiary }
        ]}>
          <Image
            source={getAvatarSource(user.avatar)}
            style={[styles.avatarImage, isLarge && styles.largeAvatarImage]}
            contentFit="cover"
          />

          {/* Mood Emojisi (Avatarın köşesinde) */}
          {mood?.mood?.emoji && (
            <Animated.View style={[
              styles.moodBadge,
              isLarge && styles.largeMoodBadge,
              animatedMoodStyle
            ]}>
              <Typography variant={isLarge ? "h5" : "h6"}>{mood.mood.emoji}</Typography>
            </Animated.View>
          )}
        </View>

        {/* İsim ve Durum */}
        <View style={[styles.infoContainer, isLarge && styles.largeInfoContainer]}>
          <View style={[styles.nameRow, isLarge && styles.largeNameRow]}>
            <View style={{ flex: 1 }}>
              {/* Minimalist Header: Name is smaller, Status is HUGE */}
              {isLarge ? (
                <>
                  <Typography
                    variant="caption"
                    color={colors.secondaryText}
                    numberOfLines={1}
                    style={{ marginBottom: 4 }}
                  >
                    Merhaba, {displayName} 👋
                  </Typography>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Typography
                      variant="h5"
                      color={statusText ? colors.text : colors.secondaryText}
                      numberOfLines={1}
                      style={{ fontWeight: '700' }}
                    >
                      {statusText || 'Durum ayarla...'}
                    </Typography>
                    {statusText && (
                      <Animated.View style={[{ marginLeft: 8 }, animatedStatusGlowStyle]}>
                        <Ionicons name="radio-button-on" size={16} color={statusColor} />
                      </Animated.View>
                    )}
                  </View>
                </>
              ) : (
                <>
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
                </>
              )}
            </View>
          </View>

          {/* Durum Göstergesi (Only for default cards) */}
          {!isLarge && (
            statusText ? (
              <View style={styles.statusRow}>
                <Ionicons name="radio-button-on" size={12} color={statusColor} />
                <Typography
                  variant="caption"
                  color={statusColor}
                  numberOfLines={1}
                  style={{ marginLeft: 4, flex: 1 }}
                >
                  {statusText}
                </Typography>
              </View>
            ) : (
              <Typography variant="caption" color={colors.secondaryText} style={{ fontStyle: 'italic' }}>
                Durum yok
              </Typography>
            )
          )}
        </View>
      </View>
    </View>
  );

  // Eğer onPress varsa ve isMe false ise, TouchableOpacity ile sar
  if (onPress && !isMe && !isLarge) {
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
    // Gölge efekti
    overflow: 'hidden', // Glow efekti için
  },
  largeContainer: {
    marginBottom: 16,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'transparent', // Glow'u görmek için
  },
  largeContentWrapper: {
    padding: 0,
    paddingVertical: 8,
    gap: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  largeAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  largeAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  largeMoodBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    bottom: -2,
    right: -2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  largeInfoContainer: {
    marginLeft: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  largeNameRow: {
    marginBottom: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeStatusRow: {
    // Not used in minimalist
  },
});

// React.memo ile sarmalayıp shallow comparison yapıyoruz
export default React.memo(MemberCard);