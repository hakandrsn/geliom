// Button.tsx - Gradient Kenarlık Düzeltmesiyle

import CustomText from "@/components/shared/Text";
import { useTheme } from "@/contexts/ThemeContext";
import { Fonts, TypographyKeys } from "@/theme/typography";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
    variant?: 'gradient' | 'primary' | 'outline';
    size?: 'large' | 'small';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    textVariant?: keyof TypographyKeys;
    fontWeight?: keyof Fonts;
    passive?: boolean;
}

export default function Button({
    title,
    onPress,
    variant = 'gradient',
    size = 'large',
    disabled = false,
    loading = false,
    icon,
    textVariant,
    fontWeight,
    style,
    passive = false,
    ...props
}: ButtonProps) {   
    const { colors } = useTheme();

    // Tıklanabilirliği `isEffectivelyDisabled`'a bağlıyoruz
    const isEffectivelyDisabled = (disabled || loading) && !passive;

    const defaultTextVariant = size === 'large' ? 'h6' : 'body2';

    const getGradientStartAndEnd = () => {
        if (size === 'large') return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
        return { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } };
    }

    // Tüm stil (renk, opaklık) koşullarını `shouldApplyDisabledStyle`'a bağlıyoruz
    const getTextColor = () => {
        if (isEffectivelyDisabled) return colors.secondaryText;
        if (variant === 'outline') return colors.primary;
        return colors.text;
    };

    const content = (
        <View style={[
            styles.contentWrapper,
            size === 'small' && styles.contentPadding,
        ]}>
            {icon && !loading && <View style={styles.iconWrapper}>{icon}</View>}
            <CustomText
                variant={textVariant || defaultTextVariant}
                fontWeight={fontWeight}
                style={[styles.text, { color: getTextColor() }]}
            >
                {title}
            </CustomText>
            {loading && <ActivityIndicator color={getTextColor()} style={styles.loader} />}
        </View>
    );

    const containerStyle = [
        styles.baseContainer,
        size === 'large' ? styles.largeContainer : styles.smallContainer,
        isEffectivelyDisabled && { opacity: 0.6 },
        style,
    ];

    if (variant === 'outline') {
        return (
            <TouchableOpacity 
            activeOpacity={0.8}
            onPress={onPress} disabled={isEffectivelyDisabled} style={containerStyle} {...props}>
                <LinearGradient
                    colors={isEffectivelyDisabled ? [colors.disabled, colors.disabled] : colors.linearGradient as [string, string]}
                    start={getGradientStartAndEnd().start}
                    end={getGradientStartAndEnd().end}
                    style={[
                        styles.fullWidthHeight,
                        styles.borderFrame,
                        size === 'small' ? styles.smallBorderRadius : styles.largeBorderRadius,
                    ]}
                >
                    <View style={[
                        styles.outlineInnerView,
                        { backgroundColor: colors.background },
                        size === 'small' ? styles.smallInnerRadius : styles.largeInnerRadius,
                    ]}>
                        {content}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }
    
    if (variant === 'gradient') {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={isEffectivelyDisabled} style={containerStyle} {...props}>
                <LinearGradient
                    colors={isEffectivelyDisabled ? [colors.disabled, colors.disabled] : colors.linearGradient as [string, string]}
                    start={getGradientStartAndEnd().start}
                    end={getGradientStartAndEnd().end}
                    style={[
                        styles.fullWidthHeight,
                        { borderRadius: size === 'large' ? styles.largeContainer.borderRadius : styles.smallContainer.borderRadius }
                    ]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={isEffectivelyDisabled}
            style={[
                { backgroundColor: isEffectivelyDisabled ? colors.disabled : colors.primary },
                containerStyle,
            ]}
            {...props}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    baseContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    largeContainer: {
        width: '100%',
        height: 56,
        borderRadius: 28,
    },
    smallContainer: {
        alignSelf: 'flex-start',
        height: 36,
        borderRadius: 20,
    },
    fullWidthHeight: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentPadding: {
        paddingHorizontal: 16,
    },
    borderFrame: {
        padding: 1,
    },
    iconWrapper: {
        marginRight: 8,
    },
    text: {
        textAlign: 'center',
    },
    loader: {
        marginLeft: 10,
    },
    outlineInnerView: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeBorderRadius: { borderRadius: 28 },
    largeInnerRadius: { borderRadius: 27 },
    smallBorderRadius: { borderRadius: 20 },
    smallInnerRadius: { borderRadius: 19 },
});