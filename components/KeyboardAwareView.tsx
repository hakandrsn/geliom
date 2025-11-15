import React from 'react';
import {
    GestureResponderEvent,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    ViewStyle,
} from 'react-native';

interface KeyboardAwareViewProps {
  /** İçeriği gösterir */
  children: React.ReactNode;
  
  /** KeyboardAvoidingView için stil */
  style?: StyleProp<ViewStyle>;
  
  /** ScrollView'in içindeki contentContainer için stil */
  contentContainerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Ekranın üst kısmındaki (örneğin header) boşluk miktarı.
   * Bu bileşen bir header'ın altındaysa, header'ın yüksekliğini buraya girin.
   */
  keyboardVerticalOffset?: number;
  
  /**
   * Dokunma olayını iletmek için opsiyonel bir prop.
   * Bazen 'ScrollView' yerine dışarıdaki bir view'a dokunulduğunu bilmek istersiniz.
   */
  onTouchStart?: (event: GestureResponderEvent) => void;
}

/**
 * Klavye açıldığında içeriğin klavyenin altında kalmasını engelleyen,
 * hem iOS hem de Android için tutarlı çalışan sarmalayıcı bileşen.
 * * Temelde 'KeyboardAvoidingView' ve 'ScrollView'i doğru ayarlarla birleştirir.
 * * En önemli özelliği: ScrollView'in 'contentContainerStyle'ına otomatik olarak
 * 'flexGrow: 1' ekler. Bu sayede içerik kısayken bile ekranı doldurur
 * (örn: 'justifyContent: 'space-between'' ile butonu en alta itmek için).
 */
export const KeyboardAwareView: React.FC<KeyboardAwareViewProps> = ({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0, // Genelde BaseLayout'tan geldiği için 0 veya header yüksekliği
  onTouchStart,
}) => {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onTouchStart={onTouchStart}
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    /**
     * BU ÇOK ÖNEMLİ!
     * 'flexGrow: 1', içeriğin ScrollView'dan kısa olması durumunda bile
     * tüm alanı kaplamasını sağlar. Bu, 'justifyContent' gibi stillerin
     * (örn: butonu en alta yapıştırmak) çalışmasına olanak tanır.
     */
    flexGrow: 1,
  },
});