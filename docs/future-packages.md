# Gelecekte Gerekli Paketler - Prebuild Öncesi Yükleme Listesi

## 📦 Şimdiden Yüklenmesi Gereken Paketler

### 1. Bildirimler (Faz 2+)
- ✅ `expo-notifications` - Local notifications için (zamanlanmış etkinlikler)

### 2. Diğer Yararlı Paketler
- ✅ `expo-sharing` - Dosya paylaşımı için (gelecekte gerekebilir)

## 📝 Notlar

- Profil fotoğrafı yükleme için paketler (expo-image-picker, expo-file-system, expo-media-library) şimdilik yüklenmedi
- İhtiyaç duyulduğunda prebuild sonrası da eklenebilir

## ⚠️ Firebase Paketleri (Şimdilik EKLEMEYİN)

Firebase Analytics ve Crashlytics için native modül gerektirir ve Expo managed workflow'da sorun çıkarabilir. 
Prebuild sonrası gerekirse eklenebilir veya EAS Build kullanılabilir.

## ✅ Zaten Yüklü Olan Paketler

- ✅ `react-native-onesignal` - Bildirimler için
- ✅ `onesignal-expo-plugin` - OneSignal plugin
- ✅ `react-native-adapty` - Abonelik yönetimi için
- ✅ Tüm native modüller (reanimated, gesture-handler, screens, vb.)

