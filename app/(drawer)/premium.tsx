import { BaseLayout, Button, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { PREMIUM_BENEFITS } from "@/constants/premium";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { layout, radius, spacing } from "@/theme/tokens";
import { openPrivacyPolicy, openTermsOfUse } from "@/utils/linking";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, View } from "react-native";

const MANAGE_SUBSCRIPTION_URL = Platform.select({
  ios: "https://apps.apple.com/account/subscriptions",
  default: "https://play.google.com/store/account/subscriptions",
});

/**
 * Premium avantajları: herkesin ulaşabildiği sabit satın alma noktası
 * (App Store 2.1 — inceleyici paywall'u limite takılmadan da bulabilmeli).
 */
export default function PremiumScreen() {
  const { colors } = useTheme();
  const { isPremium, openPaywall, restore } = usePremiumGate();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.passiveState }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.warning }]}>
            <Ionicons name="diamond" size={28} color="#FFFFFF" />
          </View>
          <Typography variant="h4" fontWeight="bold" color={colors.text} style={styles.center}>
            Geliom Premium
          </Typography>
          <Typography variant="body" color={colors.secondaryText} style={styles.center}>
            {isPremium
              ? "Premium aktif. Tüm avantajlar senin."
              : "Daha fazla grup, daha kalabalık ekipler ve sana özel seçenekler."}
          </Typography>
        </View>

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          AVANTAJLAR
        </Typography>
        {PREMIUM_BENEFITS.map((b) => (
          <ListItem
            key={b.title}
            icon={b.icon}
            iconColor={colors.warning}
            title={b.title}
            subtitle={b.subtitle}
            right={
              isPremium ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : undefined
            }
          />
        ))}

        <View style={styles.actions}>
          {isPremium ? (
            <Button
              variant="outline"
              title="Aboneliği Yönet"
              onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL)}
            />
          ) : (
            <Button variant="gradient" title="Premium'a Geç" onPress={() => openPaywall()} />
          )}

          <ListItem
            icon="refresh-outline"
            iconColor={colors.text}
            title="Satın Alımları Geri Yükle"
            subtitle={isRestoring ? "Kontrol ediliyor…" : "Daha önce satın aldıysan aboneliğini geri getir"}
            onPress={handleRestore}
            disabled={isRestoring}
          />
        </View>

        <Typography variant="caption" color={colors.lightText} style={styles.legal}>
          Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir. Aboneliğini
          mağaza hesabı ayarlarından yönetebilir veya iptal edebilirsin.
        </Typography>
        <View style={styles.links}>
          <Typography variant="caption" fontWeight="semibold" color={colors.primary} onPress={openTermsOfUse}>
            Kullanım Şartları
          </Typography>
          <Typography variant="caption" color={colors.lightText}>
            ·
          </Typography>
          <Typography variant="caption" fontWeight="semibold" color={colors.primary} onPress={openPrivacyPolicy}>
            Gizlilik Politikası
          </Typography>
        </View>
      </ScrollView>
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
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  legal: {
    textAlign: "center",
    marginTop: spacing.xl,
  },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
