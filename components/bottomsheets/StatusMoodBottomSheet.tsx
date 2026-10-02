import { BouncyButton } from '@/components/anim/AnimatedComponents';
import EmojiPicker from '@/components/business/EmojiPicker';
import { Typography } from '@/components/shared';
import { Emoji } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';

/** Sunucudaki OPTION_TEXT_MAX ile aynı */
const TEXT_MAX = 40;

/** Sheet bu yükseklikte açılmalı — çağıranlar aynı değeri kullanır. */
export const STATUS_MOOD_SHEET_SNAP = '65%';

export interface StatusMoodValue {
  text: string;
  emoji: string;
  /** Yalnızca durum */
  notifies: boolean;
}

interface StatusMoodBottomSheetProps {
  type: 'status' | 'mood';
  /** Verilirse düzenleme modu */
  initial?: Partial<StatusMoodValue>;
  onSave: (value: StatusMoodValue) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Durum / ruh hali ekleme ve düzenleme sheet'i.
 * Düzen (klavye kuralı): başlıkta İptal · başlık · Kaydet, hemen altında
 * metin girişi — klavye açılınca sheet yukarı taşınır ve girdi her zaman
 * görünür kalır; emoji ızgarası kalan alanı doldurur.
 * Her açılışta yeni `key` ile render edilmeli.
 */
export default function StatusMoodBottomSheet({
  type,
  initial,
  onSave,
  onCancel,
}: StatusMoodBottomSheetProps) {
  const { colors } = useTheme();
  const isEdit = !!initial;
  const [text, setText] = useState(initial?.text ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? (type === 'mood' ? '😊' : ''));
  const [notifies, setNotifies] = useState(initial?.notifies ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = text.trim();
  const canSave = !!trimmed && !isSaving;
  const noun = type === 'status' ? 'Durum' : 'Ruh Hali';

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave({ text: trimmed, emoji, notifies });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BouncyButton onPress={onCancel} disabled={isSaving} style={styles.headerSide}>
          <Typography variant="body" color={colors.secondaryText}>
            İptal
          </Typography>
        </BouncyButton>
        <Typography variant="h5" color={colors.text} numberOfLines={1} style={styles.title}>
          {isEdit ? `${noun} Düzenle` : `Yeni ${noun}`}
        </Typography>
        <BouncyButton
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.headerSide, styles.headerRight]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Typography
              variant="body"
              fontWeight="semibold"
              color={canSave ? colors.primary : colors.lightText}
            >
              Kaydet
            </Typography>
          )}
        </BouncyButton>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.preview, { borderColor: colors.stroke, backgroundColor: colors.background }]}>
          {emoji ? (
            <Emoji size={26}>{emoji}</Emoji>
          ) : (
            <Ionicons name="happy-outline" size={22} color={colors.lightText} />
          )}
        </View>
        <BottomSheetTextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.stroke, backgroundColor: colors.background },
          ]}
          placeholder={type === 'status' ? 'Örn: Kahve molasında' : 'Örn: Heyecanlı'}
          placeholderTextColor={colors.lightText}
          value={text}
          onChangeText={setText}
          maxLength={TEXT_MAX}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </View>

      {type === 'status' && (
        <View style={styles.switchRow}>
          <Ionicons name="notifications-outline" size={18} color={colors.secondaryText} />
          <Typography variant="body" color={colors.text} style={styles.flex}>
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

      <EmojiPicker value={emoji} onChange={setEmoji} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  headerSide: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
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
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
