# BaseLayout Kullanım Kılavuzu

BaseLayout component'i, tüm sayfalarda kullanabileceğiniz esnek ve performanslı bir layout sistemidir.

## Temel Kullanım

```tsx
import { BaseLayout } from '@/components/shared';

export default function MyPage() {
  return (
    <BaseLayout>
      <Text>İçerik buraya gelir</Text>
    </BaseLayout>
  );
}
```

## Özellikler

### 1. Header Gösterimi
```tsx
// Header'ı gizle
<BaseLayout headerShow={false}>
  <Text>Header yok</Text>
</BaseLayout>

// Header'ı göster (default: true)
<BaseLayout headerShow={true}>
  <Text>Header var</Text>
</BaseLayout>
```

### 2. Full Screen Modu
```tsx
// Tam ekran - Safe area yok
<BaseLayout fullScreen={true}>
  <Text>Tam ekran içerik</Text>
</BaseLayout>

// Normal mod - Safe area var (default)
<BaseLayout fullScreen={false}>
  <Text>Safe area ile içerik</Text>
</BaseLayout>
```

### 3. Header Konfigürasyonu

#### Sol Icon + Title + Sağ Icon
```tsx
<BaseLayout
  header={{
    leftIcon: {
      icon: <Ionicons name="menu" size={24} color={colors.text} />,
      onPress: () => console.log('Menu'),
    },
    title: <Text style={{ color: colors.text }}>Sayfa Başlığı</Text>,
    rightIcon: {
      icon: <Ionicons name="settings" size={24} color={colors.text} />,
      onPress: () => console.log('Settings'),
    },
  }}
>
  <Text>İçerik</Text>
</BaseLayout>
```

#### Sadece Title
```tsx
<BaseLayout
  header={{
    title: <Text style={{ color: colors.text }}>Sadece Başlık</Text>,
  }}
>
  <Text>İçerik</Text>
</BaseLayout>
```

#### Sadece Sol Icon
```tsx
<BaseLayout
  header={{
    leftIcon: {
      icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
      onPress: () => router.back(),
    },
  }}
>
  <Text>İçerik</Text>
</BaseLayout>
```

### 4. Background Image
```tsx
<BaseLayout
  backgroundImage={require('@/assets/images/background.jpg')}
>
  <Text>Background image ile</Text>
</BaseLayout>
```

### 5. Custom Background Color
```tsx
<BaseLayout
  backgroundColor="#FF0000"
>
  <Text>Kırmızı arkaplan</Text>
</BaseLayout>
```

### 6. Custom Styles
```tsx
<BaseLayout
  style={{ padding: 20 }}
  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
>
  <Text>Custom style'lar</Text>
</BaseLayout>
```

### 7. Header Customization
```tsx
<BaseLayout
  header={{
    leftIcon: {
      icon: <Ionicons name="menu" size={24} color={colors.text} />,
      onPress: openMenu,
    },
    title: <Text>Başlık</Text>,
    backgroundColor: colors.primary,
    height: 60,
    style: { borderBottomWidth: 1, borderBottomColor: colors.stroke },
  }}
>
  <Text>İçerik</Text>
</BaseLayout>
```

## Kompleks Örnek

```tsx
import { BaseLayout } from '@/components/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfilePage() {
  const { colors, toggleTheme, isDark } = useTheme();

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: (
          <Text style={{ 
            color: colors.text, 
            fontSize: 18, 
            fontWeight: 'bold' 
          }}>
            Profil
          </Text>
        ),
        rightIcon: {
          icon: <Ionicons name={isDark ? "sunny" : "moon"} size={24} color={colors.text} />,
          onPress: toggleTheme,
        },
        backgroundColor: colors.background,
      }}
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text }}>Profil içeriği...</Text>
      </ScrollView>
    </BaseLayout>
  );
}
```

## Performans Notları

- Component memoized değil, gerekirse `React.memo` ile sarmalayın
- Header icon'ları TouchableOpacity ile optimize edilmiş
- Status bar otomatik tema rengine göre ayarlanır
- Safe area insets otomatik hesaplanır
- Background image lazy load değil, gerekirse optimize edin

## Props Referansı

| Prop | Tip | Default | Açıklama |
|------|-----|---------|----------|
| `children` | ReactNode | - | Sayfa içeriği |
| `fullScreen` | boolean | false | Tam ekran modu |
| `headerShow` | boolean | true | Header gösterimi |
| `header` | HeaderProps | - | Header konfigürasyonu |
| `backgroundImage` | any | - | Arkaplan resmi |
| `backgroundColor` | string | theme.colors.background | Arkaplan rengi |
| `style` | ViewStyle | - | Container style |
| `contentStyle` | ViewStyle | - | İçerik style |

### HeaderProps

| Prop | Tip | Default | Açıklama |
|------|-----|---------|----------|
| `leftIcon` | HeaderIconProps | - | Sol icon |
| `rightIcon` | HeaderIconProps | - | Sağ icon |
| `title` | ReactNode | - | Başlık |
| `backgroundColor` | string | theme.colors.background | Header arkaplan |
| `height` | number | 56 | Header yüksekliği |
| `style` | ViewStyle | - | Header style |

### HeaderIconProps

| Prop | Tip | Default | Açıklama |
|------|-----|---------|----------|
| `icon` | ReactNode | - | Icon component |
| `onPress` | () => void | - | Tıklama fonksiyonu |
