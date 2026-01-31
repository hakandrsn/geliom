import { useTheme } from "@/contexts/ThemeContext";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CustomText from "./Text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface PopoverItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

interface PopoverProps {
  items: PopoverItem[];
  trigger: React.ReactNode; // Tıklanacak element (icon, button, vs.)
  width?: number; // Popover genişliği (default: 200)
}

interface Position {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export default function Popover({ items, trigger, width = 200 }: PopoverProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position>({});
  const triggerRef = useRef<View>(null);

  const POPOVER_PADDING = 8; // Ekran kenarından minimum mesafe
  const ITEM_HEIGHT = 48; // Her item'ın yüksekliği
  const POPOVER_HEIGHT = items.length * ITEM_HEIGHT;

  // Trigger'a tıklandığında popover'ı aç ve pozisyonu hesapla
  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      const calculatedPosition = calculatePosition(
        x,
        y,
        triggerWidth,
        triggerHeight,
      );
      setPosition(calculatedPosition);
      setVisible(true);
    });
  };

  // En uygun pozisyonu hesapla
  const calculatePosition = (
    triggerX: number,
    triggerY: number,
    triggerWidth: number,
    triggerHeight: number,
  ): Position => {
    const pos: Position = {};

    // Yatay pozisyon (sağ veya sol)
    const spaceOnRight = SCREEN_WIDTH - (triggerX + triggerWidth);
    const spaceOnLeft = triggerX;

    if (spaceOnRight >= width + POPOVER_PADDING) {
      // Sağda yeterli alan var, sağa aç
      pos.left = triggerX + triggerWidth + POPOVER_PADDING;
    } else if (spaceOnLeft >= width + POPOVER_PADDING) {
      // Solda yeterli alan var, sola aç
      pos.right = SCREEN_WIDTH - triggerX + POPOVER_PADDING;
    } else {
      // Her iki tarafta da yeterli alan yok, trigger'ın altına/üstüne ortalı aç
      const centeredLeft = triggerX + triggerWidth / 2 - width / 2;
      pos.left = Math.max(
        POPOVER_PADDING,
        Math.min(centeredLeft, SCREEN_WIDTH - width - POPOVER_PADDING),
      );
    }

    // Dikey pozisyon (alt veya üst)
    const spaceBelow = SCREEN_HEIGHT - (triggerY + triggerHeight);
    const spaceAbove = triggerY;

    if (spaceBelow >= POPOVER_HEIGHT + POPOVER_PADDING) {
      // Altta yeterli alan var
      pos.top = triggerY + triggerHeight + POPOVER_PADDING;
    } else if (spaceAbove >= POPOVER_HEIGHT + POPOVER_PADDING) {
      // Üstte yeterli alan var
      pos.bottom = SCREEN_HEIGHT - triggerY + POPOVER_PADDING;
    } else {
      // Her iki tarafta da yeterli alan yok, trigger'ın yanına ortalı aç
      if (pos.left !== undefined || pos.right !== undefined) {
        // Yatay açılım yapılmışsa, dikey olarak trigger'la hizala
        pos.top = Math.max(
          POPOVER_PADDING,
          Math.min(triggerY, SCREEN_HEIGHT - POPOVER_HEIGHT - POPOVER_PADDING),
        );
      } else {
        // Ekranın ortasına yerleştir
        pos.top = (SCREEN_HEIGHT - POPOVER_HEIGHT) / 2;
      }
    }

    return pos;
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleItemPress = (item: PopoverItem) => {
    item.onPress();
    handleClose();
  };

  return (
    <>
      {/* Trigger Element */}
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity onPress={handleOpen} activeOpacity={0.7}>
          {trigger}
        </TouchableOpacity>
      </View>

      {/* Popover Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.popoverContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.stroke,
                    width: width,
                  },
                  position,
                ]}
              >
                {items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.item}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <CustomText
                        variant="body"
                        fontWeight="regular"
                        style={[styles.label, { color: colors.text }]}
                      >
                        {item.label}
                      </CustomText>
                      {item.icon && (
                        <View style={styles.iconContainer}>{item.icon}</View>
                      )}
                    </TouchableOpacity>
                    {index < items.length - 1 && (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: colors.stroke },
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent", // Overlay yok
  },
  popoverContainer: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  label: {
    flex: 1,
  },
  iconContainer: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 0, // Kenarlara sıfır
  },
});
