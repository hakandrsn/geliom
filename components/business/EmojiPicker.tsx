import { DEFAULT_MOODS, DEFAULT_STATUSES } from '@/api/constants';
import { emojiCode, useEmojiCatalog, type EmojiCategory, type EmojiEntry } from '@/api/emojis';
import { Typography } from '@/components/shared';
import { Chip, Emoji, Skeleton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

const CELL = 44;

/** Katalog yüklenemezse (çevrimdışı) pakette gömülü varsayılanlar gösterilir. */
const FALLBACK: EmojiCategory[] = [
  {
    id: 'defaults',
    name: 'Temel',
    emojis: [...DEFAULT_MOODS, ...DEFAULT_STATUSES].map((o) => ({
      emoji: o.emoji,
      code: emojiCode(o.emoji),
      name: o.text,
      keywords: [],
    })),
  },
];

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

/**
 * Ortak katalogdan emoji seçici: arama + kategori + ızgara. Bottom sheet
 * içinde kullanılır (BottomSheetScrollView); sheet `scrollable: true` açılmalı.
 */
export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useEmojiCatalog();
  const categories = useMemo(
    () => data?.categories ?? (isError ? FALLBACK : []),
    [data, isError],
  );

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const activeId = categoryId ?? categories[0]?.id;
  const selectedCode = value ? emojiCode(value) : null;

  const visible: EmojiEntry[] = useMemo(() => {
    const q = normalize(query);
    if (q) {
      return categories
        .flatMap((c) => c.emojis)
        .filter(
          (e) =>
            normalize(e.name).includes(q) || e.keywords.some((k) => normalize(k).includes(q)),
        );
    }
    return categories.find((c) => c.id === activeId)?.emojis ?? [];
  }, [categories, activeId, query]);

  return (
    <View style={styles.container}>
      <View style={[styles.search, { borderColor: colors.stroke, backgroundColor: colors.background }]}>
        <Ionicons name="search" size={18} color={colors.secondaryText} />
        <BottomSheetTextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Emoji ara (kahve, mutlu, spor…)"
          placeholderTextColor={colors.secondaryText}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} hitSlop={12}>
            <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
          </Pressable>
        )}
      </View>

      {!query && categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          keyboardShouldPersistTaps="handled"
        >
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              emoji={c.emojis[0]?.emoji}
              selected={c.id === activeId}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </ScrollView>
      )}

      {isError && (
        <Typography variant="caption" color={colors.secondaryText}>
          Emoji listesi yüklenemedi, temel emojiler gösteriliyor.
        </Typography>
      )}

      <BottomSheetScrollView
        style={styles.flex}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading
          ? Array.from({ length: 24 }, (_, i) => (
              <Skeleton key={i} width={CELL} height={CELL} radius={radius.md} />
            ))
          : visible.map((e) => {
              const selected = e.code === selectedCode;
              return (
                // 100+ hücrelik ızgarada BouncyButton animasyonu yerine hafif Pressable
                <Pressable
                  key={e.code}
                  onPress={() => onChange(selected ? '' : e.emoji)}
                  accessibilityLabel={e.name}
                  style={[
                    styles.cell,
                    selected && { backgroundColor: colors.passiveState, borderColor: colors.primary },
                  ]}
                >
                  <Emoji size={26}>{e.emoji}</Emoji>
                </Pressable>
              );
            })}
        {!isLoading && visible.length === 0 && (
          <Typography variant="bodySmall" color={colors.secondaryText} style={styles.empty}>
            “{query}” için emoji bulunamadı.
          </Typography>
        )}
      </BottomSheetScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  categories: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    width: '100%',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
