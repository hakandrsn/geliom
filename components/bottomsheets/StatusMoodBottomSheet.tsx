import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

interface StatusMoodBottomSheetProps {
  type: 'status' | 'mood';
  onSave: (text: string, emoji: string, notifies?: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function StatusMoodBottomSheet({
  type,
  onSave,
  onCancel,
}: StatusMoodBottomSheetProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(type === 'mood' ? '😊' : '');
  const [notifies, setNotifies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // type değiştiğinde state'leri resetle
  useEffect(() => {
    setText('');
    setEmoji(type === 'mood' ? '😊' : '');
    setNotifies(false);
    setIsSaving(false);
  }, [type]);

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      await onSave(text.trim(), emoji, type === 'status' ? notifies : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  const EMOJI_OPTIONS = type === 'mood' 
    ? ['😊', '😔', '😡', '😴', '🥳', '🤔', '🤢', '😎', '🤯', '🥺']
    : ['📅', '💼', '🏠', '🚗', '✈️', '🎯', '💪', '🎵', '📚', '🍔'];

  return (
    <View style={styles.container}>
      <Typography variant="h5" color={colors.text} style={styles.title}>
        {type === 'status' ? 'Özel Durum Ekle' : 'Özel Mood Ekle'}
      </Typography>

      {/* Emoji Seçici */}
      <View style={styles.emojiSection}>
        <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 8 }}>
          Emoji Seç (opsiyonel)
        </Typography>
        <View style={styles.emojiList}>
          {EMOJI_OPTIONS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(emoji === e ? '' : e)}
              style={[
                styles.emojiItem,
                {
                  backgroundColor: emoji === e ? colors.passiveState : colors.background,
                  borderColor: emoji === e ? colors.primary : colors.stroke,
                },
              ]}
            >
              <Typography variant="h6">{e}</Typography>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 8 }}>
          {type === 'status' ? 'Durum Metni' : 'Mood Adı'}
        </Typography>
        <BottomSheetTextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.stroke,
              backgroundColor: colors.background,
            },
          ]}
          placeholder={type === 'status' ? 'Örn: Toplantıdayım' : 'Örn: Heyecanlı'}
          placeholderTextColor={colors.secondaryText}
          value={text}
          onChangeText={setText}
          maxLength={50}
        />
      </View>

      {/* Notifies Switch (sadece status için) */}
      {type === 'status' && (
        <View style={[styles.switchContainer, { borderColor: colors.stroke }]}>
          <Typography variant="body" color={colors.text} style={{ flex: 1 }}>
            Bildirim gönder
          </Typography>
          <Switch
            value={notifies}
            onValueChange={setNotifies}
            trackColor={{ false: colors.stroke, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      )}

      {/* Butonlar */}
      <View style={styles.actions}>
        <GeliomButton
          state="passive"
          size="medium"
          onPress={onCancel}
          style={styles.button}
          disabled={isSaving}
        >
          İptal
        </GeliomButton>
        <GeliomButton
          state={isSaving ? 'loading' : text.trim() ? 'active' : 'passive'}
          size="medium"
          onPress={handleSave}
          style={styles.button}
          disabled={isSaving || !text.trim()}
        >
          Oluştur
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emojiSection: {},
  emojiList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  inputContainer: {},
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Comfortaa-Regular',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});

