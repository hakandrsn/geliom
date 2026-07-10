import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/theme/tokens';
import { getAvatarSource } from '@/utils/avatar';
import { Image } from 'expo-image';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface AvatarProps {
  photoUrl?: string | null;
  size?: number;
  /** Primary renkli halka (örn. aktif kullanıcıyı vurgulamak için) */
  ring?: boolean;
  /** Sağ alt köşede küçük rozet içeriği (örn. mood emojisi) */
  badge?: string;
  style?: StyleProp<ViewStyle>;
}

/** Kullanıcı avatarı — opsiyonel halka ve mood rozetiyle. */
export default function Avatar({
  photoUrl,
  size = 48,
  ring = false,
  badge,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const badgeSize = Math.max(20, Math.round(size * 0.42));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={getAvatarSource(photoUrl ?? undefined)}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius.full,
            backgroundColor: colors.secondaryBackground,
          },
          ring && {
            borderWidth: 2,
            borderColor: colors.primary,
          },
        ]}
        contentFit="cover"
      />
      {badge ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: radius.full,
              backgroundColor: colors.cardBackground,
              borderColor: colors.stroke,
            },
          ]}
        >
          <CustomText style={{ fontSize: badgeSize * 0.55, lineHeight: badgeSize * 0.75 }}>
            {badge}
          </CustomText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
