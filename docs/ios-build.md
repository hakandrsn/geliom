# iOS geliştirme ortamı

Expo SDK 57, Xcode 26.4 veya üstünü gerektirir:
https://docs.expo.dev/versions/latest/#support-for-android-and-ios-versions

`RuntimeScheduler.h` içindeki `SWIFT_RETURNS_RETAINED` hatası Xcode 26.3 ile
görülebilir. Önce desteklenen derleyiciyi seçin; `node_modules` başlıklarını
değiştirmek veya eski Expo alt paketlerini zorlamak kalıcı çözüm değildir.

Xcode'u açıp lisans ve ilk kurulum adımlarını tamamlayın. Kurulumunuz
`/Applications/Xcode.app` konumundaysa terminalin seçimini güncelleyin:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version
xcrun --find clang++
```

`DEVELOPER_DIR` ortam değişkeni tanımlıysa `xcode-select` seçimini geçersiz kılar.
`yarn ios` ve `yarn dios` derleme öncesinde sürümü ve lisans erişimini kontrol eder.
Doğrudan `npx expo run:ios` kullanımı bu ön kontrolü atlar.

Xcode 27 için gereken UIKit scene desteği `app.json` içindeki
`expo-build-properties.ios.enableSceneSupport` ile üretilir:
https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md

OneSignal extension hedefi aynı dosyadaki `iPhoneDeploymentTarget` ile uygulamanın
minimum iOS sürümü olan 16.4'e eşitlenmiştir. Native klasörler üretilir ve Git'e
alınmaz; kalıcı ayarları Xcode projesinden değil Expo config üzerinden değiştirin.

Toolchain kurulumu tamamlandıktan sonra, `mobile` dizininde:

```sh
npx expo prebuild --platform ios
yarn ios
```

Sentry ve RNFB scriptlerinin dependency-analysis uyarıları derlemeyi durdurmaz.
Bu scriptler çıktı bağımlılıklarını tam tanımlamadığı için her derlemede çalışır;
uyarıları gidermek için scriptleri devre dışı bırakmayın.
