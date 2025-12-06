import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface AddStatusMoodModalProps {
  visible: boolean;
  type: 'status' | 'mood';
  onClose: () => void;
  onSave: (text: string, emoji: string) => void;
}

export default function AddStatusMoodModal({ visible, type, onClose, onSave }: AddStatusMoodModalProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(type === 'mood' ? '😊' : '');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave(text.trim(), emoji);
    setText('');
    setEmoji(type === 'mood' ? '😊' : '');
    onClose();
  };

  const EMOJI_OPTIONS = ['😊', '😔', '😡', '😴', '🥳', '🤔', '🤢', '😎', '🤯', '🥺'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </View>

        <View style={[styles.content, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
          <View style={styles.header}>
            <Typography variant="h6" color={colors.text}>
              {type === 'status' ? 'Yeni Durum Ekle' : 'Yeni Mood Ekle'}
            </Typography>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.secondaryText} />
            </Pressable>
          </View>

          <View style={styles.form}>
            {type === 'mood' && (
              <View style={styles.emojiSection}>
                <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 8 }}>
                  Emoji Seç
                </Typography>
                <View style={styles.emojiList}>
                  {EMOJI_OPTIONS.map((e) => (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(e)}
                      style={[
                        styles.emojiItem,
                        emoji === e && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                      ]}
                    >
                      <Typography variant="h5">{e}</Typography>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 8 }}>
                {type === 'status' ? 'Durum Metni' : 'Mood Adı'}
              </Typography>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.stroke, backgroundColor: colors.background }]}
                placeholder={type === 'status' ? "Örn: Toplantıda" : "Örn: Harika"}
                placeholderTextColor={colors.secondaryText}
                value={text}
                onChangeText={setText}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.footer}>
            <GeliomButton
              state="passive"
              onPress={onClose}
              style={{ marginRight: 12, flex: 1 }}
            >
              İptal
            </GeliomButton>
            <GeliomButton
              state={text.trim() ? 'active' : 'passive'}
              onPress={handleSave}
              style={{ flex: 1 }}
            >
              Ekle
            </GeliomButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  emojiSection: {
    gap: 8,
  },
  emojiList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
  },
});
