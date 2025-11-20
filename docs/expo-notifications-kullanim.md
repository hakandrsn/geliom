# expo-notifications Kullanımı - Geliom Projesi

## 📱 expo-notifications Ne İşe Yarar?

`expo-notifications` paketi, **local notifications** (cihazda zamanlanmış bildirimler) göndermek için kullanılır.

## 🎯 Projede Kullanım Alanları

### 1. Zamanlanmış Etkinlikler (Faz 4 - Premium Özellik)

**Kullanım Senaryosu:**
- Premium kullanıcı bir grup için etkinlik oluşturur (örn: "Cumartesi Kahvaltısı")
- Etkinlik tarihi: 2025-01-25 10:00
- Bildirim zamanı: 2025-01-25 09:00 (1 saat önce)

**Nasıl Çalışır:**
1. Kullanıcı etkinlik oluşturduğunda `scheduled_events` tablosuna kaydedilir
2. `expo-notifications` ile cihazda **local notification** zamanlanır
3. Bildirim zamanı geldiğinde cihazda bildirim gösterilir
4. Kullanıcı bildirime tıklayınca uygulama açılır ve etkinlik detayına gider

**Örnek Kullanım:**
```typescript
import * as Notifications from 'expo-notifications';

// Etkinlik oluşturulduğunda
const scheduleNotification = async (event: ScheduledEvent) => {
  if (event.notification_time) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Etkinlik Hatırlatıcısı',
        body: `${event.title} için 1 saat kaldı!`,
        data: { eventId: event.id, groupId: event.group_id },
      },
      trigger: {
        date: new Date(event.notification_time),
      },
    });
  }
};
```

## 🔔 OneSignal vs expo-notifications Farkı

### OneSignal (react-native-onesignal)
- **Push Notifications** (sunucudan gönderilen)
- İnternet bağlantısı gerekir
- Kullanıcı uygulamayı kapatsa bile çalışır
- **Kullanım:** Grup katılma istekleri, durum güncellemeleri, direkt mesajlar

### expo-notifications
- **Local Notifications** (cihazda zamanlanan)
- İnternet bağlantısı gerekmez
- Uygulama kapalı olsa bile çalışır (iOS/Android native özellik)
- **Kullanım:** Zamanlanmış etkinlik hatırlatıcıları

## 📋 Kullanım Senaryoları

### Senaryo 1: Etkinlik Hatırlatıcısı
```
Kullanıcı: "Yarın 10:00'da kahvaltı var"
Bildirim: "Yarın 09:00'da" → "Kahvaltı için 1 saat kaldı!"
```

### Senaryo 2: Tekrarlayan Hatırlatıcılar (Gelecekte)
```
Her hafta Pazar günü 18:00'da → "Haftalık toplantı zamanı!"
```

## ⚙️ Teknik Detaylar

### Bildirim İzinleri
- iOS: Kullanıcıdan izin istenir
- Android: Otomatik izin verilir (Android 13+ için izin gerekir)

### Bildirim Zamanlama
- Maksimum 64 bildirim aynı anda zamanlanabilir
- Bildirimler cihaz yeniden başlatıldığında kaybolur (yeniden zamanlanmalı)

### Bildirim Tıklama
- Bildirime tıklandığında uygulama açılır
- `data` objesi ile etkinlik ID'si gönderilir
- Uygulama açıldığında ilgili ekrana yönlendirilir

## 🚀 Gelecek Kullanımlar

1. **Etkinlik Hatırlatıcıları** (Faz 4)
2. **Günlük Hatırlatıcılar** (Gelecekte)
3. **Tekrarlayan Bildirimler** (Gelecekte)

## 📝 Notlar

- `expo-notifications` sadece **local notifications** için
- **Push notifications** için `OneSignal` kullanılacak
- İkisi birlikte kullanılabilir (farklı amaçlar için)

