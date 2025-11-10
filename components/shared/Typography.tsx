import { useTheme } from '@/contexts/ThemeContext';
import { fonts, typography, TypographyKeys } from '@/theme/typography';
import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

// Typography component props
interface TypographyProps extends TextProps {
  variant?: keyof TypographyKeys;
  color?: string;
  fontWeight?: keyof typeof fonts;
  children: React.ReactNode;
}

// Typography component - Geliom için optimize edilmiş
const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color,
  fontWeight,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  
  // Seçilen variant'ın stillerini al
  const variantStyle = typography[variant];
  
  // Font weight'i belirle (prop > variant default > regular)
  const finalFontWeight = fontWeight || variantStyle.defaultFontWeight;
  
  // Final style'ı oluştur
  const textStyle: TextStyle = {
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    fontFamily: fonts[finalFontWeight],
    letterSpacing: variantStyle.letterSpacing,
    color: color || colors.text,
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

export default Typography;
