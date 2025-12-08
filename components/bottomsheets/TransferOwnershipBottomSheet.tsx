import { GeliomButton, Typography } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import type { GroupMemberWithUser } from '@/types/database';
import { getAvatarSource } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface TransferOwnershipBottomSheetProps {
  member: GroupMemberWithUser;
  groupName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function TransferOwnershipBottomSheet({
  member,
  groupName,
  onConfirm,
  onCancel,
}: TransferOwnershipBottomSheetProps) {
  const { colors } = useTheme();
  const [isTransferring, setIsTransferring] = useState(false);

  const handleConfirm = async () => {
    setIsTransferring(true);
    try {
      await onConfirm();
    } finally {
      setIsTransferring(false);
    }
  };

  const memberUser = member.user;
  const displayName = memberUser?.display_name || memberUser?.custom_user_id || 'Bilinmeyen';

  return (
    <View style={styles.container}>
      {/* Warning Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
        <Ionicons name="warning" size={48} color={colors.warning} />
      </View>

      <Typography variant="h5" color={colors.text} style={styles.title}>
        Yöneticilik Devri
      </Typography>

      {/* Üye Bilgileri */}
      <View style={[styles.memberCard, { backgroundColor: colors.background, borderColor: colors.stroke }]}>
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
      </View>

      {/* Warning Message */}
      <View style={[styles.warningBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
        <Typography variant="body" color={colors.text} style={{ textAlign: 'center' }}>
          <Typography variant="body" fontWeight="bold" color={colors.text}>
            {displayName}
          </Typography> kullanıcısına{' '}
          <Typography variant="body" fontWeight="bold" color={colors.text}>
            {groupName}
          </Typography>{' '}
          grubunun yöneticiliğini devretmek istediğinize emin misiniz?
        </Typography>
        <Typography variant="caption" color={colors.secondaryText} style={{ textAlign: 'center', marginTop: 8 }}>
          Bu işlem geri alınamaz. Yönetici yetkilerinizi kaybedeceksiniz.
        </Typography>
      </View>

      {/* Butonlar */}
      <View style={styles.actions}>
        <GeliomButton
          state="passive"
          size="medium"
          onPress={onCancel}
          style={styles.button}
          disabled={isTransferring}
        >
          İptal
        </GeliomButton>
        <GeliomButton
          state={isTransferring ? 'loading' : 'active'}
          size="medium"
          icon="swap-horizontal"
          onPress={handleConfirm}
          style={styles.button}
          disabled={isTransferring}
        >
          Devret
        </GeliomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  memberCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  warningBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});

