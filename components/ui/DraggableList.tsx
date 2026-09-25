import * as Haptics from "expo-haptics";
import React, { ReactNode, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Positions = Record<string, number>;

export interface DraggableListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  /** Sabit satır yüksekliği — konum hesabı bununla yapılır */
  rowHeight: number;
  /**
   * Satırı çizer. `handle` sürükleme tutamacının içine konacak içeriktir;
   * yalnızca tutamaçtan sürüklenir, satırın geri kalanı dokunmaya açık kalır.
   */
  renderItem: (item: T, info: { handle: (child: ReactNode) => ReactNode; index: number }) => ReactNode;
  onReorder: (data: T[]) => void;
  /** Sürükleme başlayıp bitince (üst ScrollView'u kilitlemek için) */
  onDragStateChange?: (dragging: boolean) => void;
}

const SPRING = { damping: 22, stiffness: 260, mass: 0.6 };

const indexMap = (keys: string[]): Positions =>
  Object.fromEntries(keys.map((k, i) => [k, i]));

/**
 * Sürükle-bırak sıralanabilir liste. react-native-draggable-flatlist
 * Reanimated 4 ile çalışmadığı için Gesture Handler + Reanimated ile
 * yazıldı: satırlar mutlak konumlu, konumlar UI thread'de takas edilir,
 * bırakınca yeni sıra JS'e bildirilir.
 */
export default function DraggableList<T>({
  data,
  keyExtractor,
  rowHeight,
  renderItem,
  onReorder,
  onDragStateChange,
}: DraggableListProps<T>) {
  const keys = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);
  const keysSignature = keys.join("|");
  const positions = useSharedValue<Positions>(indexMap(keys));

  // Veri dışarıdan değişince (ekle/sil) konumları sıfırla
  useEffect(() => {
    positions.set(indexMap(keys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature]);

  const handleDrop = useCallback(
    (final: Positions) => {
      onDragStateChange?.(false);
      const next = [...data].sort(
        (a, b) => final[keyExtractor(a)] - final[keyExtractor(b)],
      );
      const changed = next.some((item, i) => item !== data[i]);
      if (changed) onReorder(next);
    },
    [data, keyExtractor, onReorder, onDragStateChange],
  );

  const handleStart = useCallback(() => {
    Haptics.selectionAsync();
    onDragStateChange?.(true);
  }, [onDragStateChange]);

  return (
    <View style={{ height: data.length * rowHeight }}>
      {data.map((item, index) => {
        const key = keys[index];
        return (
          <DraggableRow
            key={key}
            id={key}
            count={data.length}
            rowHeight={rowHeight}
            positions={positions}
            onStart={handleStart}
            onDrop={handleDrop}
          >
            {(handle) => renderItem(item, { handle, index })}
          </DraggableRow>
        );
      })}
    </View>
  );
}

interface DraggableRowProps {
  id: string;
  count: number;
  rowHeight: number;
  positions: SharedValue<Positions>;
  onStart: () => void;
  onDrop: (positions: Positions) => void;
  children: (handle: (child: ReactNode) => ReactNode) => ReactNode;
}

function DraggableRow({ id, count, rowHeight, positions, onStart, onDrop, children }: DraggableRowProps) {
  const active = useSharedValue(false);
  const y = useSharedValue((positions.get()[id] ?? 0) * rowHeight);
  const startY = useSharedValue(0);

  // Başka satır yer değiştirince bu satır yeni yerine kayar
  useAnimatedReaction(
    () => positions.get()[id],
    (current, previous) => {
      if (current !== previous && current !== undefined && !active.get()) {
        y.set(withSpring(current * rowHeight, SPRING));
      }
    },
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      active.set(true);
      startY.set(y.get());
      runOnJS(onStart)();
    })
    .onUpdate((e) => {
      const max = (count - 1) * rowHeight;
      y.set(Math.min(Math.max(startY.get() + e.translationY, 0), max));

      const newIndex = Math.min(Math.max(Math.round(y.get() / rowHeight), 0), count - 1);
      const oldIndex = positions.get()[id];
      if (newIndex !== oldIndex) {
        const next: Positions = { ...positions.get() };
        for (const key in next) {
          if (next[key] === newIndex) {
            next[key] = oldIndex;
            break;
          }
        }
        next[id] = newIndex;
        positions.set(next);
      }
    })
    .onEnd(() => {
      y.set(withSpring(positions.get()[id] * rowHeight, SPRING));
    })
    .onFinalize(() => {
      if (!active.get()) return;
      active.set(false);
      runOnJS(onDrop)(positions.get());
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }, { scale: withSpring(active.get() ? 1.02 : 1, SPRING) }],
    zIndex: active.get() ? 10 : 0,
    shadowOpacity: withSpring(active.get() ? 0.18 : 0, SPRING),
  }));

  const handle = (child: ReactNode) => (
    <GestureDetector gesture={pan}>
      <View hitSlop={8}>{child}</View>
    </GestureDetector>
  );

  return (
    <Animated.View style={[styles.row, { height: rowHeight }, style]}>
      {children(handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
});
