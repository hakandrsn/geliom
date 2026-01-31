# Google Sign-In Kurulumu ve Hata Giderme Rehberi

Eğer uygulamanın çalışması sırasında "Current activity is null" hatası alıyorsanız veya giriş yapılamıyorsa, aşağıdaki adımları takip edin.

## 1. SHA-1 Anahtarını Almak (Keystore Fingerprint)

Google Sign-In'in çalışması için geliştirme ortamınızın (debug keystore) SHA-1 parmak izini Firebase projenize eklemeniz gerekir.

1.  Projeyi terminalde açın.
2.  Android klasörüne gidin:
    ```bash
    cd android
    ```
3.  İmzalama raporunu çalıştırın:

    ```bash
    ./gradlew signingReport
    ```

    _(Windows'ta Powershell kullanıyorsanız `./gradlew` yerine `.\gradlew` gerekebilir veya sadece `gradlew`)_

4.  Çıktıda `Task :app:signingReport` bölümünü bulun. `Variant: debug` altındaki **SHA1** değerini kopyalayın.
    Örnek: `SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:CD:EF`

## 2. Firebase Konsoluna Eklemek

1.  Firebase Konsolu -> Proje Ayarları (Project Settings).
2.  "General" sekmesinde aşağıya inip "Your apps" kısmındaki Android uygulamasını bulun.
3.  "Add fingerprint" butonuna tıklayıp kopyaladığınız SHA1 kodunu yapıştırın.
4.  Kaydedin.

> **Önemli:** Eğer uygulamayı Play Store'a yükleyecekseniz veya release build alacaksanız, aynı şekilde release keystore'unuzun SHA-1 değerini de eklemeniz gerekir.

## 3. google-services.json Güncellemek

SHA-1 ekledikten sonra:

1.  Firebase Konsolundan (aynı yerden) güncel `google-services.json` dosyasını indirin.
2.  Bu dosyayı projenizdeki `android/app/google-services.json` konumuna yapıştırın (eski dosyanın üzerine yazın).

## 4. Ek Kontroller

- **Package Name:** `android/app/build.gradle` içindeki `namespace` veya `applicationId` ile Firebase'deki paket adının birebir aynı olduğundan emin olun (`com.eoist.geliom`).
- **Google Cloud Console:** Bazen Firebase otomatik oluşturur ama Google Cloud Console'da "OAuth consent screen" ayarlarının yapılmış olduğundan ve "Support email" seçili olduğundan emin olun.
