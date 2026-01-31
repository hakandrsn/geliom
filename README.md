📱 Geliom: Real-Time Social Status App
Geliom, kullanıcıların anlık duygu durumlarını (mood), aktivitelerini ve statülerini arkadaş gruplarıyla gerçek zamanlı (real-time) olarak paylaşmasını sağlayan modern bir mobil uygulamadır.

Bu proje, Geliom API backend servisinin istemci (client) tarafıdır ve React Native (Expo) ekosistemi üzerine inşa edilmiştir.

<p align="center"> <img src="https://via.placeholder.com/300x600?text=Login+Screen" width="200" alt="Login Screen" /> <img src="https://via.placeholder.com/300x600?text=Status+Dashboard" width="200" alt="Dashboard" /> <img src="https://via.placeholder.com/300x600?text=Mood+Selection" width="200" alt="Mood Select" /> </p>

🚀 Öne Çıkan Özellikler
Mobil dünyada "hız" ve "akıcılık" her şeydir. Geliom'da şu teknikleri kullandım:

⚡ WebSocket (Socket.io): Status güncellemeleri anlık olarak tüm grup üyelerine iletilir. "Pull-to-refresh" yapmaya gerek yoktur.

🧠 Optimistic UI Updates: Kullanıcı bir eylem yaptığında (örn: Mood değiştirdiğinde) sunucudan cevap beklemeden arayüz güncellenir. Bu sayede uygulama "native" hızında hissettirir.

🔐 Secure Authentication: Firebase Auth ile alınan JWT tokenlar, cihazın şifreli deposunda (Expo SecureStore) saklanır.

🎨 Responsive Design: Farklı ekran boyutlarına uyumlu, modern ve minimal arayüz.

🛠️ Teknoloji Stack'i
Framework: React Native (Expo SDK 50+)

Language: TypeScript (Strict Mode)

Real-Time: Socket.io-client

State Management: Zustand (Hafif ve hızlı global state yönetimi için)

Storage: Expo SecureStore & Async Storage

Networking: Axios

Navigation: Expo Router (File-based routing)

🏃‍♂️ Kurulum ve Çalıştırma
Projeyi lokalde çalıştırmak için Backend servisinin ayakta olması gerekir.


👨‍💻 Geliştirici
Hakan Dursun - Full-Stack Developer LinkedIn | GitHub
