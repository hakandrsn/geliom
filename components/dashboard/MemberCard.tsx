import { Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser, UserGroupMoodWithMood, UserStatusWithStatus } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface MemberCardProps {
  member: GroupMemberWithUser;
  status?: UserStatusWithStatus;
  mood?: UserGroupMoodWithMood;
  isMe?: boolean;
  nickname?: string;
}

export default function MemberCard({ member, status, mood, isMe, nickname }: MemberCardProps) {
  const { colors } = useTheme();
  const user = member.user;

  if (!user) return null;
  
  // Görüntülenecek isim: nickname varsa onu, yoksa display_name veya custom_user_id
  const displayName = nickname || user.display_name || user.custom_user_id;
  const realName = nickname ? (user.display_name || user.custom_user_id) : undefined;

  // Durum rengi ve ikonu (Varsayılan: gri/bilinmiyor)
  const statusColor = status?.status?.is_custom ? colors.primary : (status?.status?.notifies ? colors.warning : colors.secondaryText);
  const statusText = status?.status?.text;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isMe ? colors.tertiary + '20' : colors.cardBackground,
        borderColor: isMe ? colors.primary : colors.stroke 
      }
    ]}>
      {/* Avatar Bölümü */}
      <View style={[styles.avatarContainer, { backgroundColor: colors.tertiary }]}>
        <Image
          source={getAvatarSource(user.avatar)}
          style={styles.avatarImage}
          resizeMode="cover"
        />
        
        {/* Mood Emojisi (Avatarın köşesinde) */}
        {mood?.mood?.emoji && (
          <View style={styles.moodBadge}>
            <Typography variant="h6">{mood.mood.emoji}</Typography>
          </View>
        )}
      </View>

      {/* İsim ve Durum */}
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

        {/* Durum Göstergesi */}
        {statusText ? (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
    // Gölge efekti
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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