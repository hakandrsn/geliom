import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "./ThemeContext";

export interface BottomSheetOptions {
  enablePanDownToClose?: boolean;
  enableOverlayTap?: boolean;
  snapPoints?: (string | number)[];
  index?: number;
  handleIndicatorStyle?: any;
  backgroundStyle?: any;
  /**
   * İçerik kendi BottomSheetScrollView/FlatList'ini içeriyorsa true.
   * BottomSheetView sarmalayıcısı kaydırma jestini engellediği için
   * kaydırılabilir içerik düz bir View içinde çizilir.
   */
  scrollable?: boolean;
}

interface BottomSheetContextValue {
  openBottomSheet: (content: ReactNode, options?: BottomSheetOptions) => void;
  closeBottomSheet: () => void;
  snapToIndex: (index: number) => void;
  updateContent: (content: ReactNode) => void;
  isOpen: boolean;
}

const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(undefined);

const DEFAULT_OPTIONS: Required<Pick<BottomSheetOptions, "enablePanDownToClose" | "enableOverlayTap" | "snapPoints" | "index">> = {
  enablePanDownToClose: true,
  enableOverlayTap: true,
  snapPoints: ["60%"],
  index: 0,
};

/**
 * Uygulamanın tek ortak bottom sheet'i — gorhom `BottomSheetModal`, ref ile
 * `present()` / `dismiss()`.
 *
 * Durum makinesi (zamanlayıcı YOK):
 *   kapalı ──open──▶ açık ──close/pan/backdrop──▶ kapanıyor ──onDismiss──▶ kapalı
 * - Açıkken open: içerik ve boyut yerinde güncellenir (ör. onay adımı 2).
 * - Kapanırken open: istek bekletilir, onDismiss gelince yeniden present edilir.
 *   Eskiden burada 300 ms'lik temizleme zamanlayıcısı yeni içeriği siliyordu
 *   ve sheet bir daha açılmıyordu.
 */
export const BottomSheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { colors, shadows } = useTheme();
  const modalRef = useRef<BottomSheetModal>(null);

  const [content, setContent] = useState<ReactNode>(null);
  const [options, setOptions] = useState<BottomSheetOptions>(DEFAULT_OPTIONS);
  const [isOpen, setIsOpen] = useState(false);

  // Kimliği sabit fonksiyonlar için durum ref'lerde tutulur
  const phaseRef = useRef<"closed" | "open" | "closing">("closed");
  const reopenPendingRef = useRef(false);

  const snapPoints = useMemo(
    () => options.snapPoints ?? DEFAULT_OPTIONS.snapPoints,
    [options.snapPoints],
  );

  const present = useCallback(() => {
    phaseRef.current = "open";
    setIsOpen(true);
    // Yeni snapPoints'in render'a yansıması için bir frame bekle
    requestAnimationFrame(() => modalRef.current?.present());
  }, []);

  const openBottomSheet = useCallback(
    (newContent: ReactNode, newOptions?: BottomSheetOptions) => {
      setContent(newContent);
      setOptions({ ...DEFAULT_OPTIONS, ...newOptions });

      switch (phaseRef.current) {
        case "open":
          // Yerinde güncelle; boyut değiştiyse ilgili snap noktasına git
          requestAnimationFrame(() => modalRef.current?.snapToIndex(newOptions?.index ?? 0));
          break;
        case "closing":
          reopenPendingRef.current = true;
          break;
        case "closed":
          present();
          break;
      }
    },
    [present],
  );

  const closeBottomSheet = useCallback(() => {
    reopenPendingRef.current = false;
    if (phaseRef.current === "closed") return;
    phaseRef.current = "closing";
    modalRef.current?.dismiss();
  }, []);

  const snapToIndex = useCallback((index: number) => {
    modalRef.current?.snapToIndex(index);
  }, []);

  const updateContent = useCallback((newContent: ReactNode) => {
    setContent(newContent);
  }, []);

  // Sürükleyerek / arka plana dokunarak kapanma da "kapanıyor" sayılır
  const handleAnimate = useCallback((_from: number, to: number) => {
    if (to === -1 && phaseRef.current === "open") phaseRef.current = "closing";
  }, []);

  const handleDismiss = useCallback(() => {
    if (reopenPendingRef.current) {
      // Kapanırken yeni sheet istendi — şimdi aç (içerik zaten ayarlı)
      reopenPendingRef.current = false;
      present();
      return;
    }
    phaseRef.current = "closed";
    setIsOpen(false);
    setContent(null);
  }, [present]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
        pressBehavior={options.enableOverlayTap ? "close" : "none"}
      />
    ),
    [options.enableOverlayTap],
  );

  const value = useMemo(
    () => ({ openBottomSheet, closeBottomSheet, snapToIndex, updateContent, isOpen }),
    [openBottomSheet, closeBottomSheet, snapToIndex, updateContent, isOpen],
  );

  return (
    // Sıra önemli: modal içeriği BottomSheetModalProvider'ın portal'ında
    // çizilir; sheet içindeki bileşenler useBottomSheet kullanabilsin diye
    // context provider DIŞARIDA olmalı.
    <BottomSheetContext.Provider value={value}>
      <BottomSheetModalProvider>
        {children}
        <BottomSheetModal
          ref={modalRef}
          index={options.index ?? 0}
          snapPoints={snapPoints}
          enablePanDownToClose={options.enablePanDownToClose}
          enableDynamicSizing={false}
          backdropComponent={renderBackdrop}
          onAnimate={handleAnimate}
          onDismiss={handleDismiss}
          handleIndicatorStyle={[
            styles.handleIndicator,
            { backgroundColor: colors.lightText },
            options.handleIndicatorStyle,
          ]}
          backgroundStyle={[
            styles.sheetBackground,
            // rgba kart rengi sheet'te görünmez kalıyordu — opak yüzey şart
            { backgroundColor: colors.sheetBackground },
            shadows.floating,
            options.backgroundStyle,
          ]}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
        >
          {options.scrollable ? (
            <View style={styles.contentContainer}>{content}</View>
          ) : (
            <BottomSheetView style={styles.contentContainer}>{content}</BottomSheetView>
          )}
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = (): BottomSheetContextValue => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
