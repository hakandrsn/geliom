# Base
-  You are my eyes on the code. If something catches your attention while reading code or logs — a bug, a risk, a smell, something surprising — flag it, even if it's unrelated to the task at hand. I will never see it unless you tell me.

# Geliom Mobile — Claude Kuralları

Geliom: arkadaş gruplarıyla anlık durum (status) ve ruh hali (mood) paylaşan real-time sosyal uygulama.
Stack: React Native (Expo, expo-router), TypeScript, Zustand, TanStack Query, Socket.io, Firebase Auth.

## Tasarım Sistemi — EN ÖNEMLİ KURALLAR

### Renkler
- **Asla hard-coded renk yazma.** Tüm renkler `useTheme()` üzerinden gelir: `const { colors, shadows, isDark } = useTheme()`.
- Renk paleti [theme/colors.ts](theme/colors.ts) dosyasında tanımlı; light ve dark her zaman birlikte güncellenir. `ThemeColors` interface'ine alan eklemeden yeni renk kullanma.
- Tonlu (soluk) zeminler için `colors.passiveState` kullan; `colors.primary + '20'` gibi hex+alpha birleştirmelerinden kaçın.
- Gradient/primary zeminlerin üstünde metin her zaman beyaz (`#FFFFFF`).

### Token'lar
- Spacing, radius ve gölge değerleri [theme/tokens.ts](theme/tokens.ts) dosyasından gelir. StyleSheet içinde elle sayı yazma:
  - Boşluk: `spacing.xs(4) sm(8) md(12) lg(16) xl(20) xxl(24) xxxl(32)`
  - Köşe: `radius.sm(10) md(14) lg(18) xl(22) xxl(28) full`
  - Ekran kenar boşluğu: `layout.screenPadding` (16) — her ekranda aynı
  - Gölge: `shadows.card` (kartlar) / `shadows.floating` (modal, popover) — `useTheme()`'den al, elle shadow yazma

### Tipografi
- Metin için sadece `Typography` (veya `CustomText`) bileşenini kullan; asla çıplak `<Text>` kullanma. Font ailesi Comfortaa'dır ve bu bileşenler üzerinden uygulanır.
- Variant'lar [theme/typography.ts](theme/typography.ts) dosyasında: `h1–h6`, `body`, `bodyLarge`, `bodySmall`, `caption`, `button`, `label`, `status`, `nickname`, `groupName`.
- `fontSize`/`fontFamily` override etme; doğru variant'ı seç. Vurgu gerekiyorsa `fontWeight` prop'unu kullan.

## Component Sistemi

Öncelik sırası: **önce `components/ui`'daki primitive'i kullan → yoksa oraya yeni primitive ekle → ekran-özel parçaları ilgili domain klasörüne koy.**

- [components/ui/](components/ui/) — tasarım sistemi primitive'leri (domain bilgisi İÇERMEZ):
  - `Card` — tüm kart yüzeyleri (kenarlık + gölge + radius). `highlighted` prop'u vurgulu kart yapar.
  - `Chip` — seçilebilir hap; status/mood seçiciler bununla yapılır. `dashed` = "ekle" chip'i.
  - `IconButton` — dairesel ikon butonu (`surface`/`tonal`/`ghost`).
  - `Avatar` — avatar; `ring` (vurgu halkası) ve `badge` (mood emojisi) destekler.
  - `SectionHeader` — bölüm başlığı (büyük harf + sayı rozeti).
  - `EmptyState` — boş durum (ikon halkası + başlık + açıklama + aksiyonlar).
  - `Skeleton` — yüklenme iskeleti (nabız animasyonlu blok).
  - `ListItem` — ayar/menü satırı: **zeminsiz** (kart yok), 28pt ikon + başlık + alt başlık, sağda Switch/chevron. Ayarlar ve grup yönetimi tipi listelerde satırlara kart zemini VERME.
- [components/shared/](components/shared/) — `Typography`, `Button` (büyük CTA: gradient/outline), `GeliomButton` (ikincil aksiyonlar), `BaseLayout`.
- [components/dashboard/](components/dashboard/), [components/business/](components/business/) — ekran/domain'e özel bileşenler.
- [components/bottomsheets/](components/bottomsheets/) — bottom sheet içerikleri. Onay akışları için `ConfirmSheet` (Alert.alert YERİNE), status/mood ekleme için `StatusMoodBottomSheet` kullan. Sheet'ler `useBottomSheet().openBottomSheet` ile açılır; sheet yüzeyi `colors.sheetBackground`'dan gelir (opak olmalı — rgba kart renkleri sheet'te görünmez). Sheet içindeki input'lar `BottomSheetTextInput` olmalı; klavye, gorhom `keyboardBehavior="interactive"` + `react-native-keyboard-controller` (root'ta `KeyboardProvider`) ile yönetilir.
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
- Ekran hiyerarşisi: başlık ve "benim kartım" gibi sabit alanlar kompakt tutulur; ekranın asıl alanı ana içeriğe (grup üyeleri) ayrılır.
- Her UI değişikliğini hem light hem dark temada düşün; tek temaya göre renk seçme.
- Kullanıcıya görünen tüm metinler Türkçe.

## Monetization

- Premium gerektiren her aksiyon (custom status/mood ekleme vb.) `useManageStatusMood().checkSubscriptionAndProceed` kapısından geçer: abone değilse **Alert değil Adapty paywall** açılır (`showPaywall`, placement: `FIRST_SUBSCRIPTION_PLACEMENT`), satın alma başarılıysa aksiyon otomatik devam eder.
- Abonelik durumu `useAppStore().isSubscribed`'dan okunur; `services/purchase.ts` dışında Adapty SDK'sını doğrudan çağırma.

## Mimari Kurallar

- Veri çekme: TanStack Query hook'ları [api/](api/) altında (`useGroupDashboardData` gibi). Component içinde doğrudan axios/fetch çağrısı yapma.
- Global state: Zustand ([store/useAppStore.ts](store/useAppStore.ts)). Real-time güncellemeler socket hook'larıyla (`useDashboardRealtime` vb.) gelir.
- Kullanıcı eylemlerinde optimistic update esastır: önce local state'i güncelle, sonra mutation'ı tetikle.
- Yeni ekranlar `app/` altında expo-router dosya yapısıyla açılır; ekran bileşeni ince kalır, UI parçaları `components/` altına gider.
- Import'larda `@/` alias'ını kullan.

## Build / Çalıştırma

- iOS build notları için hafızadaki kurala bak: Firebase config dosyaları gitignore'da, `ios/` CNG ile üretiliyor.
- `react-native-draggable-flatlist` KULLANMA — Reanimated 4 ile uyumsuz (sürükleme tetiklenmiyor); sıralama UI'ları ok butonlarıyla yapılır (bkz. reorder-status-mood).
- Tip kontrolü: `npx tsc --noEmit` (repo'da devam eden API refactor'undan kalan bilinen hatalar var; yeni hata ekleme).

---
*Bu dosya zamanla güncellenecek — kurallar değiştikçe buraya eklenir.*
