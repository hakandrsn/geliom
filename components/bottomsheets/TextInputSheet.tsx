import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { fonts, typography } from '@/theme/typography';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export interface TextInputSheetProps {
  title: string;
  /** Başlığın altında kısa bağlam */
  description?: string;
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Hata mesajı döndürürse kaydetme engellenir */
  validate?: (value: string) => string | null;
  onSave: (value: string) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Tek alanlı metin girişi sheet'i — isim, grup adı gibi kısa düzenlemeler
 * için ortak yüzey. Web tipi ortalanmış Modal yerine kullanılır.
 */
export default function TextInputSheet({
  title,
  description,
  initialValue = '',
  placeholder,
  maxLength = 50,
  confirmLabel = 'Kaydet',
  cancelLabel = 'İptal',
  validate,
  onSave,
  onCancel,
}: TextInputSheetProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = value.trim();

  const handleSave = async () => {
    if (!trimmed) {
      setError('Bu alan boş olamaz');
      return;
    }
    const validationError = validate?.(trimmed) ?? null;
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h5" color={colors.text} style={styles.title}>
          {title}
        </Typography>
        {description && (
          <Typography variant="bodySmall" color={colors.secondaryText} style={styles.title}>
            {description}
          </Typography>
        )}
      </View>

      <BottomSheetTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: error ? colors.error : colors.stroke,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.lightText}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setError(null);
        }}
        maxLength={maxLength}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <View style={styles.meta}>
        <Typography variant="caption" color={error ? colors.error : colors.lightText}>
          {error ?? ' '}
        </Typography>
        <Typography variant="caption" color={colors.lightText}>
          {value.length}/{maxLength}
        </Typography>
      </View>

      <View style={styles.actions}>
        <GeliomButton
          state="passive"
          size="medium"
          onPress={onCancel}
          style={styles.button}
          disabled={isSaving}
        >
          {cancelLabel}
        </GeliomButton>
        <GeliomButton
          state={isSaving ? 'loading' : 'active'}
          size="medium"
          onPress={handleSave}
          style={styles.button}
          disabled={isSaving || !trimmed}
        >
          {confirmLabel}
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    fontFamily: fonts.regular,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
