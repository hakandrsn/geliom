import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
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

  // Organik boyutlandırma
  const buttonSizeConfig = {
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
  };

  const currentConfig = buttonSizeConfig[size];

  const getStateColors = () => {
    // Tema renklerinden güvenli erişim
    const activeColor = colors.primary;
    const passiveColor = colors.tertiary;
    const loadingColor = colors.secondary;

    switch (state) {
      case 'active':
        return {
          backgroundColor: backgroundColor || activeColor,
          textColor: textColor || '#FFFFFF',
          shadowColor: activeColor,
          borderColor: 'transparent',
        };
      case 'passive':
        return {
          backgroundColor: backgroundColor || passiveColor + '40', // %40 opaklık
          textColor: textColor || colors.primary,
          shadowColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'loading':
        return {
          backgroundColor: backgroundColor || loadingColor,
          textColor: textColor || '#FFFFFF',
          shadowColor: loadingColor,
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: backgroundColor || activeColor,
          textColor: textColor || '#FFFFFF',
          shadowColor: activeColor,
          borderColor: 'transparent',
        };
    }
  };

  const stateColors = getStateColors();

  const getLayoutStyle = (): ViewStyle => {
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
          width: currentConfig.minHeight, // Kare form
          justifyContent: 'center',
        };
      case 'full-width':
        return { ...baseStyle, width: '100%' };
      default:
        return baseStyle;
    }
  };

  const buttonStyle = getLayoutStyle();

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <Ionicons
        name={icon}
        size={currentConfig.iconSize}
        color={stateColors.textColor}
      />
    );
  };

  const renderText = () => {
    if (layout === 'icon-only') return null;
    if (state === 'loading') return null;

    return (
      <Text style={[styles.text, {
        color: stateColors.textColor,
        fontSize: currentConfig.fontSize,
      }, textStyle]}>
        {children}
      </Text>
    );
  };

  const renderLoading = () => {
    if (state !== 'loading') return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={stateColors.textColor} />
      </View>
    );
  };

  // TouchableOpacity yerine BouncyButton kullanıyoruz
  return (
    <BouncyButton
      onPress={onPress}
      disabled={disabled || state === 'loading'}
      style={[
        buttonStyle,
        state === 'active' && styles.shadow, // Sadece active iken gölge
        { shadowColor: stateColors.shadowColor },
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
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GeliomButton;