import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';

// Bottom Sheet Options Interface
export interface BottomSheetOptions {
    enablePanDownToClose?: boolean;
    enableOverlayTap?: boolean;
    snapPoints?: (string | number)[];
    index?: number;
    handleIndicatorStyle?: any;
    backgroundStyle?: any;
}

// Context Interface
interface BottomSheetContextValue {
    openBottomSheet: (content: ReactNode, options?: BottomSheetOptions) => void;
    closeBottomSheet: () => void;
    snapToIndex: (index: number) => void;
    updateContent: (content: ReactNode) => void;
    isOpen: boolean;
}

// Create Context
const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(undefined);

// Provider Props
interface BottomSheetProviderProps {
    children: ReactNode;
}

export const BottomSheetProvider: React.FC<BottomSheetProviderProps> = ({ children }) => {
    const { colors } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [content, setContent] = useState<ReactNode>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<BottomSheetOptions>({
        enablePanDownToClose: true,
        enableOverlayTap: true,
        snapPoints: ['50%'],
        index: 0,
    });

    // Default snap points
    const snapPoints = useMemo(() => options.snapPoints || ['60%'], [options.snapPoints]);

    // Open Bottom Sheet - Direkt content kabul ediyor
    const openBottomSheet = useCallback((newContent: ReactNode, newOptions?: BottomSheetOptions) => {
        // Eğer zaten açıksa, içeriği güncelle
        if (isOpen) {
            setContent(newContent);
            if (newOptions) {
                setOptions({
                    enablePanDownToClose: newOptions?.enablePanDownToClose ?? true,
                    enableOverlayTap: newOptions?.enableOverlayTap ?? true,
                    snapPoints: newOptions?.snapPoints || ['60%'],
                    index: newOptions?.index ?? 0,
                    handleIndicatorStyle: newOptions?.handleIndicatorStyle,
                    backgroundStyle: newOptions?.backgroundStyle,
                });
            }
            return;
        }

        setOptions({
            enablePanDownToClose: newOptions?.enablePanDownToClose ?? true,
            enableOverlayTap: newOptions?.enableOverlayTap ?? true,
            snapPoints: newOptions?.snapPoints || ['60%'],
            index: newOptions?.index ?? 0,
            handleIndicatorStyle: newOptions?.handleIndicatorStyle,
            backgroundStyle: newOptions?.backgroundStyle,
        });
        
        setContent(newContent);
        setIsOpen(true);
        bottomSheetRef.current?.snapToIndex(newOptions?.index ?? 0);
    }, [isOpen]);

    // Close Bottom Sheet
    const closeBottomSheet = useCallback(() => {
        bottomSheetRef.current?.close();
        setIsOpen(false);
        // Animasyon bitene kadar içeriği temizleme
        setTimeout(() => setContent(null), 300);
    }, []);

    const snapToIndex = useCallback((index: number) => {
        bottomSheetRef.current?.snapToIndex(index);
    }, []);

    // Update content without closing/reopening
    const updateContent = useCallback((newContent: ReactNode) => {
        setContent(newContent);
    }, []);

    // Render backdrop
    const renderBackdrop = useCallback(
        (props: any) => {
            // Android'de backdrop touch event'leri blokluyor
            // Sadece bottom sheet açıksa (index >= 0) backdrop göster
            if (props.animatedIndex?.value < 0) {
                return null;
            }
            return (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                    pressBehavior={options.enableOverlayTap ? 'close' : 'none'}
                />
            );
        },
        [options.enableOverlayTap]
    );

    // Context value
    const value = useMemo(
        () => ({
            openBottomSheet,
            closeBottomSheet,
            snapToIndex,
            updateContent,
            isOpen,
        }),
        [openBottomSheet, closeBottomSheet, isOpen, snapToIndex, updateContent]
    );

    return (
        <BottomSheetContext.Provider value={value}>
            {children}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={options.enablePanDownToClose}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={[
                    styles.handleIndicator,
                    { backgroundColor: colors.activeState },
                    options.handleIndicatorStyle,
                ]}
                backgroundStyle={[
                    { backgroundColor: colors.secondaryBackground },
                    options.backgroundStyle,
                ]}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="none"
                android_keyboardInputMode="adjustPan"
                enableDynamicSizing={false}
                animateOnMount={false}
                onChange={(index) => {
                    if (index === -1) {
                        setIsOpen(false);
                        setTimeout(() => setContent(null), 300);
                    }
                }}
            >
                <BottomSheetView style={styles.contentContainer}>
                    {content}
                </BottomSheetView>
            </BottomSheet>
        </BottomSheetContext.Provider>
    );
};

// Custom Hook
export const useBottomSheet = (): BottomSheetContextValue => {
    const context = useContext(BottomSheetContext);
    if (!context) {
        throw new Error('useBottomSheet must be used within a BottomSheetProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    handleIndicator: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
});

