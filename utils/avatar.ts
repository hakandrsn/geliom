import {
  AVATAR_PREFIX,
  CHARACTER_AVATARS,
  getCharacterSource,
} from "@/constants/avatars";
import type { ImageSourcePropType } from "react-native";

/**
 * users.photoUrl değerleri:
 *  - "avatar:<key>" → uygulamaya gömülü karakter (constants/avatars.ts)
 *  - "https://…"   → uzak fotoğraf (Google girişinden gelir)
 *  - "tint:<n>"    → palete uyumlu zemin + baş harfler
 *  - null / eski değerler ("man-1.png" gibi) → seed'e göre sabit karakter
 */

export const AVATAR_TINT_COUNT = 8;
const TINT_PREFIX = "tint:";

export type AvatarDescriptor =
  | { kind: "remote"; uri: string }
  | { kind: "asset"; source: ImageSourcePropType }
  | { kind: "initials"; initials: string; tintIndex: number };

/** "Hakan Dursun" → "HD", "hakan" → "H", boş → "?" */
export function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toLocaleUpperCase("tr-TR");
}

/** Aynı kimlik her zaman aynı sonucu versin diye deterministik hash. */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function hashToTintIndex(seed: string): number {
  return hash(seed) % AVATAR_TINT_COUNT;
}

export function makeTintAvatar(index: number): string {
  return `${TINT_PREFIX}${index}`;
}

export function parseTintAvatar(value?: string | null): number | null {
  if (!value || !value.startsWith(TINT_PREFIX)) return null;
  const index = Number(value.slice(TINT_PREFIX.length));
  return Number.isInteger(index) && index >= 0 && index < AVATAR_TINT_COUNT ? index : null;
}

export function parseCharacterKey(value?: string | null): string | null {
  if (!value || !value.startsWith(AVATAR_PREFIX)) return null;
  const key = value.slice(AVATAR_PREFIX.length);
  return getCharacterSource(key) ? key : null;
}

/**
 * @param fallback avatar seçilmemişse: "character" (kişiler — seed'e göre
 *   sabit karakter) ya da "initials" (gruplar — tonlu baş harf)
 */
export function resolveAvatar(
  photoUrl: string | null | undefined,
  name?: string | null,
  seed?: string | null,
  fallback: "character" | "initials" = "character",
): AvatarDescriptor {
  if (photoUrl && /^https?:\/\//.test(photoUrl)) {
    return { kind: "remote", uri: photoUrl };
  }

  const characterKey = parseCharacterKey(photoUrl);
  if (characterKey) {
    return { kind: "asset", source: getCharacterSource(characterKey)! };
  }

  const tintIndex = parseTintAvatar(photoUrl);
  if (tintIndex !== null) {
    return { kind: "initials", initials: getInitials(name), tintIndex };
  }

  const seedValue = seed || name || "";
  if (fallback === "character" && seedValue) {
    const auto = CHARACTER_AVATARS[hash(seedValue) % CHARACTER_AVATARS.length];
    return { kind: "asset", source: auto.source };
  }

  return { kind: "initials", initials: getInitials(name), tintIndex: hashToTintIndex(seedValue) };
}
