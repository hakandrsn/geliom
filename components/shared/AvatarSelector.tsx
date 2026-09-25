import { GeliomButton, Typography } from '@/components/shared';
import { Avatar } from '@/components/ui';
import { CHARACTER_AVATARS, toAvatarValue } from '@/constants/avatars';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { AVATAR_TINT_COUNT, makeTintAvatar } from '@/utils/avatar';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BouncyButton } from '../anim/AnimatedComponents';

interface AvatarSelectorProps {
  /** Mevcut değer: "avatar:<key>", "tint:n", URL veya null */
  currentAvatar: string | null | undefined;
  /** Baş harf seçenekleri ve önizleme için kullanıcının adı */
  name?: string | null;
  /** Otomatik karakter için kullanıcı kimliği */
  seed?: string | null;
  onSelect: (avatar: string | null) => void | Promise<void>;
  onCancel: () => void;
}

const COLUMNS = 4;
const GAP = spacing.md;
const TINT_INDICES = Array.from({ length: AVATAR_TINT_COUNT }, (_, i) => i);

/**
 * Avatar seçici (bottom sheet içeriği): önce karakterler, altta baş harf
 * tonları. Seçim anahtar olarak kaydedilir; görsel cihazdan gelir.
 */
export default function AvatarSelector({
  currentAvatar,
  name,
  seed,
  onSelect,
  onCancel,
}: AvatarSelectorProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<string | null>(currentAvatar ?? null);
  const [isSaving, setIsSaving] = useState(false);

  // Sheet iç boşluğu (16) düşülerek eşit sütunlar
  const cell = Math.floor((width - spacing.lg * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSelect(selected);
    } finally {
      setIsSaving(false);
    }
  };

  const renderOption = (value: string, child: React.ReactNode) => {
    const active = selected === value;
    return (
      <BouncyButton key={value} onPress={() => setSelected(value)} style={{ width: cell, height: cell }}>
        <View
          style={[
            styles.ring,
            { borderColor: active ? colors.primary : 'transparent', borderRadius: radius.full },
          ]}
        >
          {child}
        </View>
        {active && (
          <View style={[styles.check, { backgroundColor: colors.primary, borderColor: colors.sheetBackground }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </BouncyButton>
    );
  };

  const unchanged = selected === (currentAvatar ?? null);

  return (
    <View style={styles.container}>
      {/* Başlık: solda önizleme + başlık, sağ üstte Kaydet. İptal = aşağı kaydır */}
      <View style={styles.header}>
        <Avatar photoUrl={selected} name={name} seed={seed} size={44} />
        <View style={styles.headerText}>
          <Typography variant="h5" color={colors.text}>
            Avatarını Seç
          </Typography>
          <Typography variant="caption" color={colors.lightText}>
            Grubundaki herkes bunu görür
          </Typography>
        </View>
        <GeliomButton
          state={isSaving ? 'loading' : unchanged ? 'passive' : 'active'}
          size="small"
          onPress={handleSave}
          disabled={isSaving || unchanged}
        >
          Kaydet
        </GeliomButton>
      </View>

      <BottomSheetScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {CHARACTER_AVATARS.map((a) =>
            renderOption(toAvatarValue(a.key), <Avatar photoUrl={toAvatarValue(a.key)} size={cell - 8} />),
          )}
        </View>

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.section}>
          Baş harflerin
        </Typography>
        <View style={styles.grid}>
          {TINT_INDICES.map((i) =>
            renderOption(makeTintAvatar(i), <Avatar photoUrl={makeTintAvatar(i)} name={name} size={cell - 8} />),
          )}
        </View>
      </BottomSheetScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  scroll: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  ring: {
    flex: 1,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
