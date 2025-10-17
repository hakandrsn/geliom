import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { CustomText } from "../shared";

export type NetworkToastType = 'weak' | 'offline';

interface NetworkToastProps {
  type: NetworkToastType;
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

export default function NetworkToast({
  type,
  message,
  visible,
  onHide,
  duration = 3000,
}: NetworkToastProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    
    setTimeout(() => {
      onHide?.();
    }, 300);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isWeak = type === 'weak';
  const iconBgColor = isWeak ? '#FFA500' : '#E50049'; // Orange for weak, Red for offline

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isWeak ? colors.secondarybackground : colors.secondarybackground,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        {isWeak ? (
          <Ionicons name="information" size={20} color={colors.white} />
        ) : (
          <View style={styles.crossIcon}>
            <View style={[styles.crossLine, styles.crossLine1, { backgroundColor: colors.text }]} />
            <View style={[styles.crossLine, styles.crossLine2, { backgroundColor: colors.text }]} />
          </View>
        )}
      </View>

      <View style={styles.messageContainer}>
        <CustomText
          variant="body"
          fontWeight="regular"
          color={colors.text}
          style={styles.message}
        >
          {message}
        </CustomText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  crossIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  crossLine1: {
    transform: [{ rotate: '45deg' }],
  },
  crossLine2: {
    transform: [{ rotate: '-45deg' }],
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    lineHeight: 20,
  },
});

