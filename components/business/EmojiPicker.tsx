import { DEFAULT_MOODS, DEFAULT_STATUSES } from '@/api/constants';
import { emojiCode, useEmojiCatalog, type EmojiEntry } from '@/api/emojis';
import { Typography } from '@/components/shared';
import { Emoji, Skeleton } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

const CELL = 44;
const GAP = spacing.xs;

/** Katalog yüklenemezse (çevrimdışı) pakette gömülü varsayılanlar gösterilir. */
const FALLBACK: EmojiEntry[] = [...DEFAULT_MOODS, ...DEFAULT_STATUSES].map((o) => ({
  emoji: o.emoji,
  code: emojiCode(o.emoji),
  name: o.text,
  keywords: [],
}));

const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

/**
 * Ortak katalogdan emoji seçici: arama + TEK ızgara (kategori sekmesi yok —
 * tüm emojiler sırayla). Izgara sanallaştırılmıştır; yüzlerce görsel aynı
 * anda çizilmez. Bottom sheet içinde kullanılır, sheet `scrollable: true`
 * açılmalı.
 */
export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const { colors } = useTheme();
  const { data, isLoading, isError } = useEmojiCatalog();
  const [query, setQuery] = useState('');
  const [width, setWidth] = useState(0);
  const selectedCode = value ? emojiCode(value) : null;

  const all = useMemo(() => {
    if (!data) return isError ? FALLBACK : [];
    const seen = new Set<string>();
    return data.categories
      .flatMap((c) => c.emojis)
      .filter((e) => (seen.has(e.code) ? false : (seen.add(e.code), true)));
  }, [data, isError]);

  const visible = useMemo(() => {
    const q = normalize(query);
    if (!q) return all;
    return all.filter(
      (e) => normalize(e.name).includes(q) || e.keywords.some((k) => normalize(k).includes(q)),
    );
  }, [all, query]);

  // Sütun sayısı genişlikten: hücreler arası boşluk eşit dağılır, sağda boşluk kalmaz
  const columns = Math.max(1, Math.floor((width + GAP) / (CELL + GAP)));
  const columnGap = columns > 1 ? (width - columns * CELL) / (columns - 1) : 0;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const renderItem = useCallback(
    ({ item }: { item: EmojiEntry }) => {
      const selected = item.code === selectedCode;
      return (
        <Pressable
          onPress={() => onChange(selected ? '' : item.emoji)}
          accessibilityLabel={item.name}
          style={[
            styles.cell,
            selected && { backgroundColor: colors.passiveState, borderColor: colors.primary },
          ]}
        >
          <Emoji size={26}>{item.emoji}</Emoji>
        </Pressable>
      );
    },
    [selectedCode, onChange, colors],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
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

      {isError && (
        <Typography variant="caption" color={colors.secondaryText}>
          Emoji listesi yüklenemedi, temel emojiler gösteriliyor.
        </Typography>
      )}

      {isLoading || width === 0 ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 18 }, (_, i) => (
            <Skeleton key={i} width={CELL} height={CELL} radius={radius.md} />
          ))}
        </View>
      ) : (
        <BottomSheetFlatList
          // Sütun sayısı değişince FlatList yeniden kurulmalı
          key={columns}
          data={visible}
          keyExtractor={(e) => e.code}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? { gap: columnGap } : undefined}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={columns * 6}
          maxToRenderPerBatch={columns * 4}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: CELL + GAP,
            offset: (CELL + GAP) * Math.floor(index / columns),
            index,
          })}
          ListEmptyComponent={
            <Typography variant="bodySmall" color={colors.secondaryText} style={styles.empty}>
              “{query}” için emoji bulunamadı.
            </Typography>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.sm,
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
  skeletons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  grid: {
    gap: GAP,
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
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
