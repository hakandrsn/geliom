

export interface Fonts {
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
}

interface TypographyVariant {
    fontSize: number;
    lineHeight: number;
    defaultFontWeight: keyof Fonts;
    letterSpacing?: number;
    fontVariant?: string[];
}

export type TypographyKeys = {
    // Başlık seviyeleri - Geliom için optimize edilmiş
    h1: TypographyVariant;      // Ana başlık (Geliom logo, ana ekran)
    h2: TypographyVariant;      // Sayfa başlıkları
    h3: TypographyVariant;      // Bölüm başlıkları
    h4: TypographyVariant;      // Alt başlıklar
    h5: TypographyVariant;      // Küçük başlıklar
    h6: TypographyVariant;      // Mini başlıklar
    
    // Gövde metinleri - Sosyal etkileşim için optimize
    body: TypographyVariant;    // Ana metin (mesajlar, açıklamalar)
    bodyLarge: TypographyVariant; // Büyük gövde metni
    bodySmall: TypographyVariant; // Küçük gövde metni
    
    // Özel kullanımlar
    caption: TypographyVariant; // Küçük açıklamalar, zaman damgaları
    button: TypographyVariant;  // Buton metinleri
    label: TypographyVariant;   // Form etiketleri
    
    // Sosyal özellikler için
    status: TypographyVariant;  // Durum metinleri ("Müsaitim", "Meşgulüm")
    nickname: TypographyVariant; // Takma isimler
    groupName: TypographyVariant; // Grup isimleri
};

// Comfortaa font ailesi - Geliom'un doğal ve samimi hissi için
export const fonts: Fonts = {
    light: 'Comfortaa-Light',
    regular: 'Comfortaa-Regular',
    medium: 'Comfortaa-Medium',
    semibold: 'Comfortaa-SemiBold',
    bold: 'Comfortaa-Bold',
};

export const typography: TypographyKeys = {
    // Ana başlık - Geliom logo ve hoş geldin mesajları için
    h1: {
        fontSize: 32,
        lineHeight: 40,
        defaultFontWeight: 'bold',
        letterSpacing: -0.5,
    },
    
    // Sayfa başlıkları - "Gruplarım", "Profilim" gibi
    h2: {
        fontSize: 28,
        lineHeight: 36,
        defaultFontWeight: 'semibold',
        letterSpacing: -0.3,
    },
    
    // Bölüm başlıkları - "Arkadaşlar", "Aile" gibi grup kategorileri
    h3: {
        fontSize: 24,
        lineHeight: 32,
        defaultFontWeight: 'semibold',
        letterSpacing: -0.2,
    },
    
    // Alt başlıklar - Grup isimleri, etkinlik başlıkları
    h4: {
        fontSize: 20,
        lineHeight: 28,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Küçük başlıklar - Ayar kategorileri
    h5: {
        fontSize: 18,
        lineHeight: 24,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Mini başlıklar - Form başlıkları
    h6: {
        fontSize: 16,
        lineHeight: 22,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Ana gövde metni - Açıklamalar, mesajlar
    body: {
        fontSize: 16,
        lineHeight: 24,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
    },
    
    // Büyük gövde metni - Önemli açıklamalar
    bodyLarge: {
        fontSize: 18,
        lineHeight: 26,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
    },
    
    // Küçük gövde metni - İkincil bilgiler
    bodySmall: {
        fontSize: 14,
        lineHeight: 20,
        defaultFontWeight: 'regular',
        letterSpacing: 0,
    },
    
    // Küçük açıklamalar - Zaman damgaları, yardımcı metinler
    caption: {
        fontSize: 12,
        lineHeight: 16,
        defaultFontWeight: 'regular',
        letterSpacing: 0.2,
    },
    
    // Buton metinleri - CTA butonları
    button: {
        fontSize: 16,
        lineHeight: 20,
        defaultFontWeight: 'semibold',
        letterSpacing: 0.1,
    },
    
    // Form etiketleri
    label: {
        fontSize: 14,
        lineHeight: 18,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Durum metinleri - "Müsaitim", "Meşgulüm" gibi
    status: {
        fontSize: 15,
        lineHeight: 20,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Takma isimler - Kişiselleştirilmiş isimler
    nickname: {
        fontSize: 16,
        lineHeight: 22,
        defaultFontWeight: 'medium',
        letterSpacing: 0,
    },
    
    // Grup isimleri - Grup kartlarında
    groupName: {
        fontSize: 18,
        lineHeight: 24,
        defaultFontWeight: 'semibold',
        letterSpacing: -0.1,
    },
};