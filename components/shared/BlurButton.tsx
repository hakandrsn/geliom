import { useTheme } from '@/contexts/ThemeContext';
import { fonts, typography } from '@/theme/typography';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// Button variant tipleri
export type BlurButtonVariant = 
  | 'primary'      // 1. Ana yeşil gradient
  | 'secondary'    // 2. İkincil yeşil
  | 'tertiary'     // 3. Açık yeşil
  | 'success'      // 4. Başarı yeşili
  | 'glass'        // 5. Şeffaf cam efekti
  | 'outline'      // 6. Çerçeveli
  | 'ghost'        // 7. Hayalet buton
  | 'danger'       // 8. Hata/silme butonu
  | 'forest'       // 9. Orman yeşili
  | 'mint'         // 10. Nane yeşili
  | 'lime'         // 11. Limon yeşili
  | 'emerald'      // 12. Zümrüt yeşili
  | 'sage'         // 13. Adaçayı yeşili
  | 'olive'        // 14. Zeytin yeşili
  | 'jade'         // 15. Yeşim yeşili
  | 'teal'         // 16. Çamurcun yeşili
  | 'pine'         // 17. Çam yeşili
  | 'moss'         // 18. Yosun yeşili
  | 'seafoam'      // 19. Deniz köpüğü
  | 'spring'       // 20. Bahar yeşili

export type BlurButtonSize = 'small' | 'medium' | 'large';

export type BlurButtonRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface BlurButtonProps {
  children: ReactNode;
  variant?: BlurButtonVariant;
  size?: BlurButtonSize;
  radius?: BlurButtonRadius;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

const BlurButton: React.FC<BlurButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  radius = 'medium',
  disabled = false,
  onPress,
  style,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
}) => {
  const { colors, isDark } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: typography.caption.fontSize,
      fontFamily: fonts[typography.caption.defaultFontWeight],
      minHeight: 36,
    },
    medium: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      fontSize: typography.button.fontSize,
      fontFamily: fonts[typography.button.defaultFontWeight],
      minHeight: 44,
    },
    large: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      fontSize: typography.h6.fontSize,
      fontFamily: fonts[typography.h6.defaultFontWeight],
      minHeight: 52,
    },
  };

  const currentSize = sizeConfig[size];

  // Radius configurations
  const radiusConfig = {
    none: 0,
    small: 6,
    medium: 12,
    large: 20,
    full: 9999,
  };

  const currentRadius = radiusConfig[radius];

  // Variant configurations
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          gradient: [colors.primary, colors.secondary] as const,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: true,
          useBlur: false,
        };
      
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'tertiary':
        return {
          backgroundColor: colors.tertiary,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'success':
        return {
          backgroundColor: colors.success,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'glass':
        return {
          backgroundColor: 'transparent',
          textColor: colors.text,
          borderColor: colors.stroke,
          useGradient: false,
          useBlur: true,
        };
      
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
          useGradient: false,
          useBlur: false,
        };
      
      case 'ghost':
        return {
          backgroundColor: colors.primary + '20',
          textColor: colors.primary,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'danger':
        return {
          backgroundColor: colors.error,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'forest':
        return {
          backgroundColor: (colors as any).forest || '#1B5E20',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'mint':
        return {
          backgroundColor: (colors as any).mint || '#00E676',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'lime':
        return {
          backgroundColor: (colors as any).lime || '#8BC34A',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'emerald':
        return {
          backgroundColor: (colors as any).emerald || '#009688',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'sage':
        return {
          backgroundColor: (colors as any).sage || '#87A96B',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'olive':
        return {
          backgroundColor: (colors as any).olive || '#6B8E23',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'jade':
        return {
          backgroundColor: (colors as any).jade || '#00A86B',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'teal':
        return {
          backgroundColor: (colors as any).teal || '#008080',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'pine':
        return {
          backgroundColor: (colors as any).pine || '#01796F',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'moss':
        return {
          backgroundColor: (colors as any).moss || '#8A9A5B',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      case 'seafoam':
        return {
          backgroundColor: (colors as any).seafoam || '#71BC78',
          textColor: colors.white,
          borderColor: 'transparent',   
          useGradient: false,
          useBlur: false,
        };
      
      case 'spring':
        return {
          backgroundColor: (colors as any).spring || '#00FF7F',
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
      
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.white,
          borderColor: 'transparent',
          useGradient: false,
          useBlur: false,
        };
    }
  };

  const variantStyle = getVariantStyle();

  const buttonStyle: ViewStyle = {
    ...currentSize,
    borderRadius: currentRadius,
    borderWidth: variantStyle.borderColor !== 'transparent' ? 1 : 0,
    borderColor: variantStyle.borderColor,
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    overflow: 'hidden',
    ...style,
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {icon && iconPosition === 'left' && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
      
      <Text
        style={[
          styles.text,
          {
            color: variantStyle.textColor,
            fontSize: currentSize.fontSize,
            fontFamily: currentSize.fontFamily,
          },
        ]}
      >
        {loading ? 'Yükleniyor...' : children}
      </Text>
      
      {icon && iconPosition === 'right' && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
    </View>
  );

  const renderButton = () => {
    if (variantStyle.useBlur) {
      return (
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={buttonStyle}
        >
          {renderContent()}
        </BlurView>
      );
    }

    if (variantStyle.useGradient && variantStyle.gradient) {
      return (
        <LinearGradient
          colors={variantStyle.gradient}
          style={buttonStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View style={[buttonStyle, { backgroundColor: variantStyle.backgroundColor }]}>
        {renderContent()}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={styles.touchable}
    >
      {renderButton()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    alignSelf: 'flex-start',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BlurButton;
