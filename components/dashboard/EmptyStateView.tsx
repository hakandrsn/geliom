import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Button, Typography } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

/**
 * Hiç grup yokken karşılama. Tek birincil aksiyon (grup oluştur) ve
 * küçük bir ikincil yol (davet koduyla katıl) — üç eşit buton yerine.
 * Grup listesi uygulama öne gelince zaten tazelenir; ayrı yenile butonu yok.
 */
export default function EmptyStateView() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <EmptyState
      fullScreen
      icon="people-outline"
      title="İlk grubunu kur"
      description="Arkadaşların ve ailenle anlık durumunuzu paylaşın. Grup kur, davet kodunu gönder, gerisi kendiliğinden akar."
    >
      <Button
        variant="gradient"
        title="Yeni Grup Oluştur"
        onPress={() => router.push("/create-group")}
      />
      <BouncyButton onPress={() => router.push("/join-group")} style={styles.link}>
        <Typography variant="bodySmall" color={colors.secondaryText}>
          Davet kodun mu var?{" "}
          <Typography variant="bodySmall" fontWeight="semibold" color={colors.primary}>
            Gruba katıl
          </Typography>
        </Typography>
      </BouncyButton>
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
