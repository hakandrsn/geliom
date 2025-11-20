# Prebuild Öncesi Kontrol Listesi

## ✅ Yüklü Olması Gereken Paketler

### 1. OneSignal (Bildirim Sistemi)
- ✅ `react-native-onesignal` - Yüklü (v5.2.14)
- ✅ `onesignal-expo-plugin` - Yüklü (v2.0.3)
- ✅ `app.json`'da plugin konfigürasyonu mevcut

### 2. Native Modüller
- ✅ `@gorhom/bottom-sheet` - Yüklü (v5.2.6)
- ✅ `react-native-adapty` - Yüklü (v3.11.2)
- ✅ `react-native-reanimated` - Yüklü (v4.1.1)
- ✅ `lottie-react-native` - Yüklü (v7.3.4)
- ✅ `react-native-gesture-handler` - Yüklü (v2.28.0)
- ✅ `react-native-screens` - Yüklü (v4.16.0)

### 3. Expo Paketleri
- ✅ `expo` - Yüklü (v54.0.23)
- ✅ `expo-router` - Yüklü (v6.0.14)
- ✅ `expo-build-properties` - Yüklü (v1.0.9)
- ✅ `expo-apple-authentication` - Yüklü (v8.0.7)

## 📋 Prebuild Öncesi Yapılacaklar

### 1. Paket Yükleme Kontrolü
```bash
# Tüm paketlerin yüklü olduğundan emin ol
npm install

# Eksik paket var mı kontrol et
npm list --depth=0
```

### 2. app.json Kontrolü
- ✅ `onesignal-expo-plugin` plugin'i mevcut
- ✅ `oneSignalAppId` extra config'de mevcut
- ✅ iOS entitlements yapılandırılmış (aps-environment: production)
- ✅ Android google-services.json mevcut
- ✅ iOS GoogleService-Info.plist mevcut

### 3. Native Dosya Kontrolü
- ✅ `google-services.json` - Android için mevcut
- ✅ `GoogleService-Info.plist` - iOS için mevcut

### 4. Gelecek İçin Yüklenen Paketler
- ✅ `expo-notifications` - Local notifications için
- ✅ `expo-sharing` - Dosya paylaşımı için

### 4. Prebuild Komutu
```bash
# Prebuild yap (iOS ve Android native klasörlerini oluşturur)
npx expo prebuild

# Veya sadece iOS için
npx expo prebuild --platform ios

# Veya sadece Android için
npx expo prebuild --platform android
```

## ⚠️ Dikkat Edilmesi Gerekenler

1. **OneSignal Plugin**: `app.json`'da `onesignal-expo-plugin` zaten konfigüre edilmiş. Prebuild sırasında otomatik olarak native kod ekleyecek.

2. **iOS Entitlements**: `aps-environment: production` ayarlanmış. Development için `development` olabilir.

3. **Android**: `google-services.json` dosyası mevcut ve doğru konumda olmalı.

4. **iOS**: `GoogleService-Info.plist` dosyası mevcut ve doğru konumda olmalı.

## 🔍 Prebuild Sonrası Kontrol

Prebuild sonrası şunları kontrol edin:

1. **iOS**:
   - `ios/` klasörü oluşturuldu mu?
   - `ios/Podfile` mevcut mu?
   - `pod install` çalıştırılmalı (iOS için)

2. **Android**:
   - `android/` klasörü oluşturuldu mu?
   - `android/app/google-services.json` mevcut mu?

3. **OneSignal**:
   - iOS: `ios/Geliom/Info.plist` içinde OneSignal ayarları var mı?
   - Android: `android/app/build.gradle` içinde OneSignal plugin'i var mı?

## 📝 Notlar

- Prebuild yapıldıktan sonra `ios/` ve `android/` klasörleri oluşur
- Bu klasörler `.gitignore`'da olmamalı (native kodlar)
- Prebuild sonrası `npx expo run:ios` veya `npx expo run:android` ile çalıştırabilirsiniz

