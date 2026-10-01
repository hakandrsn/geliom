import { appConfig } from "@/config/app.config";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import { emojiKeys } from "./keys";

export interface EmojiEntry {
  emoji: string;
  code: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  emojis: EmojiEntry[];
}

export interface EmojiCatalog {
  version: string;
  imagePath: string;
  categories: EmojiCategory[];
}

/** API'deki görsel yolu (api/src/emoji/emoji.controller.ts → EMOJI_IMAGE_PATH). */
const EMOJI_IMAGE_PATH = "/api/static/emoji";

/** Görsel dosya adı: FE0F'siz kod noktaları, '-' ile birleşik — API ile aynı kural. */
export function emojiCode(emoji: string): string {
  return Array.from(emoji)
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join("-");
}

export const emojiImageUrl = (code: string) =>
  `${appConfig.socketUrl}${EMOJI_IMAGE_PATH}/${code}.png`;

/**
 * Ortak emoji kataloğu (GET /emojis). Nadiren değişir: bir gün taze sayılır,
 * oturum boyunca bellekte kalır.
 */
export const useEmojiCatalog = (enabled = true) =>
  useQuery({
    queryKey: emojiKeys.catalog,
    enabled,
    queryFn: async () => (await apiClient.get<EmojiCatalog>("/emojis")).data,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: Infinity,
  });
