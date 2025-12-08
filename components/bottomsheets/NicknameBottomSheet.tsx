import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface NicknameBottomSheetProps {
  member: GroupMemberWithUser;
  currentNickname?: string;
  onSave: (nickname: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function NicknameBottomSheet({
  member,
  currentNickname = '',
  onSave,
  onDelete,
  onCancel,
}: NicknameBottomSheetProps) {
  const { colors } = useTheme();
  const [nickname, setNickname] = useState(currentNickname);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNickname(currentNickname);
  }, [currentNickname]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(nickname.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
    } finally {
      setIsSaving(false);
    }
  };

  const memberUser = member.user;
  const displayName = memberUser?.display_name || memberUser?.custom_user_id || 'Bilinmeyen';

  return (
    <View style={styles.container}>
      <Typography variant="h5" color={colors.text} style={styles.title}>
        Takma Ad Düzenle
      </Typography>

      {/* Üye Bilgileri */}
      <View style={styles.memberRow}>
        <View style={styles.avatarContainer}>
          <Image
            source={getAvatarSource(memberUser?.avatar)}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.memberInfo}>
          <Typography variant="body" fontWeight="semibold" color={colors.text}>
            {displayName}
          </Typography>
          <Typography variant="caption" color={colors.secondaryText}>
            {memberUser?.custom_user_id}
          </Typography>
        </View>
      </View>

      {/* Input */}
      <BottomSheetTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.stroke,
          },
        ]}
        placeholder="Takma ad girin (boş bırakırsanız silinir)"
        placeholderTextColor={colors.secondaryText}
        value={nickname}
        onChangeText={setNickname}
        maxLength={50}
      />

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

        {currentNickname && onDelete && (
          <GeliomButton
            state={isSaving ? 'loading' : 'passive'}
            size="medium"
            icon="trash"
            onPress={handleDelete}
            style={styles.button}
            disabled={isSaving}
          >
            Sil
          </GeliomButton>
        )}

        <GeliomButton
          state={isSaving ? 'loading' : 'active'}
          size="medium"
          onPress={handleSave}
          style={styles.button}
          disabled={isSaving}
        >
          Kaydet
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  memberInfo: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Comfortaa-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});

