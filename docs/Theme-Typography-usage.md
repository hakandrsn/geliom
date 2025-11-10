# Geliom - Theme & Typography Kullanım Kılavuzu

Geliom uygulaması için özel olarak tasarlanmış doğa temalı renk paleti ve Comfortaa font ailesi ile typography sistemi.

## 🎨 Renk Paleti

### Doğa Temalı Yeşil Tonlar

#### Light Theme
- **Primary**: `#2E7D32` (Orman yeşili)
- **Secondary**: `#4CAF50` (Çimen yeşili)  
- **Tertiary**: `#81C784` (Açık yeşil)
- **Background**: `#F1F8E9` (Çok açık yeşil arkaplan)
- **Text**: `#1B5E20` (Koyu yeşil metin)

#### Dark Theme
- **Primary**: `#4CAF50` (Parlak yeşil)
- **Secondary**: `#66BB6A` (Orta yeşil)
- **Background**: `#0D1B0F` (Çok koyu yeşil arkaplan)
- **Text**: `#E8F5E8` (Açık yeşil metin)

### Kullanım
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { colors } = useTheme();

// Renkleri kullan
<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.text }}>Metin</Text>
</View>
```

## 🔤 Typography Sistemi

### Comfortaa Font Ailesi
- **Light**: Comfortaa-Light
- **Regular**: Comfortaa-Regular  
- **Medium**: Comfortaa-Medium
- **SemiBold**: Comfortaa-SemiBold
- **Bold**: Comfortaa-Bold

### Typography Variants

#### Başlık Seviyeleri
- **h1**: 32px, Bold - Ana başlık (Geliom logo)
- **h2**: 28px, SemiBold - Sayfa başlıkları
- **h3**: 24px, SemiBold - Bölüm başlıkları
- **h4**: 20px, Medium - Alt başlıklar
- **h5**: 18px, Medium - Küçük başlıklar
- **h6**: 16px, Medium - Mini başlıklar

#### Gövde Metinleri
- **body**: 16px, Regular - Ana metin
- **bodyLarge**: 18px, Regular - Büyük gövde metni
- **bodySmall**: 14px, Regular - Küçük gövde metni

#### Özel Kullanımlar
- **button**: 16px, SemiBold - Buton metinleri
- **status**: 15px, Medium - Durum metinleri
- **nickname**: 16px, Medium - Takma isimler
- **groupName**: 18px, SemiBold - Grup isimleri
- **caption**: 12px, Regular - Küçük açıklamalar
- **label**: 14px, Medium - Form etiketleri

## 📱 Typography Component Kullanımı

### Basit Kullanım
```tsx
import { Typography } from '@/components/shared';

<Typography variant="h1">Ana Başlık</Typography>
<Typography variant="body">Normal metin</Typography>
<Typography variant="caption">Küçük açıklama</Typography>
```

### Renk ile Kullanım
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { colors } = useTheme();

<Typography variant="h2" color={colors.primary}>
  Yeşil Başlık
</Typography>

<Typography variant="body" color={colors.secondaryText}>
  İkincil metin
</Typography>
```

### Font Weight Override
```tsx
<Typography variant="body" fontWeight="bold">
  Kalın metin
</Typography>

<Typography variant="h3" fontWeight="light">
  İnce başlık
</Typography>
```

### Style Override
```tsx
<Typography 
  variant="body" 
  style={{ textAlign: 'center', marginBottom: 16 }}
>
  Ortalanmış metin
</Typography>
```

## 🎯 Geliom Özel Kullanımları

### Ana Sayfa Başlığı
```tsx
<Typography variant="h1" color={colors.primary}>
  Geliom 🌿
</Typography>
```

### Durum Göstergesi
```tsx
<Typography variant="status" color={colors.success}>
  🟢 Çevrimiçi
</Typography>
```

### Grup İsimleri
```tsx
<Typography variant="groupName" color={colors.text}>
  Arkadaşlar 👥
</Typography>
```

### Butonlar
```tsx
<TouchableOpacity style={{ backgroundColor: colors.primary }}>
  <Typography variant="button" color={colors.white}>
    Gruplarım
  </Typography>
</TouchableOpacity>
```

### Takma İsimler
```tsx
<Typography variant="nickname" color={colors.secondaryText}>
  @ahmet_dostum
</Typography>
```

## 🎨 Tema Değiştirme

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { isDark, toggleTheme } = useTheme();

<TouchableOpacity onPress={toggleTheme}>
  <Ionicons 
    name={isDark ? "sunny" : "moon"} 
    size={24} 
    color={colors.text} 
  />
</TouchableOpacity>
```

## 📏 Spacing ve Layout

### Önerilen Spacing Değerleri
```tsx
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Önerilen Border Radius
```tsx
const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};
```

## 🌟 Best Practices

1. **Tutarlılık**: Her zaman Typography component'ini kullanın
2. **Renk Uyumu**: Theme colors'ı kullanarak tutarlı renk paleti sağlayın
3. **Okunabilirlik**: Uygun contrast oranlarına dikkat edin
4. **Responsive**: Farklı ekran boyutları için test edin
5. **Accessibility**: Screen reader uyumluluğunu sağlayın

## 🔧 Özelleştirme

### Yeni Variant Ekleme
```tsx
// theme/typography.ts
export type TypographyKeys = {
  // ... mevcut variants
  customVariant: TypographyVariant;
};

export const typography: TypographyKeys = {
  // ... mevcut variants
  customVariant: {
    fontSize: 20,
    lineHeight: 28,
    defaultFontWeight: 'medium',
    letterSpacing: 0,
  },
};
```

### Yeni Renk Ekleme
```tsx
// theme/colors.ts
export const lightColors = {
  // ... mevcut renkler
  customColor: '#YOUR_COLOR',
};
```

Bu sistem Geliom'un doğal, samimi ve kullanıcı dostu hissini desteklemek için özel olarak tasarlanmıştır. 🌿
