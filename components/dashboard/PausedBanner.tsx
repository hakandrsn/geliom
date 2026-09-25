import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface PausedBannerProps {
  /** Grup sahibi mi — sahibe aksiyon, üyelere bilgi gösterilir */
  isOwner: boolean;
}

/**
 * Duraklatılmış grup uyarısı — üye listesinin hemen üstünde, ilk dikkati
 * çekecek yerde. Sahip dokununca paywall açılır; yenilenince sunucu grubu
 * aktifleştirir ve session kendiliğinden canlıya döner.
 */
export default function PausedBanner({ isOwner }: PausedBannerProps) {
  const { colors } = useTheme();
  const { openPaywall } = usePremiumGate();

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.error + "14",
          borderColor: colors.error + "55",
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.error }]}>
        <Ionicons name={isOwner ? "alert" : "pause"} size={16} color="#FFFFFF" />
      </View>
      <View style={styles.text}>
        <Typography variant="body" fontWeight="bold" color={colors.error}>
          {isOwner ? "Aboneliğin sona erdi" : "Grup duraklatıldı"}
        </Typography>
        <Typography variant="bodySmall" color={colors.text}>
          {isOwner
            ? "Grubun canlı güncellemeleri ve bildirimleri durdu. Özelliklerini kaybetmemek için Premium'u yenile."
            : "Grup liderinin grubu yeniden etkinleştirmesi bekleniyor. Bu sırada durum paylaşılamaz."}
        </Typography>
        {isOwner && (
          <Typography variant="bodySmall" fontWeight="bold" color={colors.error} style={styles.cta}>
            Yeniden etkinleştir →
          </Typography>
        )}
      </View>
    </View>
  );

  if (!isOwner) return content;
  return (
    <BouncyButton onPress={() => openPaywall()} scaleTo={0.99}>
      {content}
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
