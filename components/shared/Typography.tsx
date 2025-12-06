import { useTheme } from '@/contexts/ThemeContext';
import { fonts, typography, TypographyKeys } from '@/theme/typography';
import React, { useMemo } from 'react';
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
  
  // Seçilen variant'ın stillerini al - memoize edildi
  const variantStyle = useMemo(() => typography[variant], [variant]);
  
  // Font weight'i belirle (prop > variant default > regular) - memoize edildi
  const finalFontWeight = useMemo(
    () => fontWeight || variantStyle.defaultFontWeight,
    [fontWeight, variantStyle.defaultFontWeight]
  );
  
  // Final style'ı oluştur - memoize edildi
  const textStyle: TextStyle = useMemo(() => ({
    fontSize: variantStyle.fontSize,
    lineHeight: variantStyle.lineHeight,
    fontFamily: fonts[finalFontWeight],
    letterSpacing: variantStyle.letterSpacing,
    color: color || colors.text,
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  }), [variantStyle, finalFontWeight, color, colors.text, style]);

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

// Typography için React.memo kullanmıyoruz çünkü children prop'u sürekli değişiyor
// ve shallow comparison çalışmıyor
export default Typography;
