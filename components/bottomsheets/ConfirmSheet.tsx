import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export interface ConfirmSheetProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Açıklama — grup adı gibi bağlam bilgisi burada verilir */
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Silme/sessize alma gibi tehlikeli aksiyonlarda onay butonu error renginde */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Ortak onay sheet'i — Alert.alert yerine kullanılır.
 * Tema uyumlu, ikonlu ve bağlam (grup adı vb.) gösterebilen onay akışı.
 */
export default function ConfirmSheet({
  icon = 'help-circle-outline',
  title,
  message,
  confirmLabel,
  cancelLabel = 'İptal',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const { colors } = useTheme();
  const [isBusy, setIsBusy] = useState(false);

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      await onConfirm();
    } finally {
      setIsBusy(false);
    }
  };

  const accentColor = destructive ? colors.error : colors.primary;

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconCircle, { backgroundColor: accentColor + '1A' }]}
      >
        <Ionicons name={icon} size={28} color={accentColor} />
      </View>

      <Typography variant="h5" color={colors.text} style={styles.title}>
        {title}
      </Typography>

      <Typography
        variant="body"
        color={colors.secondaryText}
        style={styles.message}
      >
        {message}
      </Typography>

      <View style={styles.actions}>
        <GeliomButton
          state="passive"
          size="medium"
          onPress={onCancel}
          style={styles.button}
          disabled={isBusy}
        >
          {cancelLabel}
        </GeliomButton>
        <GeliomButton
          state={isBusy ? 'loading' : 'active'}
          size="medium"
          backgroundColor={destructive ? colors.error : undefined}
          onPress={handleConfirm}
          style={styles.button}
          disabled={isBusy}
        >
          {confirmLabel}
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
  },
});
