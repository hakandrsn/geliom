import type { ImageSourcePropType } from "react-native";

/**
 * Uygulamaya gömülü karakter avatarları.
 *
 * Görseller cihazda; backend'e yalnızca anahtar gider: `users.photoUrl =
 * "avatar:<key>"`. Bu yüzden ANAHTARLAR KALICIDIR — yeniden adlandırılmaz,
 * silinmez (silinirse o kullanıcılar otomatik karaktere düşer). Yeni karakter
 * eklemek için dosyayı `assets/avatars/<key>.png` olarak koyup buraya ekle.
 *
 * Anahtar biçimi: `w-` / `m-` + ayırt edici özellik, küçük harf, ASCII, tire.
 * Sıra seçicide gösterim sırasıdır.
 */
export interface CharacterAvatar {
  key: string;
  source: ImageSourcePropType;
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  { key: "w-ponytail-teal", source: require("@/assets/avatars/w-ponytail-teal.png") },
  { key: "w-pixie-mustard", source: require("@/assets/avatars/w-pixie-mustard.png") },
  { key: "w-silver-curls", source: require("@/assets/avatars/w-silver-curls.png") },
  { key: "w-braids-lilac", source: require("@/assets/avatars/w-braids-lilac.png") },
  { key: "w-curls-denim", source: require("@/assets/avatars/w-curls-denim.png") },
  { key: "w-platinum-bob", source: require("@/assets/avatars/w-platinum-bob.png") },
  { key: "w-bandana", source: require("@/assets/avatars/w-bandana.png") },
  { key: "w-mint-hair", source: require("@/assets/avatars/w-mint-hair.png") },
  { key: "w-orange-hoodie", source: require("@/assets/avatars/w-orange-hoodie.png") },
  { key: "w-red-streaks", source: require("@/assets/avatars/w-red-streaks.png") },
  { key: "w-ginger-braid", source: require("@/assets/avatars/w-ginger-braid.png") },
  { key: "w-afro-glasses", source: require("@/assets/avatars/w-afro-glasses.png") },
  { key: "m-beard-beige", source: require("@/assets/avatars/m-beard-beige.png") },
  { key: "m-ginger-hoodie", source: require("@/assets/avatars/m-ginger-hoodie.png") },
  { key: "m-bald-beard", source: require("@/assets/avatars/m-bald-beard.png") },
  { key: "m-grey-cardigan", source: require("@/assets/avatars/m-grey-cardigan.png") },
  { key: "m-mustache", source: require("@/assets/avatars/m-mustache.png") },
  { key: "m-blond-bun", source: require("@/assets/avatars/m-blond-bun.png") },
  { key: "m-silver-hair", source: require("@/assets/avatars/m-silver-hair.png") },
  { key: "m-red-tee", source: require("@/assets/avatars/m-red-tee.png") },
  { key: "m-glasses-blue", source: require("@/assets/avatars/m-glasses-blue.png") },
  { key: "m-beanie", source: require("@/assets/avatars/m-beanie.png") },
  { key: "m-varsity", source: require("@/assets/avatars/m-varsity.png") },
  { key: "m-locs", source: require("@/assets/avatars/m-locs.png") },
  { key: "w-brown-waves", source: require("@/assets/avatars/w-brown-waves.png") },
  { key: "w-blonde-bun", source: require("@/assets/avatars/w-blonde-bun.png") },
  { key: "w-black-bob", source: require("@/assets/avatars/w-black-bob.png") },
  { key: "w-red-hair", source: require("@/assets/avatars/w-red-hair.png") },
  { key: "w-curly-updo", source: require("@/assets/avatars/w-curly-updo.png") },
  { key: "w-pink-hair", source: require("@/assets/avatars/w-pink-hair.png") },
  { key: "w-glasses-pink", source: require("@/assets/avatars/w-glasses-pink.png") },
  { key: "w-afro-headband", source: require("@/assets/avatars/w-afro-headband.png") },
  { key: "w-purple-hair", source: require("@/assets/avatars/w-purple-hair.png") },
  { key: "w-white-bob", source: require("@/assets/avatars/w-white-bob.png") },
  { key: "w-sunhat", source: require("@/assets/avatars/w-sunhat.png") },
  { key: "w-bun-glasses", source: require("@/assets/avatars/w-bun-glasses.png") },
  { key: "m-blue-hoodie", source: require("@/assets/avatars/m-blue-hoodie.png") },
  { key: "m-blond", source: require("@/assets/avatars/m-blond.png") },
  { key: "m-flannel", source: require("@/assets/avatars/m-flannel.png") },
  { key: "m-glasses-beard", source: require("@/assets/avatars/m-glasses-beard.png") },
  { key: "m-ginger-flannel", source: require("@/assets/avatars/m-ginger-flannel.png") },
  { key: "m-headphones", source: require("@/assets/avatars/m-headphones.png") },
  { key: "m-man-bun", source: require("@/assets/avatars/m-man-bun.png") },
  { key: "m-tie", source: require("@/assets/avatars/m-tie.png") },
  { key: "m-cap", source: require("@/assets/avatars/m-cap.png") },
  { key: "m-silver-coat", source: require("@/assets/avatars/m-silver-coat.png") },
  { key: "m-sherpa", source: require("@/assets/avatars/m-sherpa.png") },
  { key: "m-yellow-hoodie", source: require("@/assets/avatars/m-yellow-hoodie.png") },
];

export const AVATAR_PREFIX = "avatar:";

const BY_KEY = new Map(CHARACTER_AVATARS.map((a) => [a.key, a.source]));

export function getCharacterSource(key: string): ImageSourcePropType | undefined {
  return BY_KEY.get(key);
}

export const toAvatarValue = (key: string) => `${AVATAR_PREFIX}${key}`;
