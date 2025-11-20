# OneSignal REST API Key Kurulum Rehberi

Bu dokümantasyon, OneSignal REST API Key'in nasıl alınacağını, doğru formatta nasıl ayarlanacağını ve Supabase Edge Functions'da nasıl kullanılacağını açıklar.

## OneSignal REST API Key Nedir?

OneSignal REST API Key, OneSignal REST API'yi kullanarak bildirim göndermek için gereken bir kimlik doğrulama anahtarıdır. Bu key, Supabase Edge Function (`send-notification`) tarafından OneSignal API'ye istek gönderirken kullanılır.

## OneSignal REST API Key Nasıl Alınır?

1. **OneSignal Dashboard'a giriş yapın**
   - [OneSignal Dashboard](https://app.onesignal.com/) adresine gidin
   - Giriş yapın

2. **Settings → Keys & IDs bölümüne gidin**
   - Sol menüden **Settings** seçeneğine tıklayın
   - **Keys & IDs** sekmesine gidin

3. **REST API Key'i kopyalayın**
   - **REST API Key** bölümünde **"Show"** butonuna tıklayın
   - API Key'i kopyalayın
   - ⚠️ **ÖNEMLİ**: API Key'i güvenli bir yerde saklayın, bir daha gösterilmeyecek!

## OneSignal REST API Key Formatı

- **Uzunluk**: Genellikle 40-50 karakter arası (bazı durumlarda daha uzun olabilir)
- **Karakter Seti**: Alphanumerik karakterler ve bazı özel karakterler (`-`, `_`, vb.)
- **Format**: Base64 benzeri bir string (örn: `YjE2MTYxMjEtOTBiNS00Y2IwLWEzZWUtOWUxOGYyZDY5MDdj`)

### Örnek API Key Formatı

```
YjE2MTYxMjEtOTBiNS00Y2IwLWEzZWUtOWUxOGYyZDY5MDdj
```

## Supabase Secrets'a OneSignal REST API Key Ekleme

### Yöntem 1: Supabase Dashboard (Önerilen)

1. **Supabase Dashboard'a giriş yapın**
   - [Supabase Dashboard](https://app.supabase.com/) adresine gidin
   - Projenizi seçin

2. **Edge Functions → Settings → Secrets bölümüne gidin**
   - Sol menüden **Edge Functions** seçeneğine tıklayın
   - **Settings** sekmesine gidin
   - **Secrets** bölümüne scroll edin

3. **Yeni Secret ekleyin**
   - **"Add new secret"** butonuna tıklayın
   - **Name**: `ONESIGNAL_REST_API_KEY`
   - **Value**: OneSignal Dashboard'dan kopyaladığınız REST API Key'i yapıştırın
   - ⚠️ **ÖNEMLİ**: API Key'in başında/sonunda boşluk olmamalı!
   - **"Save"** butonuna tıklayın

4. **Diğer gerekli secrets'ları kontrol edin**
   - `ONESIGNAL_APP_ID`: OneSignal App ID (Settings → Keys & IDs → App ID)
   - `SUPABASE_URL`: Supabase proje URL'i (Settings → API → Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (Settings → API → service_role key)

### Yöntem 2: Supabase CLI

```bash
# Supabase CLI ile secret ekleme
supabase secrets set ONESIGNAL_REST_API_KEY=your_api_key_here

# Tüm secrets'ları listeleme
supabase secrets list
```

## API Key Doğrulama ve Test

### 1. Edge Function Log'larını Kontrol Edin

Supabase Dashboard → Edge Functions → Logs bölümünden `send-notification` fonksiyonunun log'larını kontrol edin:

```
🔵 Edge Function environment variables: {
  ONESIGNAL_REST_API_KEY: "✅ Set (113 karakter, YjE2M...MDdj)"
  ONESIGNAL_REST_API_KEY_VALID: "✅ Valid"
}
```

Eğer `❌ Invalid` görüyorsanız, API Key formatını kontrol edin.

### 2. cURL ile OneSignal API Testi

OneSignal REST API Key'inizi test etmek için aşağıdaki cURL komutunu kullanabilirsiniz:

```bash
# OneSignal REST API Key'inizi test edin
curl -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_REST_API_KEY_HERE" \
  -d '{
    "app_id": "YOUR_ONESIGNAL_APP_ID",
    "include_player_ids": ["test_player_id"],
    "headings": {"en": "Test Notification"},
    "contents": {"en": "This is a test notification"}
  }'
```

**Beklenen Sonuçlar:**
- ✅ **200 OK**: API Key geçerli, bildirim gönderildi
- ❌ **403 Forbidden**: API Key geçersiz veya yanlış format
- ❌ **400 Bad Request**: Request body formatı hatalı

### 3. Edge Function'dan Test Bildirimi Gönderme

Uygulama içinden bir test bildirimi göndererek API Key'in çalışıp çalışmadığını kontrol edebilirsiniz:

1. Uygulamada bir grup oluşturun veya mevcut bir gruba katılın
2. Bir kullanıcıya katılma isteği gönderin
3. Supabase Dashboard → Edge Functions → Logs bölümünden log'ları kontrol edin

**Başarılı Log Örneği:**
```
✅ OneSignal bildirim gönderildi: {
  id: "notification_id",
  recipients: 1
}
```

**Hata Log Örneği:**
```
❌ OneSignal API hatası: {
  status: 403,
  statusText: "Forbidden",
  error: "Access denied. Please include an 'Authorization: ...' header with a valid API key"
}
```

## Yaygın Hatalar ve Çözümleri

### Hata 1: "403 Forbidden - Access denied"

**Nedenler:**
- API Key yanlış veya geçersiz
- API Key formatı hatalı (başında/sonunda boşluk var)
- API Key bu App ID için yetkisiz
- API Key süresi dolmuş veya iptal edilmiş

**Çözümler:**
1. OneSignal Dashboard'dan yeni bir REST API Key oluşturun
2. Supabase Secrets'dan API Key'i silin ve yeniden ekleyin (başında/sonunda boşluk olmadan)
3. API Key'in doğru App ID ile eşleştiğinden emin olun
4. Edge Function log'larında API Key preview'ını kontrol edin

### Hata 2: "API Key çok kısa" veya "API Key formatı hatalı"

**Nedenler:**
- API Key yanlış kopyalandı (eksik karakterler)
- API Key'in başında/sonunda görünmez karakterler var

**Çözümler:**
1. OneSignal Dashboard'dan API Key'i tekrar kopyalayın
2. Supabase Secrets'da API Key'i yeniden yapıştırın
3. API Key'in tamamını kopyaladığınızdan emin olun

### Hata 3: "ONESIGNAL_REST_API_KEY environment variable eksik"

**Nedenler:**
- Secret Supabase'e eklenmemiş
- Secret adı yanlış yazılmış (büyük/küçük harf duyarlı)

**Çözümler:**
1. Supabase Dashboard → Edge Functions → Settings → Secrets bölümünden kontrol edin
2. Secret adının tam olarak `ONESIGNAL_REST_API_KEY` olduğundan emin olun
3. Secret'ı silin ve yeniden ekleyin

## Güvenlik Önerileri

1. **API Key'i asla commit etmeyin**
   - `.env` dosyalarını `.gitignore`'a ekleyin
   - API Key'i kod içinde hardcode etmeyin
   - Sadece Supabase Secrets'da saklayın

2. **API Key'i düzenli olarak rotate edin**
   - Her 3-6 ayda bir yeni API Key oluşturun
   - Eski API Key'i iptal edin

3. **API Key erişimini sınırlandırın**
   - OneSignal Dashboard'da IP allowlisting kullanabilirsiniz
   - Sadece gerekli olan Edge Function'lara erişim verin

## İlgili Dokümantasyon

- [OneSignal REST API Overview](https://documentation.onesignal.com/reference)
- [OneSignal Keys & IDs](https://documentation.onesignal.com/docs/accounts-and-keys)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [OneSignal Troubleshooting](https://documentation.onesignal.com/docs/troubleshooting)

## Destek

Sorun yaşıyorsanız:
1. Edge Function log'larını kontrol edin
2. OneSignal Dashboard'da API Key'in durumunu kontrol edin
3. Bu dokümantasyondaki troubleshooting adımlarını takip edin
4. OneSignal ve Supabase destek ekipleriyle iletişime geçin

