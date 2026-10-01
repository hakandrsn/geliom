import { emojiImageUrl, useEmojiCatalog } from "@/api/emojis";
import { BUNDLED_EMOJI } from "@/constants/bundled-emoji";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";

/**
 * Giriş yapılınca ortak emoji kataloğunun görsellerini arka planda diske
 * indirir — grup ekranı ve emoji seçici açıldığında hepsi hazır olsun.
 * İlk seferde ~4,7 MB; sonra diskten gelir (sunucu `immutable` önbellek
 * başlığı gönderir), aynı katalog sürümü için oturumda bir kez çalışır.
 */
export function useEmojiPrefetch(enabled: boolean) {
  const { data } = useEmojiCatalog(enabled);
  const doneVersion = useRef<string | null>(null);

  useEffect(() => {
    if (!data || doneVersion.current === data.version) return;
    doneVersion.current = data.version;

    const urls = data.categories
      .flatMap((c) => c.emojis)
      .filter((e) => !BUNDLED_EMOJI[e.code])
      .map((e) => emojiImageUrl(e.code));

    // Başarısız olan görseller ekranda gerektiğinde tek tek yeniden istenir
    Image.prefetch(urls, "disk")
      .then((ok) => {
        if (!ok) console.warn("Bazı emoji görselleri önceden indirilemedi");
      })
      .catch((error) => console.warn("Emoji prefetch başarısız", error));
  }, [data]);
}
