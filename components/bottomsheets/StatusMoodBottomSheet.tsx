import EmojiPicker from '@/components/business/EmojiPicker';
import { GeliomButton, Typography } from '@/components/shared';
import { Emoji } from '@/components/ui';
import { radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

interface StatusMoodBottomSheetProps {
  type: 'status' | 'mood';
  onSave: (text: string, emoji: string, notifies?: boolean) => Promise<void>;
  onCancel: () => void;
}

/** Her açılışta yeni `key` ile render edilmeli — state açılışlar arasında taşınmasın. */
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

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      await onSave(text.trim(), emoji, type === 'status' ? notifies : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h5" color={colors.text} style={styles.title}>
        {type === 'status' ? 'Özel Durum Ekle' : 'Özel Mood Ekle'}
      </Typography>

      {/* Seçili emoji + metin */}
      <View style={styles.inputContainer}>
        <Typography variant="body" color={colors.secondaryText} style={{ marginBottom: 8 }}>
          {type === 'status' ? 'Durum Metni' : 'Mood Adı'}
        </Typography>
        <View style={styles.inputRow}>
          <View style={[styles.preview, { borderColor: colors.stroke, backgroundColor: colors.background }]}>
            {emoji ? (
              <Emoji size={26}>{emoji}</Emoji>
            ) : (
              <Typography variant="caption" color={colors.lightText}>
                Yok
              </Typography>
            )}
          </View>
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

      {/* Emoji Seçici — ortak katalog */}
      <Typography variant="body" color={colors.secondaryText}>
        {type === 'status' ? 'Emoji seç (opsiyonel)' : 'Emoji seç'}
      </Typography>
      <EmojiPicker value={emoji} onChange={setEmoji} />

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
    gap: spacing.md,
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  inputContainer: {},
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: fonts.regular,
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

