import { emojiCode, emojiImageUrl } from '@/api/emojis';
import { BUNDLED_EMOJI } from '@/constants/bundled-emoji';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

export interface EmojiProps {
  children: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Emoji — telefonun emoji fontuna bağlı değil: her platformda aynı Fluent 3D
 * görseli çizilir. Varsayılanlar pakette gömülü, kalanı API'den gelip diskte
 * önbelleklenir. Görsel yoksa (katalog dışı eski kayıt, ağ hatası) sistem
 * emojisine düşer.
 */
export default function Emoji({ children, size = 16, style }: EmojiProps) {
  const code = children ? emojiCode(children) : '';
  // Hata emojiye bağlı tutulur: aynı bileşen başka emojiyle yeniden kullanılınca sıfırlanır
  const [failedCode, setFailedCode] = useState<string | null>(null);
  // Metin emojisi yaklaşık fontSize * 1.2 genişlikte çizilir; görsel aynı yeri kaplar
  const box = Math.round(size * 1.2);

  if (!children || failedCode === code) {
    return (
      <Text
        allowFontScaling={false}
        style={[{ fontSize: size, lineHeight: Math.round(size * 1.3) }, style]}
      >
        {children}
      </Text>
    );
  }

  return (
    <Image
      source={BUNDLED_EMOJI[code] ?? { uri: emojiImageUrl(code) }}
      style={[{ width: box, height: box }, style as object]}
      contentFit="contain"
      cachePolicy="memory-disk"
      recyclingKey={code}
      transition={0}
      accessibilityLabel={children}
      onError={() => setFailedCode(code)}
    />
  );
}
