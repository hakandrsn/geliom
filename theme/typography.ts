

export interface Fonts {
    regular: string;
    medium: string;
    light: string;
    semibold: string;
}

interface TypographyVariant {
    fontSize: number;
    lineHeight: number;
    defaultFontWeight: keyof Fonts;
    letterSpacing?: number;
    fontVariant?: string[];
    // İsterseniz letterSpacing gibi başka varsayılan özellikler de ekleyebilirsiniz
    // letterSpacing?: number;
}

export type TypographyKeys = {
    h1: TypographyVariant;
    h2: TypographyVariant;
    h3: TypographyVariant;
    h4: TypographyVariant;
    h5: TypographyVariant;
    h6: TypographyVariant;
    h7: TypographyVariant;
    body: TypographyVariant;
    body2: TypographyVariant;
    caption: TypographyVariant;
};

// Projenizde kullanacağınız font ailelerini burada tanımlayın
// Fontları projenize nasıl ekleyeceğinizi Expo dökümanlarından öğrenebilirsiniz.
export const fonts: Fonts = {
    light: 'Outfit-Light',
    regular: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semibold: 'Outfit-SemiBold', // 'bold' yerine 'semibold' kullanmak daha doğru
};

export const typography: TypographyKeys = {
    h1: {
        fontSize: 48,
        lineHeight: 72,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h2: {
        fontSize: 40,
        lineHeight: 60,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h3: {
        fontSize: 32,
        lineHeight: 48,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h4: {
        fontSize: 24,
        lineHeight: 36,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h5: {
        fontSize: 20,
        lineHeight: 30,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h6: {
        fontSize: 18,
        lineHeight: 30,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    h7: {
        fontSize: 16,
        lineHeight: 24,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    body: {
        fontSize: 14,
        lineHeight: 18,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    body2: {
        fontSize: 12,
        lineHeight: 16,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
    caption: {
        fontSize: 10,
        lineHeight: 15,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
        fontVariant: ['no-common-ligatures']
    },
};