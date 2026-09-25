import { SUPPORT_CATEGORIES, useSendSupportMessage, type SupportCategory } from "@/api";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { BaseLayout, Button, Typography } from "@/components/shared";
import { Chip, ListItem } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { layout, radius, spacing } from "@/theme/tokens";
import { fonts, typography } from "@/theme/typography";
import { getAppInfoString, getAppVersionLabel } from "@/utils/app-info";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Linking, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

export const SUPPORT_EMAIL = "support@tecktick.com";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Geliom ne işe yarar?",
    a: "Geliom, yakın çevrenle anlık durumunu ve ruh halini paylaştığın küçük bir alan. Mesaj atmadan, arayıp sormadan; “toplantıda”, “yolda”, “biraz yorgun” gibi tek dokunuşluk güncellemelerle grubun ne yaptığını görürsün. Aile, ev arkadaşları ya da yakın arkadaş grupları için tasarlandı.",
  },
  {
    q: "Grup nasıl oluştururum, nasıl katılırım?",
    a: "Ana ekrandaki grup adına dokunup “Yeni Grup Oluştur” diyebilirsin; grup oluşturunca yöneticisi sen olursun. Katılmak için grubun 6 karakterlik davet kodunu “Gruba Katıl” ekranına yaz. Kod sana gelmediyse yöneticinin grup ekranından paylaşması gerekir; yönetici isterse katılım isteklerini onaylayarak da üye alabilir.",
  },
  {
    q: "Durum ile ruh hali arasındaki fark ne?",
    a: "Durum ne yaptığını anlatır: “İşte”, “Spor yapıyor”, “Kahve molası”. Ruh hali ise nasıl hissettiğini: “Mutlu”, “Yorgun”, “Enerjik”. İkisini birlikte de, tek başına da paylaşabilirsin. Hiçbirini paylaşmak istemezsen seçicinin en solundaki çarpı ile kaldırırsın.",
  },
  {
    q: "Paylaştıklarımı kimler görür?",
    a: "Yalnızca o grubun üyeleri. Her grup birbirinden bağımsızdır; bir grupta paylaştığın durum diğerine geçmez. Grubun dışındaki hiç kimse, arama yoluyla da olsa, durumunu göremez.",
  },
  {
    q: "Bildirimler nasıl çalışır?",
    a: "Biri durumunu değiştirdiğinde uygulaması kapalı olan üyelere bildirim gider. Art arda değişikliklerde her seferinde bildirim gitmesin diye son değişiklikten 15 saniye sonra tek bir bildirim gönderilir. Uygulama açıkken zaten canlı görürsün, ayrıca bildirim almazsın. Her grubu ayrı ayrı sessize alabilirsin.",
  },
  {
    q: "Bildirim almıyorum, ne yapmalıyım?",
    a: "Önce Ayarlar > Bildirimler ekranında ana anahtarın açık ve ilgili grubun sessizde olmadığından emin ol. Sonra telefonun sistem ayarlarında Geliom için bildirim izninin verildiğini kontrol et. iOS’ta Odak modları, Android’de pil tasarrufu bildirimleri geciktirebilir. Sorun sürerse aşağıdaki formdan yaz, kayıtlarına bakalım.",
  },
  {
    q: "Premium ne sağlıyor?",
    a: "Ücretsiz hesapla 1 gruba üye olabilir, grubun en fazla 5 kişi olabilir. Premium’da 7 gruba kadar üye olursun, yönettiğin gruplar 20 kişiye çıkar ve grubuna 10 adede kadar özel ruh hali ekleyebilirsin. Grup kapasitesi ve özel ruh halleri grubun yöneticisinin Premium olmasına bağlıdır.",
  },
  {
    q: "Aboneliğimi nasıl iptal eder ya da geri yüklerim?",
    a: "Abonelikler App Store veya Google Play üzerinden yönetilir; iptal için mağazanın abonelikler bölümüne gitmen yeterli, dönem sonuna kadar Premium devam eder. Yeni telefona geçtiysen ya da Premium görünmüyorsa Premium ekranındaki “Satın alımları geri yükle” seçeneğini kullan.",
  },
  {
    q: "Grup yöneticisi neler yapabilir?",
    a: "Grubun adını ve açıklamasını değiştirir, katılım isteklerini onaylar ya da reddeder, üye çıkarır ve Premium ise gruba özel ruh halleri ekler. Yönetici gruptan ayrılamaz; önce tüm üyeleri çıkarması gerekir. Grupta tek başına kaldığında ayrılırsa grup tamamen silinir.",
  },
  {
    q: "Gruptan nasıl ayrılırım?",
    a: "Grup ekranındaki ayarlar simgesinden Üyeleri Yönet’e gir, en alttaki “Gruptan Ayrıl” ile çıkabilirsin. Ayrıldığında durum geçmişin gruptan silinir; geri dönmek için yeniden davet kodu gerekir.",
  },
  {
    q: "Hesabımı silersem ne olur?",
    a: "Hesabın, profil bilgilerin ve tüm durum kayıtların kalıcı olarak silinir. Üyesi olduğun gruplardan çıkarılırsın; yöneticisi olduğun gruplar tamamen silinir ve üyeleri bilgilendirilmez. Bu işlem geri alınamaz. Ayarlar ekranının en altındaki Tehlikeli Bölge’den yapılır.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Giriş için Google veya Apple hesabını kullanırız, şifre saklamayız. Sunucularımızda e-posta adresin, görünen adın, avatarın ve grup içi durumların tutulur; bunlar yalnızca grup arkadaşlarına gösterilir, üçüncü taraflara satılmaz. Ayrıntılar için Ayarlar > Gizlilik bölümüne bakabilirsin.",
  },
];

const MAX_MESSAGE = 2000;

function FaqItem({ item }: { item: { q: string; a: string } }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      style={[styles.faqItem, { borderBottomColor: colors.stroke }]}
    >
      <BouncyButton onPress={() => setOpen((v) => !v)} scaleTo={0.995} activeOpacity={0.85}>
        <View style={styles.faqHeader}>
          <Typography
            variant="body"
            fontWeight="semibold"
            color={colors.text}
            style={styles.faqQuestion}
          >
            {item.q}
          </Typography>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.lightText}
          />
        </View>
      </BouncyButton>
      {open && (
        <Animated.View entering={FadeIn.duration(180)}>
          <Typography variant="bodySmall" color={colors.secondaryText} style={styles.faqAnswer}>
            {item.a}
          </Typography>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function HelpSupportScreen() {
  const { colors } = useTheme();
  const sendMessage = useSendSupportMessage();

  const [category, setCategory] = useState<SupportCategory>("bug");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const canSend = trimmed.length >= 10 && !sendMessage.isPending;

  const handleSend = async () => {
    if (!canSend) return;
    setError(null);
    try {
      await sendMessage.mutateAsync({
        category,
        message: trimmed,
        appInfo: getAppInfoString(),
      });
      setSent(true);
      setMessage("");
    } catch (e: any) {
      const status = e?.response?.status;
      setError(
        status === 429
          ? "Kısa sürede çok fazla mesaj gönderdin. Biraz sonra tekrar dene."
          : "Mesaj gönderilemedi. İnternet bağlantını kontrol edip tekrar dene.",
      );
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Geliom destek");
    const body = encodeURIComponent(`\n\n—\n${getAppInfoString()}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spacing.xxl}
      >
        {/* Bize yaz */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          BİZE YAZ
        </Typography>

        {sent ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={[styles.sentBox, { backgroundColor: colors.passiveState }]}
          >
            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            <View style={styles.sentText}>
              <Typography variant="body" fontWeight="semibold" color={colors.text}>
                Mesajın bize ulaştı
              </Typography>
              <Typography variant="bodySmall" color={colors.secondaryText}>
                Genellikle bir iş günü içinde e-posta ile dönüyoruz.
              </Typography>
            </View>
            <BouncyButton onPress={() => setSent(false)} style={styles.sentAgain}>
              <Typography variant="caption" fontWeight="semibold" color={colors.primary}>
                Yeni mesaj
              </Typography>
            </BouncyButton>
          </Animated.View>
        ) : (
          <View style={styles.form}>
            <View style={styles.categoryRow}>
              {SUPPORT_CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  icon={c.icon}
                  selected={category === c.key}
                  onPress={() => setCategory(c.key)}
                />
              ))}
            </View>

            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.sheetBackground,
                  color: colors.text,
                  borderColor: error ? colors.error : colors.stroke,
                },
              ]}
              placeholder="Ne oldu, nasıl yardımcı olabiliriz? Adım adım anlatırsan daha hızlı çözeriz."
              placeholderTextColor={colors.lightText}
              value={message}
              onChangeText={(t) => {
                setMessage(t);
                setError(null);
              }}
              multiline
              textAlignVertical="top"
              maxLength={MAX_MESSAGE}
            />
            <View style={styles.meta}>
              <Typography variant="caption" color={error ? colors.error : colors.lightText} style={styles.metaText}>
                {error ?? (trimmed.length < 10 ? "En az 10 karakter" : " ")}
              </Typography>
              <Typography variant="caption" color={colors.lightText}>
                {message.length}/{MAX_MESSAGE}
              </Typography>
            </View>

            <Button
              variant="gradient"
              title="Gönder"
              onPress={handleSend}
              disabled={!canSend}
              loading={sendMessage.isPending}
              icon={<Ionicons name="paper-plane" size={18} color="#FFFFFF" />}
            />
            <Typography variant="caption" color={colors.lightText} style={styles.formHint}>
              Mesajınla birlikte hesabının e-postası ve uygulama sürümü iletilir.
            </Typography>
          </View>
        )}

        {/* E-posta */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          DOĞRUDAN İLETİŞİM
        </Typography>
        <ListItem
          icon="mail-outline"
          title="E-posta gönder"
          subtitle={SUPPORT_EMAIL}
          onPress={handleEmail}
        />

        {/* SSS */}
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          SIK SORULAN SORULAR
        </Typography>
        <View style={[styles.faqList, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
          {FAQ.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </View>

        <Typography variant="caption" color={colors.lightText} style={styles.version}>
          Sürüm {getAppVersionLabel()}
        </Typography>
      </KeyboardAwareScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  form: {
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: fonts.regular,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -spacing.xs,
  },
  metaText: {
    flex: 1,
  },
  formHint: {
    textAlign: "center",
  },
  sentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  sentText: {
    flex: 1,
    gap: 2,
  },
  sentAgain: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  faqList: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: layout.touchTarget - spacing.md,
  },
  faqQuestion: {
    flex: 1,
  },
  faqAnswer: {
    marginTop: spacing.sm,
    paddingRight: spacing.xl,
  },
  version: {
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
