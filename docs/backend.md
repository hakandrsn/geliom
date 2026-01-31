Geliom-API: Backend Kullanım Kılavuzu
Bu belge, Prisma (PostgreSQL/RDS), Firebase Auth ve Socket.io kullanılarak geliştirilen Geliom-API backend projesinin nasıl çalıştırılacağını ve API'nin nasıl kullanılacağını detaylıca açıklar.

🚀 Başlangıç

1. Gereksinimler
   Node.js (v18+)
   PostgreSQL (Amazon RDS) bağlantı bilgileri
   Firebase Service Account Key (
   .json
   dosyası)
2. Kurulum
   Bağımlılıkları yükleyin:

npm install 3. Konfigürasyon (.env)
Proje kök dizininde
.env
dosyasını oluşturun ve aşağıdaki değerleri tanımlayın:

# Uygulama Ayarları

PORT=3000
NODE_ENV=development

# Firebase Auth (Admin SDK)

# İndirdiğiniz serviceAccountKey.json dosyasının tam yolu

FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\your\firebase-service-account.json

# Amazon RDS Veritabanı Bağlantısı

DB_HOST=eoist-db.xxxxx.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DATABASE_NAME=eoist-db
DB_USERNAME=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=postgres

# Prisma için Connection String (Otomatik oluşur ama manuel de set edilebilir)

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@eoist-db.xxxxx.eu-north-1.rds.amazonaws.com:5432/postgres" 4. Veritabanı Kurulumu
Prisma şemasını veritabanına uygulayın:

npx prisma db push 5. Uygulamayı Başlatma
Geliştirme modunda başlatmak için:

npm run start:dev
Not: Eğer port 3000 dolu hatası alırsanız, npx kill-port 3000 komutu ile portu boşaltın.

🔑 Kimlik Doğrulama (Authentication)
Proje, Firebase Authentication kullanır. Mobil uygulama veya frontend tarafından alınan Firebase ID Token, Authorization header'ında Bearer token olarak gönderilmelidir.

Header Formatı:

Authorization: Bearer <FIREBASE_ID_TOKEN>
Not: Backend, token'ı doğrular ve eğer kullanıcı veritabanında yoksa, token içindeki bilgilerle (uid, email, photoUrl) otomatik olarak yeni bir kullanıcı oluşturur (Lazy Creation).

📡 API Kullanımı
👤 Kullanıcı İşlemleri (Users)

1. Profilim
   Giriş yapmış kullanıcının bilgilerini getirir.

Endpoint: GET /users/me
Auth: Gerekli 2. Profil Güncelleme
Görünen isim veya profil fotoğrafını günceller.

Endpoint: PATCH /users/me
Body: { "displayName": "Yeni İsim", "photoUrl": "https://..." } 3. Custom ID ile Arama
Arkadaş eklemek için kullanıcı aramakta kullanılır.

Endpoint: GET /users/by-custom-id/:customId 4. Hesap Silme
Kullanıcının hesabını ve tüm verilerini siler.

Endpoint: DELETE /users/me
👥 Grup İşlemleri (Groups)

1. Yeni Grup Oluşturma
   Endpoint: POST /groups
   Body: { "name": "Aile Grubu" }
   Yanıt: Grup bilgileri ve Davet Kodu (inviteCode) döner.
2. Gruba Katılma
   Davet kodu ile bir gruba katılmak için kullanılır.

Endpoint: POST /groups/join
Body: { "inviteCode": "ABC12345" } 3. Gruptan Ayrılma
Endpoint: DELETE /groups/:id/leave

4. Katılım İsteği Gönderme (Alternatif)
   Davet kodu olmadan, bir gruba katılma isteği göndermek için:

Endpoint: POST /groups/:id/join-request 5. İstekleri Listeleme (Admin)
Endpoint: GET /groups/:id/requests 6. İsteği Yanıtlama (Admin)
Endpoint: POST /groups/:id/requests/:requestId/respond
Body: { "response": "APPROVED" } (veya "REJECTED")
📢 Durum Güncellemesi (Status & Mood)
Kullanıcının bir grup içindeki anlık durumunu ve modunu günceller.

Endpoint: POST /status
Body:
{
"groupId": "group-uuid-xxxx",
"text": "Eve gidiyorum",
"emoji": "🚗",
"mood": "happy" // Opsiyonel: happy, sad, busy, etc.
}
⚡ Real-time (Socket.io)
Uygulama, durum güncellemelerini anlık olarak iletmek için Socket.io kullanır.

Bağlantı (Handshake)
Socket bağlantısı kurulurken auth objesi içinde Firebase Token gönderilmelidir.

const socket = io("http://localhost:3000", {
auth: {
token: "FIREBASE_ID_TOKEN",
},
});
Odalar (Rooms)
Kullanıcı bağlandığında, üyesi olduğu tüm gruplar için sunucu tarafında otomatik olarak odalara (group:GROUP_ID) dahil edilir.

Olaylar (Events)
statusUpdate: Bir gruptaki kullanıcı durumunu güncellediğinde, o grubun odasındaki herkese bu event gönderilir.
Payload:
{
"userId": "user-firebase-uid",
"groupId": "group-uuid",
"text": "Eve gidiyorum",
"emoji": "🚗",
"updatedAt": "2024-..."
}
📱 Client Entegrasyon Rehberi (Frontend/Mobile)
Bu bölüm, Geliom-API'yi mobil uygulamanızda (React Native, Flutter, Swift, Kotlin) nasıl kullanacağınızı adım adım açıklar.

1. Kimlik Doğrulama (Login Flow)
   Geliom-API, Lazy User Creation mantığıyla çalışır. Yani, backend tarafında özel bir "Kayıt Ol" endpoint'i yoktur. Kullanıcı Firebase ile giriş yaptığında, token'ı backend'e gönderirseniz ve kullanıcı yoksa otomatik oluşturulur.

Adım 1: Firebase Token Alma (Client Tarafı)
Uygulamanızda (örn: React Native) Firebase Auth kullanarak giriş yapın ve ID Token'ı alın.

// Örnek: React Native Firebase
import auth from "@react-native-firebase/auth";
async function getAuthToken() {
const user = auth().currentUser;
if (user) {
const token = await user.getIdToken();
return token; // Bu token'ı Backend'e göndereceğiz ("eyJhbGci...")
}
return null;
}
Adım 2: Backend'e İstek Atma
Aldığınız token'ı her API isteğinde Authorization header'ına eklemelisiniz.

import axios from "axios";
const api = axios.create({
baseURL: "http://<YOUR_IP>:3000/api", // Emülatör için 10.0.2.2 kullanın
});
// Interceptor ile her isteğe token ekleme (Önerilen)
api.interceptors.request.use(async (config) => {
const token = await getAuthToken();
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});
Adım 3: İlk Giriş Kontrolü
Uygulama açıldığında /users/me endpoint'ini çağırarak kullanıcının backend'de var olup olmadığını kontrol edebilirsiniz. Bu çağrı, kullanıcı yoksa backend'de otomatik oluşturulmasını da tetikler.

async function checkUserStatus() {
try {
const response = await api.get("/users/me");
console.log("Kullanıcı Bilgileri:", response.data);
// { id: "uid...", email: "...", customId: "...", ... }
} catch (error) {
console.error("Hata:", error);
}
} 2. API Kullanım Senaryoları
Senaryo A: Arkadaş Ekleme (Custom ID ile)
Kullanıcıları benzersiz
customId
(örn: AC3478K) ile bulabilirsiniz.

async function findFriend(customId) {
const res = await api.get(`/users/by-custom-id/${customId}`);
if (res.data.found) {
console.log("Kullanıcı bulundu:", res.data.user);
// { displayName: "Ahmet", photoUrl: "..." }
} else {
alert("Kullanıcı bulunamadı");
}
}
Senaryo B: Yeni Grup Kurma
async function createGroup(groupName) {
const res = await api.post("/groups", { name: groupName });
console.log("Grup Oluşturuldu:", res.data);
console.log("Davet Kodu:", res.data.inviteCode); // Bu kodu arkadaşlarınızla paylaşın
}
Senaryo C: Gruba Katılma
async function joinGroup(inviteCode) {
try {
const res = await api.post("/groups/join", { inviteCode });
console.log("Gruba Katıldınız:", res.data);
} catch (error) {
// 404 veya 400 dönebilir
alert("Geçersiz kod veya zaten üyesiniz");
}
} 3. Real-time Durum Paylaşımı (Socket.io)
Canlı durum güncellemeleri için socket.io-client kütüphanesini kullanın.

Bağlantı Kurma
Bağlanırken token göndermek zorunludur.

import io from "socket.io-client";
let socket;
async function connectSocket() {
const token = await getAuthToken();
socket = io("http://<YOUR_IP>:3000", {
auth: {
token: token, // Handshake auth
},
});
socket.on("connect", () => {
console.log("Socket bağlandı:", socket.id);
});
// Durum güncellemelerini dinle
socket.on("statusUpdate", (data) => {
console.log("YENİ DURUM GELDİ:", data);
// data = { userId: "...", groupId: "...", text: "...", emoji: "..." }
// UI'ı güncelle
});
}
Durum ve Mood Güncelleme
Durum güncellemek için Socket event'i değil, REST API kullanılır. Backend, güncellemeyi alır, veritabanına yazar ve ardından Socket üzerinden herkese yayınlar.

async function updateMyStatus(groupId, text, emoji, mood) {
// 1. Durumu API'ye gönder (Veritabanına kaydolur)
await api.post("/status", {
groupId,
text,
emoji,
mood, // Yeni: mood alanı
});
// 2. Yanıt beklemeye gerek yok, backend otomatik olarak socket'ten 'statusUpdate' yayar.
} 4. Bildirimler (OneSignal)
Uygulama, "Durum Güncellemesi" ve "Katılım İsteği" gibi durumlarda OneSignal üzerinden push bildirim gönderir.

Kurulum
Client tarafında (Mobile) OneSignal SDK'sını kurun ve kullanıcıyı userId (Firebase UID) ile eşleştirin.

// OneSignal.setExternalUserId(firebaseUid);
Backend, bu ID'ye bildirim gönderecektir.
