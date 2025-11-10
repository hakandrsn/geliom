# GeliomButton - Ana Button Sistemi 🌿

Geliom uygulamasının ana button sistemi. Forest (Active), Sage (Passive), Pine (Loading) renklerini kullanarak adaçayı tarzı organik tasarım sunar.

## 🎨 Tasarım Felsefesi

GeliomButton, doğanın organik formlarından ilham alınarak tasarlanmıştır. Adaçayı yaprağının yumuşak, organik şekli button'ların radius ve padding sistemine yansıtılmıştır.

### Renk Sistemi
- **🌲 Forest (#1B5E20)** - Active State (9. numara)
- **🌾 Sage (#87A96B)** - Passive State (13. numara)  
- **🌲 Pine (#01796F)** - Loading State (17. numara)

## 📐 Adaçayı Tarzı Boyut Sistemi

### Organik Padding ve Radius
Her boyut, adaçayı yaprağının doğal formunu taklit eder:

```tsx
small: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 14,        // Küçük yaprak formu
  fontSize: 14,
  iconSize: 16,
  minHeight: 32,
}

medium: {
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 18,        // Orta yaprak formu
  fontSize: 16,
  iconSize: 18,
  minHeight: 42,
}

large: {
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderRadius: 22,        // Büyük yaprak formu
  fontSize: 18,
  iconSize: 20,
  minHeight: 52,
}

xl: {
  paddingHorizontal: 32,
  paddingVertical: 20,
  borderRadius: 26,        // Extra büyük yaprak formu
  fontSize: 20,
  iconSize: 24,
  minHeight: 62,
}
```

## 🔧 API Referansı

### Props

```tsx
interface GeliomButtonProps {
  children?: ReactNode;           // Button metni
  state?: GeliomButtonState;      // 'active' | 'passive' | 'loading'
  size?: GeliomButtonSize;        // 'small' | 'medium' | 'large' | 'xl'
  layout?: GeliomButtonLayout;    // Layout tipi
  icon?: keyof typeof Ionicons.glyphMap; // Ionicons icon adı
  onPress?: () => void;           // Tıklama fonksiyonu
  disabled?: boolean;             // Disabled durumu
  style?: ViewStyle;              // Ek stil
}
```

### State Tipleri

```tsx
type GeliomButtonState = 'active' | 'passive' | 'loading';
```

- **active**: Ana aksiyonlar için (Forest yeşili)
- **passive**: İkincil aksiyonlar için (Sage yeşili)
- **loading**: Yükleme durumu için (Pine yeşili)

### Layout Tipleri

```tsx
type GeliomButtonLayout = 
  | 'default'     // Sadece metin
  | 'icon-left'   // Icon solda, metin sağda
  | 'icon-right'  // Metin solda, icon sağda
  | 'icon-only'   // Sadece icon (kare form)
  | 'full-width'  // Tam genişlik
```

## 🎯 Kullanım Örnekleri

### Temel Kullanım

```tsx
import { GeliomButton } from '@/components/shared';

// Active button
<GeliomButton state="active" onPress={handlePress}>
  Kaydet
</GeliomButton>

// Passive button
<GeliomButton state="passive" onPress={handleCancel}>
  İptal
</GeliomButton>

// Loading button
<GeliomButton state="loading">
  Yükleniyor...
</GeliomButton>
```

### Icon'lu Kullanım

```tsx
// Sol icon
<GeliomButton 
  state="active" 
  layout="icon-left" 
  icon="checkmark-circle"
>
  Onayla
</GeliomButton>

// Sağ icon
<GeliomButton 
  state="passive" 
  layout="icon-right" 
  icon="arrow-forward"
>
  İleri
</GeliomButton>

// Sadece icon
<GeliomButton 
  state="active" 
  layout="icon-only" 
  icon="heart"
/>
```

### Boyut Varyasyonları

```tsx
// Küçük button
<GeliomButton state="active" size="small">
  Küçük
</GeliomButton>

// Büyük button
<GeliomButton state="active" size="large">
  Büyük
</GeliomButton>

// Extra büyük button
<GeliomButton state="active" size="xl">
  Extra Büyük
</GeliomButton>
```

### Full Width

```tsx
<GeliomButton 
  state="active" 
  layout="full-width"
  icon="save"
>
  Tam Genişlik Kaydet
</GeliomButton>
```

### Kombinasyonlar

```tsx
// Büyük, icon'lu, passive button
<GeliomButton 
  state="passive" 
  size="large"
  layout="icon-left" 
  icon="information-circle"
>
  Bilgi Al
</GeliomButton>

// XL boyutunda loading button
<GeliomButton 
  state="loading" 
  size="xl"
  layout="icon-left" 
  icon="refresh"
>
  Yükleniyor...
</GeliomButton>
```

## 🎨 Görsel Özellikler

### Shadow ve Elevation
- **shadowOffset**: `{ width: 0, height: 4 }`
- **shadowOpacity**: `0.25`
- **shadowRadius**: `8`
- **elevation**: `6` (Android)

### Typography
- **fontFamily**: `Comfortaa-SemiBold`
- **textAlign**: `center`
- **color**: Otomatik (state'e göre)

### Animasyonlar
- **activeOpacity**: `0.8`
- **Disabled opacity**: `0.6`

## 🌱 Doğa Temalı Kullanım Rehberi

### Duygusal Anlamlar

#### 🌲 Forest (Active)
- **Duygu**: Güç, kararlılık, büyüme
- **Kullanım**: Ana CTA'lar, önemli aksiyonlar
- **Örnek**: "Kaydet", "Gönder", "Onayla"

#### 🌾 Sage (Passive)
- **Duygu**: Bilgelik, sakinlik, denge
- **Kullanım**: İkincil aksiyonlar, bilgi butonları
- **Örnek**: "İptal", "Geri", "Bilgi"

#### 🌲 Pine (Loading)
- **Duygu**: Dayanıklılık, süreklilik, bekleme
- **Kullanım**: Yükleme durumları, işlem süreçleri
- **Örnek**: "Yükleniyor...", "İşleniyor..."

### Icon Seçimi Rehberi

#### Doğa Temalı Icon'lar
```tsx
// Yaprak ve bitki icon'ları
icon="leaf"          // 🍃 Genel doğa
icon="flower"        // 🌸 Güzellik, büyüme
icon="tree"          // 🌳 Güç, stabilite

// Doğal elementler
icon="water"         // 💧 Temizlik, akış
icon="sunny"         // ☀️ Enerji, pozitiflik
icon="moon"          // 🌙 Sakinlik, gece modu
```

#### Aksiyon Icon'ları
```tsx
// Pozitif aksiyonlar
icon="checkmark-circle"  // ✅ Onay
icon="heart"            // ❤️ Beğeni
icon="star"             // ⭐ Favorileme

// Navigasyon
icon="arrow-forward"    // ➡️ İleri
icon="arrow-back"       // ⬅️ Geri
icon="home"             // 🏠 Ana sayfa
```

## 🚀 Performance ve Optimizasyon

### Best Practices
1. **State Management**: Button state'ini component dışında yönet
2. **Icon Optimization**: Sadece gerekli icon'ları import et
3. **Callback Optimization**: `useCallback` kullan
4. **Style Memoization**: Karmaşık stiller için `useMemo`

### Accessibility
- **accessibilityRole**: "button" (otomatik)
- **accessibilityState**: disabled durumu otomatik
- **accessibilityLabel**: children text'i otomatik

## 🎯 Geliom App'te Kullanım Senaryoları

### Ana Sayfa
```tsx
// Grup oluştur butonu
<GeliomButton 
  state="active" 
  size="large"
  layout="full-width"
  icon="add-circle"
>
  🌱 Yeni Grup Oluştur
</GeliomButton>
```

### Profil Sayfası
```tsx
// Profil düzenle
<GeliomButton 
  state="passive" 
  layout="icon-left"
  icon="create"
>
  ✏️ Profili Düzenle
</GeliomButton>
```

### Chat Interface
```tsx
// Mesaj gönder
<GeliomButton 
  state="active" 
  size="small"
  layout="icon-only"
  icon="send"
/>
```

Bu button sistemi, Geliom'un doğa temalı kimliğini güçlendirirken, kullanıcıya tutarlı ve anlamlı bir etkileşim deneyimi sunar. 🌿✨
