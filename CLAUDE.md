# Base
-  You are my eyes on the code. If something catches your attention while reading code or logs — a bug, a risk, a smell, something surprising — flag it, even if it's unrelated to the task at hand. I will never see it unless you tell me.

# Geliom Mobile — Claude Kuralları

Geliom: arkadaş gruplarıyla anlık durum (status) ve ruh hali (mood) paylaşan real-time sosyal uygulama.
Stack: React Native (Expo, expo-router), TypeScript, Zustand, TanStack Query, Socket.io, Firebase Auth.

## Tasarım Sistemi — EN ÖNEMLİ KURALLAR

### Renkler
- **Asla hard-coded renk yazma.** Tüm renkler `useTheme()` üzerinden gelir: `const { colors, shadows, isDark } = useTheme()`.
- Renk paleti [theme/colors.ts](theme/colors.ts) dosyasında tanımlı (marka: terracotta `primary` + şeftali `secondary`, krem zemin); light ve dark her zaman birlikte güncellenir. `ThemeColors` interface'ine alan eklemeden yeni renk kullanma.
- Tonlu (soluk) zeminler için `colors.passiveState` kullan; `colors.primary + '20'` gibi hex+alpha birleştirmelerinden kaçın.
- Gradient/primary zeminlerin üstünde metin her zaman beyaz (`#FFFFFF`).

### Token'lar
- Spacing, radius ve gölge değerleri [theme/tokens.ts](theme/tokens.ts) dosyasından gelir. StyleSheet içinde elle sayı yazma:
  - Boşluk: `spacing.xs(4) sm(8) md(12) lg(16) xl(20) xxl(24) xxxl(32)`
  - Köşe: `radius.sm(10) md(14) lg(18) xl(22) xxl(28) full`
  - Ekran kenar boşluğu: `layout.screenPadding` (16) — her ekranda aynı
  - Gölge: `shadows.card` (kartlar) / `shadows.floating` (modal, popover) — `useTheme()`'den al, elle shadow yazma

### Tipografi
- Metin için sadece `Typography` (veya `CustomText`) bileşenini kullan; asla çıplak `<Text>` kullanma. Font ailesi **Figtree**'dir (statik ağırlık dosyaları, `fonts.*` token'ları) ve bu bileşenler üzerinden uygulanır. `fontFamily` string'i elle yazma; gerekiyorsa `fonts.medium` gibi token kullan.
- Variant'lar [theme/typography.ts](theme/typography.ts) dosyasında: `h1–h6`, `body`, `bodyLarge`, `bodySmall`, `caption`, `button`, `label`, `status`, `nickname`, `groupName`.
- `fontSize`/`fontFamily` override etme; doğru variant'ı seç. Vurgu gerekiyorsa `fontWeight` prop'unu kullan.

## Component Sistemi

Öncelik sırası: **önce `components/ui`'daki primitive'i kullan → yoksa oraya yeni primitive ekle → ekran-özel parçaları ilgili domain klasörüne koy.**

- [components/ui/](components/ui/) — tasarım sistemi primitive'leri (domain bilgisi İÇERMEZ):
  - `Card` — tüm kart yüzeyleri (kenarlık + gölge + radius). `highlighted` prop'u vurgulu kart yapar.
  - `Chip` — seçilebilir seçenek. `variant="pill"` (durumlar; seçiliyken `filled` ile dolu primary) ve `variant="tile"` (ruh halleri; büyük emoji üstte, 4 sütun ızgara). `dashed` = "ekle". Ana ekranda `StatusComposer` kompakt bir karttır: üstte `MoodHero` (embedded), altta `SegmentedControl` ile Durum / Ruh hali sekmeleri. Seçenekler içeriği itmez; sekmenin altında yüzen `PickerDropdown` panelinde açılır (DashboardView yönetir, dışına dokununca/kaydırınca/seçince kapanır). Durum metni ve ruh hali bağımsızdır; her sekmenin kendi "Kaldır"/"Yok" seçeneği listede yer alır.
  - `Emoji` — emoji için TEK yol. Telefon fontuna bağlı değil: Microsoft Fluent Emoji 3D görseli çizer (varsayılanlar [constants/bundled-emoji.ts](constants/bundled-emoji.ts) ile pakette, kalanı API'den `/api/static/emoji/<code>.png`; görsel yoksa sistem emojisine düşer). `Typography`/`CustomText` içine emoji koyma. Kayıtlarda emoji Unicode karakter olarak saklanır; seçilebilir emojiler API'deki ortak katalogdan gelir (`useEmojiCatalog`, [components/business/EmojiPicker.tsx](components/business/EmojiPicker.tsx)) — sunucu katalog dışı yeni emojiyi reddeder. Katalog/görsel eklemek: `api/src/emoji/emoji-catalog.ts` + `api/assets/emoji/`.
  - `IconButton` — dairesel ikon butonu (`surface`/`tonal`/`ghost`).
  - `Avatar` — avatar; fotoğraf yoksa palete uyumlu tonlu zemin + baş harfler gösterir (`name` ve `seed` ver). `photoUrl` biçimleri: `avatar:<key>` (gömülü karakter, [constants/avatars.ts](constants/avatars.ts) — anahtarlar kalıcıdır, yeniden adlandırma), `https://…`, `tint:n`. Seçim yoksa kişilere seed'e göre sabit karakter, gruplara `fallback="initials"` ile baş harf. `ring` ve `badge` (mood emojisi) destekler. Avatar için doğrudan `Image` kullanma.
  - `SectionHeader` — bölüm başlığı (büyük harf + sayı rozeti).
  - `EmptyState` — boş durum (ikon halkası + başlık + açıklama + aksiyonlar).
  - `Skeleton` — yüklenme iskeleti (nabız animasyonlu blok).
  - `ListItem` — ayar/menü satırı: **zeminsiz** (kart yok), 28pt ikon + başlık + alt başlık, sağda Switch/chevron. Ayarlar ve grup yönetimi tipi listelerde satırlara kart zemini VERME.
- [components/shared/](components/shared/) — `Typography`, `Button` (büyük CTA: gradient/outline), `GeliomButton` (ikincil aksiyonlar), `BaseLayout`.
- [components/dashboard/](components/dashboard/), [components/business/](components/business/) — ekran/domain'e özel bileşenler.
- [components/bottomsheets/](components/bottomsheets/) — bottom sheet içerikleri. Onay akışları için `ConfirmSheet` (Alert.alert YERİNE; snapPoints `[340]` civarı), tek alanlı metin düzenleme için `TextInputSheet` (isim, grup adı — `Modal` YERİNE), avatar için `AvatarSelector`, status/mood ekleme için `StatusMoodBottomSheet` kullan. `Alert.alert` yalnızca beklenmeyen hata mesajları için kabul edilebilir. Sheet'ler `useBottomSheet().openBottomSheet` ile açılır (altta tek bir gorhom `BottomSheetModal`, ref ile `present`/`dismiss`; açma/kapama zamanlayıcısı KULLANMA — kapanırken gelen açma isteği `onDismiss`'te yeniden present edilir); sheet yüzeyi `colors.sheetBackground`'dan gelir (opak olmalı — rgba kart renkleri sheet'te görünmez). Sheet içindeki input'lar `BottomSheetTextInput` olmalı; klavye, gorhom `keyboardBehavior="interactive"` + `react-native-keyboard-controller` (root'ta `KeyboardProvider`) ile yönetilir.
- Dokunulabilir yüzeylerde `TouchableOpacity` yerine `BouncyButton` ([components/anim/AnimatedComponents.tsx](components/anim/AnimatedComponents.tsx)) tercih et — haptic + scale animasyonu standarttır.

### Buton hiyerarşisi
1. Ekranın ana aksiyonu: `Button variant="gradient"` (ekran başına en fazla 1 tane)
2. İkincil aksiyon: `Button variant="outline"`
3. Küçük/yardımcı aksiyonlar: `GeliomButton state="passive"` veya `IconButton`
4. Aynı ekranda üç tane aynı görünümde büyük buton ASLA olmasın.

## UI Kalite Kuralları

- Dokunma hedefleri en az 44pt (`layout.touchTarget`).
- Liste elemanı kartları arasında `spacing.md` boşluk; kart içi padding `spacing.lg`.
- Durum göstergesi: aktif durum için `colors.success` nokta, durum yoksa `colors.lightText`.
- Boş durumlar asla düz metin olmasın — `EmptyState` kullan. Boş durumun EN ÖNEMLİ aksiyonu ekranın ortasında, birincil buton olarak dursun (örn. boş grupta "Davet Et").
- **Loading = Skeleton.** Veri beklenen her yerde spinner değil `Skeleton` kullan ve gerçek yerleşimi taklit et (bkz. `DashboardSkeleton`). `ActivityIndicator` sadece buton içi loading için kabul edilebilir.
- Ekran hiyerarşisi: ana ekranda tek renkli/odak yüzey `MoodHero`'dur (kullanıcının kendi durumu, gradient zemin); geri kalan her şey nötr kalır. Başka ekranlarda da ekran başına en fazla bir gradient yüzey olsun. Ekranın asıl alanı ana içeriğe (grup üyeleri) ayrılır.
- Her UI değişikliğini hem light hem dark temada düşün; tek temaya göre renk seçme.
- Kullanıcıya görünen tüm metinler Türkçe ve samimi ("sen" dili). Ekran başlıkları form etiketi gibi değil, soru gibi yazılır; ana ekran seçici başlıkları [constants/prompts.ts](constants/prompts.ts) havuzundan rastgele gelir. Ham anahtar (`kahve_molasi`, `ADMIN`) asla ekrana düşmez; `humanizeKey` veya açık eşleme kullan.

## Monetization

- Premium'un TEK kapısı `usePremiumGate().requirePremium`. Limitler [constants/premium.ts](constants/premium.ts) içinde, API ile birebir aynı tutulur. API limit hataları 409 + `code` döner (`MEMBERSHIP_LIMIT`, `GROUP_CAPACITY`, `OPTIONS_PREMIUM`, `GROUP_PAUSED`…); mobil kararı metne değil koda göre verir (`getPremiumLimitCode`).
- Grubun durum/ruh hali listesi SUNUCUDA, gruba özeldir (`group.statusOptions` / `group.moodOptions`); yalnızca premium grup sahibi düzenler (ekle / sil / sürükleyerek sırala) — [reorder-status-mood](app/(drawer)/(group)/reorder-status-mood.tsx). Sıralama için `components/ui/DraggableList` kullanılır.
- Sahibin aboneliği biterse ücretsiz hak dışındaki grupları `isPaused` olur: session salt-okunur anlık görüntüdür, status paylaşılamaz, bildirim gitmez; üye listesinin üstünde `PausedBanner` görünür.

- Premium gerektiren her aksiyon (custom status/mood ekleme vb.) `useManageStatusMood().checkSubscriptionAndProceed` kapısından geçer: abone değilse **Alert değil Adapty paywall** açılır (`showPaywall`, placement: `FIRST_SUBSCRIPTION_PLACEMENT`), satın alma başarılıysa aksiyon otomatik devam eder.
- Abonelik durumu `useAppStore().isSubscribed`'dan okunur; `services/purchase.ts` dışında Adapty SDK'sını doğrudan çağırma.

## Mimari Kurallar

- Veri çekme: TanStack Query hook'ları [api/](api/) altında (`useGroupDashboardData` gibi). Component içinde doğrudan axios/fetch çağrısı yapma.
- Global state: Zustand ([store/useAppStore.ts](store/useAppStore.ts)). Real-time güncellemeler `useGroupSession` ile açılan socket session'ından store'a (`session`) akar; component'ler `useGroupDashboardData` gibi selector hook'larıyla okur.
- Kullanıcı eylemlerinde optimistic update esastır: önce local state'i güncelle, sonra mutation'ı tetikle.
- Yeni ekranlar `app/` altında expo-router dosya yapısıyla açılır; ekran bileşeni ince kalır, UI parçaları `components/` altına gider.
- Import'larda `@/` alias'ını kullan.

## Build / Çalıştırma

- **Paket yöneticisi Yarn 4** (`packageManager` alanı, `.yarnrc.yml` → `nodeLinker: node-modules`). `npm install` KULLANMA, `package-lock.json` oluşturma; bağımlılık eklerken `npx expo install <paket>` (yarn.lock'u günceller). Yarn 4 `pre*` script'lerini çalıştırmaz ve kendi kabuğunu kullanır — ön kontrolleri script'in içine `&&` ile yaz, shell'e özgü işleri (`. ./.env` gibi) `scripts/*.sh` dosyasına koy.
- `ios/` ve `android/` CNG ile üretilir (prebuild). Firebase config dosyaları (`google-services.json`, `GoogleService-Info.plist`) repoda tutulur — EAS yalnızca git'teki dosyaları build'e alır, gitignore'a geri ekleme.
- **Uygulama config'inin TEK kaynağı `app.json > expo.extra`** (`apiBaseUrl`, `oneSignalAppId`, `adaptySdkKey`); [config/app.config.ts](config/app.config.ts) yalnızca oradan okur. `.env` / `EXPO_PUBLIC_*` kullanma, değerleri iki yere dağıtma. `extra`'ya yalnızca istemciye gömülmesi sorun olmayan public değerler girer.
- **Build-time secret'lar EAS env'de (secret visibility), repoda DEĞİL:** `SENTRY_AUTH_TOKEN` (production; scope `org:read`, `project:releases`) yalnızca gitignore'daki **`.env`** dosyasında durur — source map upload için. Build'ler yerelde `yarn build:android` / `yarn build:ios` ile alınır; bu script'ler ([scripts/eas-build-local.sh](scripts/eas-build-local.sh)) `.env`'i shell'e yükleyip `eas build --local`'i çalıştırır (EAS'ın "secret" değişkenleri yerel build'e inmez, o yüzden EAS env kullanılmıyor). Token'ı `eas.json`/`app.json`'a YAZMA; `eas.json` git'te kalmalı (EAS build'i git arşivinden okur).
- Preview profilinde Sentry source map upload kapalı (`eas.json` → `SENTRY_DISABLE_AUTO_UPLOAD=true`); token yalnızca production'da tanımlı.
- `react-native-draggable-flatlist` KULLANMA — Reanimated 4 ile uyumsuz. Sürükleyerek sıralama için `components/ui/DraggableList` (Gesture Handler + Reanimated, shared value'larda `get()/set()`).
- Tip kontrolü: `npx tsc --noEmit` — sıfır hata ile geçmelidir; yeni hata ekleme.

---
*Bu dosya zamanla güncellenecek — kurallar değiştikçe buraya eklenir.*
