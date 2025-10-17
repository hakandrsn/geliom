import { useTheme } from '@/contexts/ThemeContext';
import { fonts, typography, type Fonts, type TypographyKeys } from '@/theme/typography';
import { Platform, Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from 'react-native';

interface TextProps extends RNTextProps {
    variant?: keyof TypographyKeys;
    fontWeight?: keyof Fonts;
    color?: string;
}

export default function CustomText({
    variant = 'body',
    fontWeight,
    children,
    style,
    color,
    ...props
}: TextProps) {
    const { colors } = useTheme();
    const variantStyle = typography[variant];
    const { defaultFontWeight, ...baseVariantStyles } = variantStyle;
    const finalWeight = fontWeight || defaultFontWeight;
    const fontFamily = fonts[finalWeight];

    let processedChildren = children;

    if (typeof children === 'string') {
        processedChildren = children
            .replace(/tt/g, 't\u200Bt') 
            .replace(/fi/g, 'f\u200Bi') 
            .replace(/fl/g, 'f\u200Bl') 
            .replace(/ti/g, 't\u200Bi') 
            .replace(/ff/g, 'f\u200Bf');
    }

    const combinedStyle = [
        { color: color || colors.text },
        baseVariantStyles,
        { fontFamily: fontFamily },
        style,
    ] as StyleProp<TextStyle>[];

    return (
        <RNText 
            style={[combinedStyle, Platform.OS === 'android' && {fontVariant: ['no-common-ligatures']}]} 
            {...props}
        >
            {processedChildren}
        </RNText>
    );
};

