import { spacing } from '@/theme/tokens';
import React from 'react';
import { GestureResponderEvent, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface KeyboardAwareViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Odaktaki input ile klavye arasında bırakılacak boşluk */
  bottomOffset?: number;
  /** @deprecated keyboard-controller header'ı kendisi hesaplar; geriye dönük uyumluluk için */
  keyboardVerticalOffset?: number;
  onTouchStart?: (event: GestureResponderEvent) => void;
}

/**
 * KLAVYE KURALI — uygulamadaki her metin girişi bu iki yoldan biriyle çizilir:
 *
 *  1. Sayfa (ekran): içerik bu bileşenle sarılır. keyboard-controller'ın
 *     KeyboardAwareScrollView'ı odaktaki input'u her platformda klavyenin
 *     üstüne kaydırır. Android edge-to-edge'de pencere küçülmediği için
 *     RN KeyboardAvoidingView / adjustResize'a GÜVENİLMEZ.
 *  2. Bottom sheet: input `BottomSheetTextInput` olur ve sheet'in ÜST kısmına
 *     konur. Ortak BottomSheetProvider sheet'i klavyenin üstüne taşır
 *     (bkz. contexts/BottomSheetContext.tsx).
 *
 * Düz ScrollView / KeyboardAvoidingView içinde TextInput kullanılmaz.
 */
export default function KeyboardAwareView({
  children,
  style,
  contentContainerStyle,
  bottomOffset = spacing.xl,
  onTouchStart,
}: KeyboardAwareViewProps) {
  return (
    <KeyboardAwareScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onTouchStart={onTouchStart}
      bounces={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    // İçerik kısayken de ekranı doldursun (butonu alta itmek için)
    flexGrow: 1,
  },
});
