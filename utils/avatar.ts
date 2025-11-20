import { ImageSourcePropType } from 'react-native';

const AVATAR_MAP: Record<string, ImageSourcePropType> = {
  'bear.png': require('@/assets/avatars/bear.png'),
  'man-1.png': require('@/assets/avatars/man-1.png'),
  'man-2.png': require('@/assets/avatars/man-2.png'),
  'man-3.png': require('@/assets/avatars/man-3.png'),
  'man-4.png': require('@/assets/avatars/man-4.png'),
  'man-5.png': require('@/assets/avatars/man-5.png'),
  'woman-1.png': require('@/assets/avatars/woman-1.png'),
  'woman-2.png': require('@/assets/avatars/woman-2.png'),
  'woman-3.png': require('@/assets/avatars/woman-3.png'),
  'woman-4.png': require('@/assets/avatars/woman-4.png'),
  'woman-5.png': require('@/assets/avatars/woman-5.png'),
};

const DEFAULT_AVATAR = 'bear.png';

/**
 * Kullanıcının avatar dosya adından ImageSourcePropType döndürür
 * @param avatar - Avatar dosya adı (örn: "bear.png", "man-1.png") veya null
 * @returns ImageSourcePropType - React Native Image component'i için uygun source
 */
export function getAvatarSource(avatar: string | null | undefined): ImageSourcePropType {
  const avatarName = avatar || DEFAULT_AVATAR;
  return AVATAR_MAP[avatarName] || AVATAR_MAP[DEFAULT_AVATAR];
}

/**
 * Tüm mevcut avatar dosya adlarını döndürür
 * @returns string[] - Avatar dosya adları listesi
 */
export function getAvailableAvatars(): string[] {
  return Object.keys(AVATAR_MAP);
}

/**
 * Avatar dosya adının geçerli olup olmadığını kontrol eder
 * @param avatar - Avatar dosya adı
 * @returns boolean - Geçerli ise true
 */
export function isValidAvatar(avatar: string): boolean {
  return avatar in AVATAR_MAP;
}

