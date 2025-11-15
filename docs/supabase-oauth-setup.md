# Supabase Google OAuth Yapılandırma Kılavuzu

## Hata: "invalid_client" veya "the OAuth client was not found"

Bu hata, Google Cloud Console'da OAuth client'ın düzgün yapılandırılmadığını veya Supabase'de yanlış credentials kullanıldığını gösterir.

## Önemli: Firebase vs Supabase OAuth

Firebase'de oluşturduğunuz OAuth credentials'ları Supabase'de de kullanabilirsiniz, çünkü ikisi de Google Cloud Console'u kullanır. 

**Firebase'in oluşturduğu OAuth client'ları:**
- `google-services.json` dosyasında `client_type: 3` olan client = **Web application** (Supabase için kullanılabilir)
- Bu client'ın **Client ID**'si zaten var
- **Client Secret**'ı Google Cloud Console'dan görebilir veya reset edebilirsiniz

**Neden Client Secret gerekli?**
- Firebase native SDK kullanır → Secret gerektirmez (SHA-1 ile doğrulanır)
- Supabase web-based OAuth kullanır → Server-side doğrulama için secret gerektirir
- Aynı OAuth client'ı kullanabilirsiniz, sadece secret'ı eklemeniz gerekir

## Adım Adım Yapılandırma

### 1. Mevcut Firebase OAuth Client'ını Kullanma (Önerilen)

Firebase'in oluşturduğu OAuth client'ı kullanabilirsiniz! `google-services.json` dosyanızda `client_type: 3` olan Web client var.

**Seçenek A: Mevcut Web Client'ın Secret'ını Görme/Reset Etme**

1. [Google Cloud Console](https://console.cloud.google.com/) → `geliom-8d06f` projesini seçin
2. **APIs & Services** → **Credentials**
3. OAuth 2.0 Client IDs listesinde **Web client** bulun (Client ID: `53336710716-ocrnuvqlpq02lvss0hvjgeqc08539sqm.apps.googleusercontent.com`)
4. Client'ı tıklayın
5. **Authorized redirect URIs** bölümüne şunu ekleyin:
   ```
   https://jtqmntczxkdmftoqspdx.supabase.co/auth/v1/callback
   ```
6. **SAVE** butonuna tıklayın
7. **Client Secret**'ı görmek için:
   - Eğer secret gösterilmiyorsa → **RESET SECRET** butonuna tıklayın
   - Yeni secret'ı kopyalayın (sadece bir kez gösterilir!)
   - **DİKKAT**: Secret'ı reset ederseniz, Firebase'deki mevcut kullanımlar etkilenmez (Firebase native SDK secret kullanmaz)

**Seçenek B: Yeni OAuth Client Oluşturma (İsterseniz)**

1. [Google Cloud Console](https://console.cloud.google.com/) → `geliom-8d06f` projesini seçin
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. **Name**: "Supabase OAuth" (veya istediğiniz bir isim)
6. **Authorized redirect URIs** ekleyin:
   ```
   https://jtqmntczxkdmftoqspdx.supabase.co/auth/v1/callback
   ```
   **NOT**: `geliom://auth/callback` eklemeyin! Google Cloud Console Web application type'ında sadece HTTPS URL'leri kabul eder.
7. **Create** butonuna tıklayın
8. **ÖNEMLİ**: Açılan popup'ta **Client ID** ve **Client Secret**'ı hemen kopyalayın

### 2. Supabase Dashboard'da Google OAuth Ayarlama

1. [Supabase Dashboard](https://app.supabase.com/) → Projenizi seçin
2. **Authentication** → **Providers** → **Google**
3. **Enable Google** toggle'ını açın
4. **Client ID (for OAuth)** alanına Google'dan aldığınız Client ID'yi yapıştırın
5. **Client Secret (for OAuth)** alanına Google'dan aldığınız Client Secret'ı yapıştırın
6. **Save** butonuna tıklayın

### 3. Redirect URL'leri Kontrol Etme

Supabase Dashboard'da **Authentication** → **URL Configuration** bölümünde:

**Redirect URLs** listesine şunları ekleyin:
```
geliom://auth/callback
exp://127.0.0.1:8081/--/auth/callback
exp://localhost:8081/--/auth/callback
```

**Site URL** alanını da kontrol edin (genelde otomatik doldurulur).

### 4. Firebase Client ID'sini Kullanma

`google-services.json` dosyanızdaki mevcut Web client:
- **Client ID**: `53336710716-ocrnuvqlpq02lvss0hvjgeqc08539sqm.apps.googleusercontent.com`
- **Client Type**: 3 (Web application)
- Bu client'ı Supabase'de kullanabilirsiniz!

**Yapmanız gerekenler:**
1. Google Cloud Console'da bu client'ı bulun
2. Redirect URI ekleyin: `https://jtqmntczxkdmftoqspdx.supabase.co/auth/v1/callback`
3. Client Secret'ı reset edin (eğer göremiyorsanız)
4. Supabase Dashboard'a Client ID ve yeni Secret'ı ekleyin

**Önemli:** Secret'ı reset etmek Firebase'i etkilemez çünkü Firebase native SDK kullanır ve secret gerektirmez.

### 4. Test Etme

1. Uygulamayı yeniden başlatın
2. Google ile giriş yapmayı deneyin
3. Artık Google OAuth sayfası açılmalı

## Önemli Notlar

- **Client Secret** mutlaka doğru girilmelidir
- **Redirect URI** Google Cloud Console'da tam olarak eşleşmelidir
- Supabase'deki redirect URL'ler uygulama scheme'inizi içermelidir (`geliom://`)

## Sorun Giderme

### "invalid_client" veya "the OAuth client was not found" hatası:
1. **Google Cloud Console'da OAuth client'ın aktif olduğundan emin olun**
2. **Client ID'nin doğru kopyalandığından emin olun** (boşluk olmamalı)
3. **Client Secret'ın doğru kopyalandığından emin olun** (boşluk olmamalı)
4. **Redirect URI'nin Google Cloud Console'da ekli olduğundan emin olun:**
   ```
   https://jtqmntczxkdmftoqspdx.supabase.co/auth/v1/callback
   ```
5. Supabase Dashboard'da Google provider ayarlarını kontrol edin
6. Sayfayı yenileyin ve tekrar deneyin

### "missing OAuth secret" hatası:
1. Supabase Dashboard'da Google provider ayarlarını kontrol edin
2. Client Secret alanının dolu olduğundan emin olun
3. Eğer boşsa, yeni bir OAuth client oluşturun ve secret'ı kopyalayın

### Redirect hatası alıyorsanız:
1. Google Cloud Console'da redirect URI'nin **tam olarak** eşleştiğinden emin olun:
   - `https://jtqmntczxkdmftoqspdx.supabase.co/auth/v1/callback` (tam olarak bu şekilde)
2. Supabase Dashboard'da redirect URL'lerin eklendiğinden emin olun
3. URL'lerde trailing slash olmamalı

### Firebase ile Supabase Arasında Paylaşım:
- Aynı Google Cloud projesini kullanıyorsanız, aynı OAuth credentials'ları kullanabilirsiniz
- Ancak her ikisi için de redirect URI'ları eklemeniz gerekir
- Firebase için: `https://YOUR_PROJECT.firebaseapp.com/__/auth/handler`
- Supabase için: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

