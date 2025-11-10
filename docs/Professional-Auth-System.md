# Geliom - Profesyonel Authentication Sistemi

Expo'nun resmi authentication paketleri ve Supabase entegrasyonu ile oluşturulmuş kaliteli auth sistemi.

## 🏗️ Mimari Yapı

### Kullanılan Paketler
- **expo-apple-authentication**: iOS için resmi Apple Sign In
- **expo-auth-session**: OAuth flow yönetimi
- **expo-crypto**: Güvenli kriptografik işlemler
- **@supabase/supabase-js**: Backend auth yönetimi

### Sistem Bileşenleri
```
AuthProvider (Context)
├── Session Management
├── User Profile Management
├── Auto Profile Creation
└── Auth State Listeners

Login Page
├── Google OAuth (Supabase)
├── Apple Sign In (Native)
├── Blur Effects
└── Error Handling

Auth Flow
├── OAuth Redirect Handling
├── Session Persistence
└── Auto Navigation
```

## 🔐 Authentication Flow

### Google Login Flow
1. Kullanıcı "Google ile Giriş Yap" butonuna tıklar
2. Supabase OAuth provider'ına yönlendirilir
3. Google auth sayfası açılır
4. Kullanıcı kimlik doğrulaması yapar
5. Supabase session oluşturur
6. AuthContext listener session'ı yakalar
7. User profili otomatik oluşturulur/güncellenir
8. Ana sayfaya yönlendirilir

### Apple Login Flow
1. Kullanıcı Apple Sign In butonuna tıklar
2. iOS native Apple auth dialog açılır
3. Kullanıcı Face ID/Touch ID ile doğrular
4. Apple identity token alınır
5. Supabase'e token gönderilir
6. Session oluşturulur ve flow devam eder

## 📱 Kullanım

### Login Sayfası
```tsx
// Profesyonel Google Login
<TouchableOpacity onPress={handleGoogleLogin}>
  <Ionicons name="logo-google" size={24} color="#4285F4" />
  <Typography variant="button">Google ile Giriş Yap</Typography>
</TouchableOpacity>

// Native Apple Login (iOS only)
<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={isDark ? 
    AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : 
    AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
  }
  cornerRadius={16}
  onPress={handleAppleLogin}
/>
```

### Auth Context Kullanımı
```tsx
const { session, user, isLoading, signOut } = useAuth();

// Giriş durumu kontrolü
if (isLoading) return <LoadingScreen />;
if (!session) return <LoginScreen />;

// Kullanıcı bilgileri
console.log(user.email, user.display_name);

// Çıkış yapma
await signOut();
```

## 🛠️ Konfigürasyon

### Environment Variables
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Auth Settings
```sql
-- Users tablosu (otomatik oluşturulur)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### OAuth Providers (Supabase Dashboard)
```
Google OAuth:
- Client ID: your_google_client_id
- Client Secret: your_google_client_secret
- Redirect URL: your_app_scheme://auth/callback

Apple OAuth:
- Service ID: your_apple_service_id
- Team ID: your_apple_team_id
- Key ID: your_apple_key_id
- Private Key: your_apple_private_key
```

## 🎨 UI/UX Özellikleri

### Doğa Temalı Tasarım
```tsx
// Gradient background
<LinearGradient colors={[primary, secondary, tertiary]}>
  {/* Decorative circles */}
  <View style={styles.decorativeCircle} />
</LinearGradient>

// Blur login container
<BlurView intensity={20} tint={isDark ? 'dark' : 'light'}>
  {/* Login content */}
</BlurView>
```

### Responsive Design
- Full screen experience
- Safe area handling
- Platform-specific components
- Theme-aware styling

## 🔒 Güvenlik Özellikleri

### Session Management
- Automatic token refresh
- Secure storage (AsyncStorage)
- Session persistence
- Logout functionality

### Error Handling
```tsx
try {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) {
    Alert.alert('Hata', error.message);
    return;
  }
} catch (error) {
  Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
  console.error('Auth error:', error);
}
```

### User Cancellation Handling
```tsx
// Apple login cancellation
if (error.code === 'ERR_REQUEST_CANCELED') {
  // Kullanıcı iptal etti, hata gösterme
  return;
}
```

## 📊 State Management

### AuthContext Structure
```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Auto Profile Creation
```typescript
// Yeni kullanıcı için otomatik profil oluşturma
if (error && error.code === 'PGRST116') {
  const { data: newUser } = await supabase
    .from('users')
    .insert([{
      id: session.user.id,
      email: session.user.email,
      display_name: session.user.user_metadata?.full_name || 
                   session.user.email?.split('@')[0],
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();
}
```

## 🚀 Performance Optimizations

### Lazy Loading
- Auth state sadece gerektiğinde yüklenir
- User profile async olarak fetch edilir
- Error boundaries ile crash prevention

### Memory Management
- Auth listeners otomatik cleanup
- Session state optimized updates
- Minimal re-renders

## 🧪 Testing & Debugging

### Debug Logs
```typescript
console.log('Auth state changed:', event, session?.user?.email);
```

### Error Monitoring
- Comprehensive error logging
- User-friendly error messages
- Fallback mechanisms

## 📱 Platform Support

### iOS
- Native Apple Sign In button
- Face ID/Touch ID integration
- iOS-specific styling

### Android
- Google OAuth integration
- Material Design compliance
- Android-specific handling

### Web
- OAuth popup flow
- Responsive design
- Cross-browser compatibility

## 🎯 Best Practices

1. **Security First**: Hassas bilgileri environment variables'da saklayın
2. **User Experience**: Loading states ve error handling
3. **Performance**: Minimal re-renders ve efficient state management
4. **Accessibility**: Screen reader uyumluluğu
5. **Testing**: Comprehensive error scenarios

Bu profesyonel auth sistemi Geliom'un güvenlik ve kullanıcı deneyimi standartlarını karşılamak için özel olarak tasarlanmıştır. 🌿🔐
