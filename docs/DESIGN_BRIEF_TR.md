# Geliom — Tasarım Çalışması Brief'i (TR)

> Bu doküman, Geliom mobil uygulaması için yapılacak tasarım çalışmasına zemin oluşturur.
> Uygulamanın ne olduğunu, tüm ekranlarını, mevcut görsel dilini ve tasarım açısından
> kritik noktaları özetler.

## 1. Uygulama Nedir?

**Geliom**, kapalı arkadaş/aile gruplarında **anlık durum (status) ve ruh hali (mood)
paylaşımı** yapan bir mobil sosyal uygulamadır. Mesajlaşma uygulaması değildir; sohbet
yoktur. Cevapladığı tek soru şudur: *"Yakınlarım şu an ne yapıyor, nasıl hissediyor?"*

Kullanıcı bir gruba girer (aile, arkadaşlar veya iş arkadaşları), tek dokunuşla durumunu
("Müsaitim", "Çalışıyorum", "Yoldayım"...) ve mood'unu (emoji ile: mutlu, yorgun,
stresli...) seçer. Bu güncelleme **WebSocket üzerinden anlık olarak** gruptaki herkesin
ekranına düşer — yenileme gerekmez. Optimistic UI kullanılır: kullanıcı seçim yapar yapmaz
arayüz güncellenir, sunucu cevabı beklenmez. Uygulama "hafif, hızlı, samimi" hissettirmek
üzere kurgulanmıştır.

- **Platform:** iOS + Android (React Native / Expo, Expo Router)
- **Dil:** Türkçe ve İngilizce (i18n mevcut)
- **Hedef kitle:** Birbirini yakından tanıyan küçük gruplar (aile, yakın arkadaş çevresi, ekip)
- **Gelir modeli:** Freemium — Adapty ile abonelik/premium (paywall ekranı mevcut, kullanıcıda `isPremium` alanı var)

## 2. Temel Kavramlar (Veri Modeli)

- **Kullanıcı:** Firebase Auth ile giriş (Google / Apple Sign-In). Profilde `displayName`,
  aranabilir bir `customId`, avatar fotoğrafı ve premium durumu bulunur.
- **Grup:** İsim, açıklama, **davet kodu** (paylaşılarak katılım sağlanır), sahip (owner),
  üye limiti (`max_members`) ve tip (`family` / `friends` / `work`) içerir. Katılım iki
  yolla olur: davet koduyla direkt katılma veya **katılma isteği** gönderip admin onayı
  bekleme (PENDING / APPROVED / REJECTED).
- **Üyelik:** ADMIN / MEMBER rolleri. Üyelere grup içinde **takma ad (nickname)**
  verilebilir. Grup sahipliği devredilebilir.
- **Status:** Grup bazlı serbest metin + opsiyonel emoji. Gruba özel hazır status
  seçenekleri vardır; **özel status eklenebilir** ve sıralaması düzenlenebilir.
- **Mood:** Gruba özel emoji + metin çiftleri (ör. 😊 "Mutluyum"). Bunlar da
  özelleştirilebilir ve sıralanabilir.
- **Bildirim:** OneSignal push bildirimleri; grup bazında **sessize alma (mute)** ayarı vardır.

## 3. Ekran Haritası

### Giriş Akışı
1. **Splash** — açılış ekranı
2. **Onboarding** — animasyonlu, kendi kendine oynayan bir demo senaryosu: sahte bir
   "Aile Grubu" oluşturulur, üyeler (Sen, Ayşe, Can) belirir, statuslar canlı güncellenir,
   bildirim animasyonu düşer. Uygulamanın değer önerisini anlatan interaktif hikâye.
3. **Login** — Google ve Apple ile giriş

### Ana Yapı — Drawer (Yan Menü) Navigasyonu
4. **Home / Dashboard** (uygulamanın kalbi):
   - Üstte grup adı + grup tipi + üye sayısı; sağda davet paylaşma ve menü butonları
     (44px yuvarlak ikon butonları)
   - **"Benim kartım"** (CurrentUserHeader) — kendi avatarım, mevcut status ve mood'um
   - **StatusSelector ve MoodSelector** — hızlı seçim bileşenleri; dokununca optimistic
     olarak güncellenir
   - Altında **üye kartları listesi** (MemberCard): 50px yuvarlak avatar, avatarın
     köşesinde **mood emoji rozeti**, isim (varsa takma ad, altında gerçek isim), status
     metni. Status güncellenince kartta **glow/parlama animasyonu**, mood değişince emoji
     **spring scale animasyonu** oynar (Reanimated).
   - Grup seçili değilse **EmptyStateView** karşılama ekranı; grup boşsa davet etmeye
     yönlendiren boş durum ekranı
5. **Drawer içeriği** — grup listesi / grup değiştirme (özel drawer bileşeni)
6. **Settings** — tema (light/dark), bildirim ayarları vb.
7. **Search User** — customId ile kullanıcı arama
8. **Help & Support**
9. **Showroom** — bileşen vitrini (geliştirici ekranı)

### Grup Yönetimi Ekranları
10. **Create Group** — grup oluşturma (isim, tip vb.)
11. **Join Group** — davet koduyla katılma
12. **Group Management** — grup ayarları (isim değiştirme, mute, davet kodu)
13. **Manage Members** — üye listesi ve yönetimi
14. **Edit Member** — bir üyeye takma ad verme vb.
15. **Join Requests** — bekleyen katılma isteklerini onaylama/reddetme (admin)
16. **Reorder Status & Mood** — status/mood seçeneklerini ekleme, silme, sürükle-bırak sıralama
17. **Bottom sheet akışları** — Transfer Ownership, Group Name, Nickname, Status/Mood
    ekleme (@gorhom/bottom-sheet)

### Monetizasyon
18. **Paywall** — Adapty tabanlı abonelik ekranı

## 4. Mevcut Görsel Dil

- **Renk paleti — "Social Harmony":** Primary **Indigo 600 (#4F46E5)**, secondary
  **Rose 600 (#E11D48)**, tertiary **Violet 500 (#8B5CF6)**; Indigo→Violet linear
  gradyanlar. Nötrler tamamen **Slate** skalası. Tam **light + dark tema** desteği var
  (dark: Slate 950 zemin, Indigo 400 gibi neonlaştırılmış marka tonları). Semantik
  renkler: Emerald (success), Amber (warning), Red (error), Blue (info).
- **Tipografi:** **Comfortaa** font ailesi (Light→Bold) — yuvarlak hatlı, samimi bir his
  hedeflenmiş. h1–h6 ve body varyantlarının yanında **uygulamaya özel varyantlar**:
  `status`, `nickname`, `groupName`.
- **Şekil dili:** 16px köşe yarıçaplı kartlar, tam yuvarlak avatarlar ve ikon butonları,
  ince 1px stroke'lar, blur arkaplanlar (expo-blur), overlay katmanları.
- **Hareket:** Reanimated ile mikro-animasyonlar (glow, spring scale, fade/slide), Lottie
  animasyonları, haptic feedback (expo-haptics).
- **Bileşen kütüphanesi:** GeliomButton (active/passive/loading durumları), Typography,
  BaseLayout, Popover, AvatarSelector, NetworkToast (çevrimdışı uyarısı), bottom sheet'ler.

Tema mimarisi token tabanlıdır (`theme/colors.ts` içindeki `ThemeColors` interface'i);
yeni bir palet bu yapıya doğrudan oturur.

## 5. Tasarım Açısından Kritik Noktalar

- Uygulamanın en önemli ekranı **Dashboard**: bir bakışta tüm grubun "canlı nabzını"
  göstermeli. Gerçek zamanlılık hissi (bir üyenin status'ü değiştiği an) görsel olarak
  kutlanmalı.
- **Status ve mood seçimi** en sık yapılan eylem — tek elle, 1-2 dokunuşla, keyifli olmalı.
- Duygu ifadesi merkezde: **emoji'ler birinci sınıf görsel öğe** (avatar rozetleri, mood
  seçici).
- Grup tipine göre bağlam farkı var (aile / arkadaş / iş) — tasarımda tonlama fırsatı.
- Boş durumlar önemli: yeni kullanıcı, grupsuz kullanıcı, tek kişilik grup — hepsi davet
  etmeye teşvik etmeli.
- Light/dark tema eşit kalitede tasarlanmalı.
- Premium/paywall tasarımı gelir modelinin parçası.
