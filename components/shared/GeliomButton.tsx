import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

// Geliom'un ana button sistemi - Forest, Sage, Pine temalı
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
}) => {
  const { colors, isDark } = useTheme();

  // Adaçayı tarzı - organik, yumuşak, doğal padding ve radius sistemi
  const sageStyleConfig = {
    small: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14, // Adaçayı yaprağı gibi yumuşak
      fontSize: 14,
      iconSize: 16,
      minHeight: 32,
      gap: 6,
    },
    medium: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 18, // Organik yuvarlaklık
      fontSize: 16,
      iconSize: 18,
      minHeight: 42,
      gap: 8,
    },
    large: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 22, // Daha belirgin organik form
      fontSize: 18,
      iconSize: 20,
      minHeight: 52,
      gap: 10,
    },
    xl: {
      paddingHorizontal: 32,
      paddingVertical: 20,
      borderRadius: 26, // Büyük organik form
      fontSize: 20,
      iconSize: 24,
      minHeight: 62,
      gap: 12,
    },
  };

  const currentConfig = sageStyleConfig[size];

  // Renk sistemi - Forest (Active), Sage (Passive), Pine (Loading)
  const getStateColors = () => {
    const baseColors = {
      forest: (colors as any).forest || '#1B5E20',    // 9. Active
      sage: (colors as any).sage || '#87A96B',        // 13. Passive  
      pine: (colors as any).pine || '#01796F',        // 17. Loading
    };

    switch (state) {
      case 'active':
        return {
          backgroundColor: baseColors.forest,
          textColor: colors.white,
          shadowColor: baseColors.forest,
          borderColor: 'transparent',
        };
      case 'passive':
        return {
          backgroundColor: baseColors.sage,
          textColor: colors.white,
          shadowColor: baseColors.sage,
          borderColor: 'transparent',
        };
      case 'loading':
        return {
          backgroundColor: baseColors.pine,
          textColor: colors.white,
          shadowColor: baseColors.pine,
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: baseColors.forest,
          textColor: colors.white,
          shadowColor: baseColors.forest,
          borderColor: 'transparent',
        };
    }
  };

  const stateColors = getStateColors();

  // Layout sistemleri
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
          paddingHorizontal: currentConfig.paddingVertical, // Kare form için
          aspectRatio: 1,
          width: currentConfig.minHeight,
        };
      case 'full-width':
        return { ...baseStyle, width: '100%' };
      default:
        return baseStyle;
    }
  };

  const buttonStyle = getLayoutStyle();

  // Icon render
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

  // Text render
  const renderText = () => {
    if (layout === 'icon-only') return null;
    if (state === 'loading') return null; // Loading state'de text gizli
    
    return (
      <Text style={[styles.text, { 
        color: stateColors.textColor,
        fontSize: currentConfig.fontSize,
      }]}>
        {children}
      </Text>
    );
  };

  // Loading indicator
  const renderLoading = () => {
    if (state !== 'loading') return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="small" 
          color={stateColors.textColor} 
        />
        {layout !== 'icon-only' && (
          <Text style={[styles.text, { 
            color: stateColors.textColor,
            fontSize: currentConfig.fontSize,
          }]}>
            Yükleniyor...
          </Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || state === 'loading'}
      style={[
        buttonStyle,
        styles.shadow,
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Comfortaa-SemiBold',
    textAlign: 'center',
  },
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default GeliomButton;
