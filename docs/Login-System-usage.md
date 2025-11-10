# Geliom - Login Sistemi Kullanım Kılavuzu

Geliom uygulamasının doğa temalı, blur efektli login sistemi ve Supabase OAuth entegrasyonu.

## 🎨 Tasarım Özellikleri

### Doğa Temalı Görsel Tasarım
- **Gradient Background**: Yeşil tonlarda doğal geçişler
- **Blur Effects**: Modern glassmorphism tasarımı
- **Decorative Elements**: Doğal hissiyat için dekoratif daireler
- **Full Screen**: Tam ekran deneyimi
- **Responsive**: Tüm ekran boyutlarına uyumlu

### Renk Paleti
- **Primary**: `#2E7D32` (Orman yeşili)
- **Secondary**: `#4CAF50` (Çimen yeşili)  
- **Tertiary**: `#81C784` (Açık yeşil)
- **Overlay**: Şeffaf yeşil tonlar
- **Blur Background**: Dinamik blur efektleri

## 🔐 Authentication Sistemi

### Desteklenen Platformlar
- **Google OAuth**: Tüm platformlarda
- **Apple Sign In**: Sadece iOS'ta görünür
- **Supabase Backend**: Güvenli auth yönetimi

### OAuth Flow
1. Kullanıcı login butonuna tıklar
2. Supabase OAuth provider'ına yönlendirilir
3. Kullanıcı kimlik doğrulaması yapar
4. `geliom://auth/callback` URL'sine geri döner
5. Callback handler session'ı kontrol eder
6. Başarılı ise ana sayfaya yönlendirir

## 📱 Kullanım

### Login Sayfası Özellikleri
```tsx
// Temel kullanım
<BaseLayout fullScreen={true} headerShow={true}>
  <LinearGradient colors={[primary, secondary, tertiary]}>
    <BlurView intensity={20}>
      {/* Login içeriği */}
    </BlurView>
  </LinearGradient>
</BaseLayout>
```

### Login Butonları
```tsx
// Google Login
<TouchableOpacity onPress={handleGoogleLogin}>
  <Ionicons name="logo-google" />
  <Typography variant="button">Google ile Giriş Yap</Typography>
</TouchableOpacity>

// Apple Login (iOS only)
{Platform.OS === 'ios' && (
  <TouchableOpacity onPress={handleAppleLogin}>
    <Ionicons name="logo-apple" />
    <Typography variant="button">Apple ile Giriş Yap</Typography>
  </TouchableOpacity>
)}
```

## ⚙️ Konfigürasyon

### app.json OAuth Ayarları
```json
{
  "ios": {
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLName": "geliom-auth",
          "CFBundleURLSchemes": ["geliom"]
        }
      ]
    }
  },
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "geliom" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### Supabase Konfigürasyonu
```typescript
// api/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Environment Variables
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 OAuth Handler Fonksiyonları

### Google Login
```typescript
const handleGoogleLogin = async () => {
  try {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'geliom://auth/callback',
      },
    });

    if (error) {
      Alert.alert('Hata', 'Google ile giriş yapılamadı: ' + error.message);
      return;
    }

    if (data) {
      router.replace('/');
    }
  } catch (error) {
    Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
  } finally {
    setIsLoading(false);
  }
};
```

### Apple Login
```typescript
const handleAppleLogin = async () => {
  try {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'geliom://auth/callback',
      },
    });

    if (error) {
      Alert.alert('Hata', 'Apple ile giriş yapılamadı: ' + error.message);
      return;
    }

    if (data) {
      router.replace('/');
    }
  } catch (error) {
    Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
  } finally {
    setIsLoading(false);
  }
};
```

## 📄 Callback Handler

### Auth Callback Sayfası
```typescript
// app/(auth)/callback.tsx
export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          router.replace('/(auth)/login');
          return;
        }

        if (data.session) {
          router.replace('/');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        router.replace('/(auth)/login');
      }
    };

    handleAuthCallback();
  }, []);
}
```

## 🎯 Geliom Özel Özellikler

### Doğa Temalı Mesajlar
- **Hoş Geldin**: "Hoş Geldin! 👋"
- **Tagline**: "🌿 Doğal bağlantılar kur"
- **Açıklama**: "Arkadaşlarınla ve ailenle bağlantı kurmak için giriş yap"
- **Loading**: "Giriş işlemi tamamlanıyor... 🌿"

### Blur Efektleri
```typescript
<BlurView 
  intensity={20} 
  tint={isDark ? 'dark' : 'light'} 
  style={styles.loginContainer}
>
  {/* Login içeriği */}
</BlurView>
```

### Dekoratif Elementler
```typescript
// Doğal hissiyat için daireler
<View style={[styles.decorativeCircle, styles.circle1]} />
<View style={[styles.decorativeCircle, styles.circle2]} />
<View style={[styles.decorativeCircle, styles.circle3]} />
```

## 🔒 Güvenlik

### Best Practices
1. **Environment Variables**: Hassas bilgileri .env dosyasında saklayın
2. **HTTPS**: Sadece güvenli bağlantılar kullanın
3. **Session Management**: Otomatik token yenileme aktif
4. **Error Handling**: Kullanıcı dostu hata mesajları
5. **Deep Linking**: Güvenli callback URL'leri

### Hata Yönetimi
```typescript
if (error) {
  Alert.alert('Hata', 'Giriş yapılamadı: ' + error.message);
  return;
}
```

## 📱 Platform Desteği

### iOS
- Apple Sign In entegrasyonu
- CFBundleURLTypes konfigürasyonu
- Native blur effects

### Android
- Intent filters konfigürasyonu
- Google OAuth entegrasyonu
- Material Design uyumlu

### Web
- OAuth popup flow
- Responsive tasarım
- Cross-browser uyumluluk

Bu login sistemi Geliom'un doğal, samimi ve güvenli hissiyatını desteklemek için özel olarak tasarlanmıştır. 🌿✨
