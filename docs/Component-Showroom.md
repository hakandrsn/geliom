# Geliom - Component Showroom

Geliom uygulamasının component'lerinin sergilendiği ve test edildiği alan.

## 🎨 Showroom Yapısı

### Erişim
- Ana sayfadan "🎨 Component Showroom" butonuna tıklayarak erişilebilir
- Route: `/(app)/showroom`
- Header ile navigation ve theme toggle

### Amaç
- Component'leri görsel olarak test etmek
- Farklı variant'ları karşılaştırmak
- Development sürecinde hızlı prototype
- Design system dokümantasyonu

## 🔘 BlurButton Component

### 12 Farklı Variant

#### 1. Primary - Gradient Yeşil
```tsx
<BlurButton variant="primary">1. Primary</BlurButton>
```
- **Görünüm**: Yeşil gradient (primary → secondary)
- **Kullanım**: Ana CTA butonları
- **Özellik**: LinearGradient ile blur efekti

#### 2. Secondary - Düz Yeşil
```tsx
<BlurButton variant="secondary">2. Secondary</BlurButton>
```
- **Görünüm**: Düz secondary yeşil
- **Kullanım**: İkincil aksiyonlar
- **Özellik**: Solid background

#### 3. Tertiary - Açık Yeşil
```tsx
<BlurButton variant="tertiary">3. Tertiary</BlurButton>
```
- **Görünüm**: Açık yeşil ton
- **Kullanım**: Üçüncül aksiyonlar
- **Özellik**: Soft appearance

#### 4. Success - Başarı Yeşili
```tsx
<BlurButton variant="success">4. Success</BlurButton>
```
- **Görünüm**: Başarı yeşili
- **Kullanım**: Onay, başarı mesajları
- **Özellik**: Positive feedback

#### 5. Glass - Cam Efekti
```tsx
<BlurButton variant="glass">5. Glass</BlurButton>
```
- **Görünüm**: Şeffaf cam efekti
- **Kullanım**: Overlay butonları
- **Özellik**: BlurView ile glassmorphism

#### 6. Outline - Çerçeveli
```tsx
<BlurButton variant="outline">6. Outline</BlurButton>
```
- **Görünüm**: Şeffaf arkaplan, yeşil çerçeve
- **Kullanım**: İkincil aksiyonlar
- **Özellik**: Minimal appearance

#### 7. Ghost - Hayalet
```tsx
<BlurButton variant="ghost">7. Ghost</BlurButton>
```
- **Görünüm**: Şeffaf yeşil arkaplan
- **Kullanım**: Subtle aksiyonlar
- **Özellik**: %20 opacity background

#### 8. Danger - Hata/Silme
```tsx
<BlurButton variant="danger">8. Danger</BlurButton>
```
- **Görünüm**: Kırmızı arkaplan
- **Kullanım**: Silme, iptal aksiyonları
- **Özellik**: Warning appearance

#### 9. Forest - Orman Yeşili
```tsx
<BlurButton variant="forest">9. Forest</BlurButton>
```
- **Görünüm**: Koyu orman yeşili (#1B5E20)
- **Kullanım**: Doğa temalı aksiyonlar
- **Özellik**: Deep green tone

#### 10. Mint - Nane Yeşili
```tsx
<BlurButton variant="mint">10. Mint</BlurButton>
```
- **Görünüm**: Parlak nane yeşili (#00E676)
- **Kullanım**: Fresh, energetic aksiyonlar
- **Özellik**: Bright vibrant green

#### 11. Lime - Limon Yeşili
```tsx
<BlurButton variant="lime">11. Lime</BlurButton>
```
- **Görünüm**: Limon yeşili (#8BC34A)
- **Kullanım**: Playful, friendly aksiyonlar
- **Özellik**: Light green tone

#### 12. Emerald - Zümrüt Yeşili
```tsx
<BlurButton variant="emerald">12. Emerald</BlurButton>
```
- **Görünüm**: Zümrüt yeşili (#009688)
- **Kullanım**: Premium, elegant aksiyonlar
- **Özellik**: Sophisticated green

### 3 Farklı Boyut

#### Small - Küçük
```tsx
<BlurButton size="small">Small</BlurButton>
```
- **Boyut**: 36px min height
- **Padding**: 16px horizontal, 8px vertical
- **Font**: Caption size

#### Medium - Orta (Default)
```tsx
<BlurButton size="medium">Medium</BlurButton>
```
- **Boyut**: 44px min height
- **Padding**: 20px horizontal, 12px vertical
- **Font**: Button size

#### Large - Büyük
```tsx
<BlurButton size="large">Large</BlurButton>
```
- **Boyut**: 52px min height
- **Padding**: 24px horizontal, 16px vertical
- **Font**: H6 size

### 5 Farklı Radius

#### None - Köşesiz
```tsx
<BlurButton radius="none">Radius: None</BlurButton>
```
- **Radius**: 0px
- **Görünüm**: Keskin köşeler
- **Kullanım**: Modern, geometric tasarım

#### Small - Küçük
```tsx
<BlurButton radius="small">Radius: Small</BlurButton>
```
- **Radius**: 6px
- **Görünüm**: Hafif yuvarlaklık
- **Kullanım**: Subtle rounded corners

#### Medium - Orta (Default)
```tsx
<BlurButton radius="medium">Radius: Medium</BlurButton>
```
- **Radius**: 12px
- **Görünüm**: Standart yuvarlaklık
- **Kullanım**: Balanced appearance

#### Large - Büyük
```tsx
<BlurButton radius="large">Radius: Large</BlurButton>
```
- **Radius**: 20px
- **Görünüm**: Belirgin yuvarlaklık
- **Kullanım**: Soft, friendly appearance

#### Full - Tam Yuvarlak
```tsx
<BlurButton radius="full">Radius: Full</BlurButton>
```
- **Radius**: 9999px (pill shape)
- **Görünüm**: Tam yuvarlak kenarlar
- **Kullanım**: Pill buttons, tags

### Icon Desteği

#### Sol Icon
```tsx
<BlurButton 
  variant="primary" 
  icon={<Ionicons name="heart" size={20} color="white" />}
  iconPosition="left"
>
  Beğen
</BlurButton>
```

#### Sağ Icon
```tsx
<BlurButton 
  variant="secondary" 
  icon={<Ionicons name="share" size={20} color="white" />}
  iconPosition="right"
>
  Paylaş
</BlurButton>
```

### Özel Özellikler

#### Full Width
```tsx
<BlurButton variant="primary" fullWidth>
  Tam Genişlik Button
</BlurButton>
```

#### Disabled State
```tsx
<BlurButton variant="primary" disabled>
  Disabled
</BlurButton>
```

#### Loading State
```tsx
<BlurButton variant="secondary" loading>
  Loading
</BlurButton>
```

## 🎯 Geliom'a Özel Tasarım

### Doğa Temalı Renkler
- Tüm variant'lar yeşil tonlarda
- Doğal gradient geçişleri
- Tema uyumlu renk paleti

### Blur Effects
- Glass variant'ta BlurView kullanımı
- Modern glassmorphism tasarımı
- iOS/Android uyumlu blur

### Typography Integration
- Comfortaa font ailesi
- Responsive font boyutları
- Typography system entegrasyonu

### Shadow & Elevation
- Platform-specific shadow
- Depth hierarchy
- Visual feedback

## 📱 Kullanım Örnekleri

### Ana Sayfa CTA
```tsx
<BlurButton variant="primary" size="large" fullWidth>
  Gruplarım 👥
</BlurButton>
```

### Navigation Button
```tsx
<BlurButton 
  variant="glass" 
  icon={<Ionicons name="settings" size={20} />}
  iconPosition="left"
>
  Ayarlar
</BlurButton>
```

### Action Buttons
```tsx
<BlurButton variant="success" size="small">
  Onayla
</BlurButton>

<BlurButton variant="danger" size="small">
  Sil
</BlurButton>
```

### Karışık Örnekler
```tsx
{/* Orman temalı küçük pill button */}
<BlurButton 
  variant="forest" 
  size="small" 
  radius="full"
  icon={<Ionicons name="leaf" size={16} color="white" />}
>
  Orman
</BlurButton>

{/* Nane temalı büyük köşesiz button */}
<BlurButton 
  variant="mint" 
  size="large" 
  radius="none"
  icon={<Ionicons name="flash" size={20} color="white" />}
  iconPosition="right"
>
  Nane
</BlurButton>

{/* Zümrüt temalı büyük radius button */}
<BlurButton 
  variant="emerald" 
  radius="large"
  icon={<Ionicons name="diamond" size={18} color="white" />}
>
  Zümrüt
</BlurButton>
```

## 🚀 Performance

### Optimizasyonlar
- useCallback ile stable references
- Conditional rendering
- Platform-specific implementations
- Memory efficient blur effects

### Best Practices
- Variant seçimi kullanım amacına göre
- Icon boyutları button size'a uygun
- Loading state'lerde user feedback
- Accessibility considerations

Bu showroom Geliom'un component library'sinin temelini oluşturmaktadır. 🌿🎨
