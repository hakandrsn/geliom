# Geliom - Mock Development Setup

Geliom uygulamasının mock data ile development ortamında çalışması için yapılandırma.

## 🎯 Amaç

Login sistemini geçerek direkt uygulama geliştirmesine odaklanmak için mock user data kullanımı.

## 📊 Mock Data Yapısı

### GeliomUser Interface
```typescript
interface GeliomUser {
  id: string;                    // Unique user ID
  email: string;                 // User email
  display_name: string;          // Display name
  custom_user_id: string;        // Custom username (@handle)
  show_mood: boolean;            // Mood visibility setting
  current_mood_id?: string;      // Current mood ID
  onesignal_player_id?: string;  // Push notification ID
  created_at: string;            // Creation timestamp
  updated_at: string;            // Last update timestamp
}
```

### Mock User Data
```typescript
export const MOCK_USER: GeliomUser = {
  id: 'mock-user-123',
  email: 'hakan@geliom.app',
  display_name: 'Hakan Dursun',
  custom_user_id: 'hakan_dev',
  show_mood: true,
  current_mood_id: '1', // Mutlu
  onesignal_player_id: undefined,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: new Date().toISOString(),
};
```

### Mock Moods
```typescript
export const MOCK_MOODS: UserMood[] = [
  { id: '1', name: 'Mutlu', emoji: '😊', color: '#4CAF50' },
  { id: '2', name: 'Heyecanlı', emoji: '🤩', color: '#FF9800' },
  { id: '3', name: 'Sakin', emoji: '😌', color: '#2196F3' },
  { id: '4', name: 'Yorgun', emoji: '😴', color: '#9E9E9E' },
  { id: '5', name: 'Enerjik', emoji: '⚡', color: '#FFEB3B' },
];
```

### Mock Statuses
```typescript
export const MOCK_STATUSES = [
  { id: '1', name: 'Müsaitim', emoji: '✅', color: '#4CAF50', notifies: true },
  { id: '2', name: 'Meşgulüm', emoji: '🔴', color: '#F44336', notifies: true },
  { id: '3', name: 'Dışarıdayım', emoji: '🚶', color: '#2196F3', notifies: false },
  { id: '4', name: 'Evdeyim', emoji: '🏠', color: '#795548', notifies: false },
  { id: '5', name: 'Çalışıyorum', emoji: '💻', color: '#607D8B', notifies: true },
];
```

## 🔧 Sistem Konfigürasyonu

### AuthContext Mock Implementation
```typescript
// Mock session ve user data'yı set et
const initializeAuth = async () => {
  setIsLoading(true);
  
  // Simüle edilmiş loading süresi
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  setSession(MOCK_SESSION as any);
  setUser(MOCK_USER);
  
  setIsLoading(false);
};

// Mock sign out
const signOut = async () => {
  setSession(null);
  setUser(null);
};
```

### Routing Bypass
```typescript
// _layout.tsx - Login routing'i bypass et
useEffect(() => {
  if (isLoading) return;
  
  // Mock için login bypass - direkt ana sayfada kal
  console.log('Layout routing bypassed for mock data');
  
  // Gerçek auth kodu comment'te bekliyor
}, [session, isLoading, segments]);
```

## 📱 UI Gösterimi

### Ana Sayfa Mock Data Display
```typescript
// User bilgileri
<Typography variant="body">
  {user?.display_name || 'Misafir Kullanıcı'}
</Typography>

<Typography variant="caption">
  @{user?.custom_user_id || 'kullanici'}
</Typography>

// User mood gösterimi
{currentMood && user?.show_mood && (
  <View style={moodContainerStyle}>
    <Typography>{currentMood.emoji}</Typography>
    <Typography>{currentMood.name}</Typography>
  </View>
)}
```

### Session Status
```typescript
// Mock session her zaman aktif
<Typography variant="status">
  {session ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}
</Typography>
```

## 🚀 Development Workflow

### 1. Mock Mode Aktif
- Uygulama açılınca direkt ana sayfa
- Login ekranı bypass edilir
- Mock user data otomatik yüklenir

### 2. User Data Görüntüleme
- Display name: "Hakan Dursun"
- Username: "@hakan_dev"
- Email: "hakan@geliom.app"
- Mood: "😊 Mutlu" (show_mood: true)
- Status: "🟢 Çevrimiçi"

### 3. Fonksiyonellik
- Sign out mock olarak çalışır
- Auth state değişiklikleri simüle edilir
- Loading states normal çalışır

## 🔄 Production'a Geçiş

### Gerçek Auth Sistemi Aktifleştirme
1. **AuthContext.tsx**: Mock kod yerine Supabase auth kodunu aktifleştir
2. **_layout.tsx**: Routing comment'lerini aç
3. **types/user.ts**: Mock data'yı kaldır veya development flag ile kontrol et

### Geçiş Adımları
```typescript
// 1. Environment variable ile kontrol
const IS_MOCK_MODE = process.env.EXPO_PUBLIC_MOCK_AUTH === 'true';

// 2. Conditional auth implementation
const initializeAuth = async () => {
  if (IS_MOCK_MODE) {
    // Mock implementation
  } else {
    // Real Supabase implementation
  }
};

// 3. Routing conditional
if (!IS_MOCK_MODE && !session && !inAuthGroup) {
  router.replace('/(auth)/login');
}
```

## 📋 Avantajlar

### Development Speed
- Login süreci bypass edilir
- Direkt feature development
- Hızlı test döngüsü

### Data Consistency
- Tutarlı test data
- Predictable user state
- Reliable development environment

### Team Collaboration
- Herkes aynı mock data kullanır
- Backend bağımsız development
- Parallel development mümkün

## 🎨 UI/UX Testing

### Mock Data ile Test Senaryoları
- User profile görüntüleme
- Mood değişiklikleri
- Status updates
- Navigation flows
- Theme switching

Bu mock setup Geliom'un hızlı development sürecini desteklemek için optimize edilmiştir. 🌿⚡
