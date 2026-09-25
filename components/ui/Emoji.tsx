import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

export interface EmojiProps {
  children: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Emoji için özel Text: marka fontu (Figtree) uygulanmaz, sistem fontu
 * kullanılır ki platformun renkli emoji fallback'i garanti çalışsın.
 */
export default function Emoji({ children, size = 16, style }: EmojiProps) {
  return (
    <Text
      allowFontScaling={false}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.3) }, style]}
    >
      {children}
    </Text>
  );
}
