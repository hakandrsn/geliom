import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface GroupNameBottomSheetProps {
  currentName: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export default function GroupNameBottomSheet({
  currentName,
  onSave,
  onCancel,
}: GroupNameBottomSheetProps) {
  const { colors } = useTheme();
  const [groupName, setGroupName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGroupName(currentName);
  }, [currentName]);

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError('Grup adı boş olamaz');
      return;
    }

    if (groupName.trim().length > 20) {
      setError('Grup adı en fazla 20 karakter olabilir');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(groupName.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h5" color={colors.text} style={styles.title}>
        Grup Adını Değiştir
      </Typography>

      <BottomSheetTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: error ? colors.error : colors.stroke,
          },
        ]}
        placeholder="Grup adı (max 20 karakter)"
        placeholderTextColor={colors.secondaryText}
        value={groupName}
        onChangeText={(text) => {
          setGroupName(text);
          setError(null);
        }}
        maxLength={20}
      />

      <Typography variant="caption" color={colors.secondaryText} style={styles.charCount}>
        {groupName.length}/20 karakter
      </Typography>

      {error && (
        <Typography variant="caption" color={colors.error} style={styles.error}>
          {error}
        </Typography>
      )}

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
          state={isSaving ? 'loading' : 'active'}
          size="medium"
          onPress={handleSave}
          style={styles.button}
          disabled={isSaving || !groupName.trim()}
        >
          Kaydet
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    flex:1
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Comfortaa-Regular',
  },
  charCount: {
    textAlign: 'right',
    marginTop: -8,
  },
  error: {
    marginTop: -8,
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

