import CustomText from '@/components/shared/Text';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/theme/tokens';
import { resolveAvatar } from '@/utils/avatar';
import { Image } from 'expo-image';
import Emoji from './Emoji';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface AvatarProps {
  /** users.photoUrl — "avatar:<key>", uzak URL, "tint:n" veya null */
  photoUrl?: string | null;
  /** Baş harfler için görünen ad */
  name?: string | null;
  /** İsim yokken bile aynı kullanıcı aynı tonu alsın diye (örn. userId) */
  seed?: string | null;
  size?: number;
  /** Primary renkli halka (örn. aktif kullanıcıyı vurgulamak için) */
  ring?: boolean;
  /** Sağ alt köşede küçük rozet içeriği (örn. mood emojisi) */
  badge?: string;
  /** Avatar seçilmemişse: kişiler için karakter, gruplar için baş harf */
  fallback?: 'character' | 'initials';
  style?: StyleProp<ViewStyle>;
}

/**
 * Kullanıcı avatarı: seçilen karakter, uzak fotoğraf ya da baş harfler.
 * Hiç seçim yoksa kişiye sabit (seed'e göre) bir karakter atanır.
 */
export default function Avatar({
  photoUrl,
  name,
  seed,
  size = 48,
  ring = false,
  badge,
  fallback = 'character',
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const badgeSize = Math.max(20, Math.round(size * 0.42));
  const descriptor = resolveAvatar(photoUrl, name, seed, fallback);

  const frameStyle = [
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
  ];

  return (
    <View style={[{ width: size, height: size }, style]}>
      {descriptor.kind === 'initials' ? (
        <View
          style={[
            frameStyle,
            styles.center,
            { backgroundColor: colors.avatarTints[descriptor.tintIndex] },
          ]}
        >
          <CustomText
            fontWeight="semibold"
            // Gradient/primary zemin kuralı: tonlu zemin üstünde metin beyaz
            color="#FFFFFF"
            style={{
              fontSize: Math.round(size * (descriptor.initials.length > 1 ? 0.36 : 0.42)),
              lineHeight: size,
              letterSpacing: 0.5,
            }}
          >
            {descriptor.initials}
          </CustomText>
        </View>
      ) : (
        <Image
          source={descriptor.kind === 'remote' ? { uri: descriptor.uri } : descriptor.source}
          style={frameStyle}
          contentFit="cover"
          transition={150}
        />
      )}

      {badge ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: radius.full,
              backgroundColor: colors.sheetBackground,
              borderColor: colors.stroke,
            },
          ]}
        >
          <Emoji size={Math.round(badgeSize * 0.55)}>{badge}</Emoji>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
