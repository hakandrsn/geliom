# Geliom API Documentation

Bu klasör, Supabase tabanlı React Query API'lerini içerir. Tüm CRUD işlemleri ve realtime özellikler burada tanımlanmıştır.

## 📁 Dosya Yapısı

```
api/
├── index.ts           # Ana export dosyası - tüm API'leri buradan import edin
├── supabase.ts        # Supabase client konfigürasyonu
├── users.ts           # Kullanıcı işlemleri
├── moods.ts           # Mood işlemleri
├── groups.ts          # Grup ve grup üyelik işlemleri
├── nicknames.ts       # Takma ad işlemleri
├── statuses.ts        # Durum ve kullanıcı durumu işlemleri
├── notifications.ts   # Bildirim susturma işlemleri
├── subscriptions.ts   # Abonelik işlemleri
└── events.ts          # Zamanlanmış etkinlik işlemleri
```

## 🚀 Kullanım

### Temel Import

```typescript
import { 
  useUsers, 
  useCreateUser, 
  useUsersRealtime,
  apiUtils 
} from '../api';
```

### Örnek Kullanımlar

#### 1. Kullanıcıları Listele
```typescript
function UsersList() {
  const { data: users, isLoading, error } = useUsers();
  
  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error.message}</div>;
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>
          {user.display_name} - {user.mood?.emoji}
        </div>
      ))}
    </div>
  );
}
```

#### 2. Grup Oluştur
```typescript
function CreateGroup() {
  const createGroup = useCreateGroup();
  const { mutate, isPending } = createGroup;
  
  const handleSubmit = async (formData: CreateGroup) => {
    mutate({
      ...formData,
      invite_code: apiUtils.generateInviteCode(),
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form alanları */}
    </form>
  );
}
```

#### 3. Realtime Dinleme
```typescript
function GroupChat({ groupId }: { groupId: string }) {
  // Grup üyelerini realtime dinle
  useGroupMembersRealtime(groupId);
  
  const { data: members } = useGroupMembers(groupId);
  
  return (
    <div>
      {members?.map(member => (
        <div key={member.user_id}>
          {member.user?.display_name}
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Güvenlik Kuralları

### Kullanıcı Yetkilendirme
- Kullanıcılar sadece kendi verilerine erişebilir
- Grup işlemleri için grup üyeliği kontrol edilir
- Supabase RLS (Row Level Security) politikaları ile korunur

### Örnek Güvenlik Kontrolleri
```typescript
// Grup üyeliği kontrol et
const isMember = await apiUtils.checkGroupMembership(groupId, userId);
if (!isMember) {
  throw new Error('Bu gruba erişim yetkiniz yok');
}

// Grup sahipliği kontrol et
const isOwner = await apiUtils.checkGroupOwnership(groupId, userId);
if (!isOwner) {
  throw new Error('Bu işlem için grup sahibi olmalısınız');
}
```

## 📊 Tablo İlişkileri

### Users (Kullanıcılar)
- `mood_id` → `moods.id`
- Grup üyelikleri: `group_members` tablosu üzerinden

### Groups (Gruplar)
- `owner_id` → `users.id`
- Üyeler: `group_members` tablosu üzerinden

### Nicknames (Takma Adlar)
- `group_id` → `groups.id`
- `setter_user_id` → `users.id`
- `target_user_id` → `users.id`

### User Statuses (Kullanıcı Durumları)
- `user_id` → `users.id`
- `status_id` → `statuses.id`

### Scheduled Events (Etkinlikler)
- `group_id` → `groups.id`
- `creator_id` → `users.id`

## 🔄 Realtime Özellikler

Her tablo için realtime subscription hook'ları mevcuttur:

- `useUsersRealtime()` - Tüm kullanıcı değişiklikleri
- `useGroupsRealtime()` - Tüm grup değişiklikleri
- `useGroupMembersRealtime(groupId)` - Belirli grup üyelik değişiklikleri
- `useNicknamesRealtime(groupId?)` - Takma ad değişiklikleri
- `useStatusesRealtime()` - Durum değişiklikleri
- `useUserStatusesRealtime()` - Kullanıcı durumu değişiklikleri
- `useMutedNotificationsRealtime(userId?)` - Bildirim susturma değişiklikleri
- `useSubscriptionRealtime(userId)` - Abonelik değişiklikleri
- `useGroupEventsRealtime(groupId)` - Grup etkinlik değişiklikleri

## 🛠 Utility Fonksiyonlar

`apiUtils` objesi yararlı yardımcı fonksiyonlar içerir:

```typescript
// Mevcut kullanıcı ID'sini al
const userId = await apiUtils.getCurrentUserId();

// Grup üyeliği kontrol et
const isMember = await apiUtils.checkGroupMembership(groupId, userId);

// Grup sahipliği kontrol et
const isOwner = await apiUtils.checkGroupOwnership(groupId, userId);

// Davet kodu oluştur
const inviteCode = apiUtils.generateInviteCode();

// Tarih formatla
const formattedDate = apiUtils.formatEventDate(event.event_time);

// Abonelik durumu kontrol et
const isActive = apiUtils.isSubscriptionActive(subscription);
```

## 📝 TypeScript Tipleri

Tüm tipler `types/database.ts` dosyasında tanımlanmıştır:

- `User`, `CreateUser`, `UpdateUser`
- `Group`, `CreateGroup`, `UpdateGroup`
- `Mood`, `CreateMood`, `UpdateMood`
- `Status`, `CreateStatus`, `UpdateStatus`
- `ScheduledEvent`, `CreateScheduledEvent`, `UpdateScheduledEvent`
- Ve daha fazlası...

## 🔧 Hata Yönetimi

React Query otomatik hata yönetimi sağlar:

```typescript
const { data, error, isLoading, isError } = useUsers();

if (isError) {
  console.error('Kullanıcılar yüklenirken hata:', error);
}
```

## 🚨 Önemli Notlar

1. **RLS Politikaları**: Supabase'de Row Level Security politikalarını mutlaka ayarlayın
2. **Auth Kontrolleri**: Her işlem öncesi kullanıcı kimlik doğrulaması yapın
3. **Realtime Subscriptions**: Gereksiz subscription'ları kapatmayı unutmayın
4. **Error Boundaries**: React Error Boundary kullanarak hata yakalama yapın
5. **Loading States**: Kullanıcı deneyimi için loading durumlarını gösterin
