import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
// Yeni animasyon bileşenini import ediyoruz
import { BouncyButton } from '../anim/AnimatedComponents';

export type GeliomButtonState = 'active' | 'passive' | 'loading';
export type GeliomButtonSize = 'small' | 'medium' | 'large' | 'xl';
export type GeliomButtonLayout = 'default' | 'icon-left' | 'icon-right' | 'icon-only' | 'full-width';

export interface GeliomButtonProps {
  children?: ReactNode;
  state?: GeliomButtonState;
  size?: GeliomButtonSize;
  layout?: GeliomButtonLayout;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textColor?: string;
  backgroundColor?: string;
  textStyle?: any;
}

// Button size config - sabit olduğu için dışarıda tanımlıyoruz
const BUTTON_SIZE_CONFIG = {
  small: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    fontSize: 14,
    iconSize: 16,
    minHeight: 32,
    gap: 6,
  },
  medium: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    fontSize: 16,
    iconSize: 18,
    minHeight: 42,
    gap: 8,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 22,
    fontSize: 18,
    iconSize: 20,
    minHeight: 52,
    gap: 10,
  },
  xl: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 26,
    fontSize: 20,
    iconSize: 24,
    minHeight: 62,
    gap: 12,
  },
} as const;

const GeliomButton: React.FC<GeliomButtonProps> = ({
  children,
  state = 'active',
  size = 'medium',
  layout = 'default',
  icon,
  onPress,
  disabled = false,
  style,
  textColor,
  backgroundColor,
  textStyle,
}) => {
  const { colors } = useTheme();

  // Current config - sadece size değiştiğinde güncellenir
  const currentConfig = useMemo(() => BUTTON_SIZE_CONFIG[size], [size]);

  // State colors - memoize edildi
  const stateColors = useMemo(() => {
    const activeColor = colors.primary;
    const passiveColor = colors.tertiary;
    const loadingColor = colors.secondary;

    switch (state) {
      case 'active':
        return {
          backgroundColor: backgroundColor || activeColor,
          textColor: textColor || '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'passive':
        return {
          backgroundColor: backgroundColor || passiveColor + '40',
          textColor: textColor || colors.primary,
          borderColor: 'transparent',
        };
      case 'loading':
        return {
          backgroundColor: backgroundColor || loadingColor,
          textColor: textColor || '#FFFFFF',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: backgroundColor || activeColor,
          textColor: textColor || '#FFFFFF',
          borderColor: 'transparent',
        };
    }
  }, [state, colors, backgroundColor, textColor]);

  // Button style - memoize edildi
  const buttonStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: currentConfig.paddingHorizontal,
      paddingVertical: currentConfig.paddingVertical,
      borderRadius: currentConfig.borderRadius,
      minHeight: currentConfig.minHeight,
      gap: currentConfig.gap,
      backgroundColor: stateColors.backgroundColor,
      borderColor: stateColors.borderColor,
      opacity: disabled ? 0.6 : 1,
    };

    switch (layout) {
      case 'icon-left':
        return { ...baseStyle, flexDirection: 'row' };
      case 'icon-right':
        return { ...baseStyle, flexDirection: 'row-reverse' };
      case 'icon-only':
        return {
          ...baseStyle,
          paddingHorizontal: 0,
          width: currentConfig.minHeight,
          justifyContent: 'center',
        };
      case 'full-width':
        return { ...baseStyle, width: '100%' };
      default:
        return baseStyle;
    }
  }, [currentConfig, stateColors, disabled, layout]);

  // Render functions - memoize edildi
  const renderIcon = useCallback(() => {
    if (!icon) return null;
    return (
      <Ionicons
        name={icon}
        size={currentConfig.iconSize}
        color={stateColors.textColor}
      />
    );
  }, [icon, currentConfig.iconSize, stateColors.textColor]);

  const textStyleMemo = useMemo(() => [
    styles.text,
    {
      color: stateColors.textColor,
      fontSize: currentConfig.fontSize,
    },
    textStyle
  ], [stateColors.textColor, currentConfig.fontSize, textStyle]);

  const renderText = useCallback(() => {
    if (layout === 'icon-only') return null;
    if (state === 'loading') return null;

    return (
      <Text style={textStyleMemo}>
        {children}
      </Text>
    );
  }, [layout, state, textStyleMemo, children]);

  const renderLoading = useCallback(() => {
    if (state !== 'loading') return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={stateColors.textColor} />
      </View>
    );
  }, [state, stateColors.textColor]);

  // TouchableOpacity yerine BouncyButton kullanıyoruz
  return (
    <BouncyButton
      onPress={onPress}
      disabled={disabled || state === 'loading'}
      style={[
        buttonStyle,
        style,
      ]}
    >
      {state === 'loading' ? (
        renderLoading()
      ) : (
        <>
          {(layout === 'icon-left' || layout === 'icon-only') && renderIcon()}
          {renderText()}
          {layout === 'icon-right' && renderIcon()}
        </>
      )}
    </BouncyButton>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Comfortaa-SemiBold',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// React.memo ile sarmalayıp shallow comparison yapıyoruz
export default React.memo(GeliomButton);