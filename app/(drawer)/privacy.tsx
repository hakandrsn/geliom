import { BaseLayout, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { loadCrashReportsEnabled, setCrashReportsEnabled } from "@/services/privacy";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { openPrivacyPolicy, openTermsOfUse } from "@/utils/linking";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

/**
 * Gizlilik: ne sakladığımızı açık açık söyler, kullanıcının kontrol
 * edebildiği tek şeyi (hata raporu paylaşımı) sunar ve belgelere götürür.
 */
export default function PrivacyScreen() {
  const { colors } = useTheme();
  const user = useAppStore((state) => state.user);
  const [crashReports, setCrashReports] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadCrashReportsEnabled().then((v) => {
      if (mounted) setCrashReports(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCrashToggle = (value: boolean) => {
    setCrashReports(value);
    void setCrashReportsEnabled(value);
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          NELERİ SAKLIYORUZ
        </Typography>
        <ListItem
          icon="mail-outline"
          iconColor={colors.text}
          title="E-posta adresin"
          subtitle={user?.email ?? "Giriş sağlayıcından alınır; yalnızca hesabını tanımak için"}
        />
        <ListItem
          icon="person-outline"
          iconColor={colors.text}
          title="Görünen adın ve avatarın"
          subtitle="Sadece grup arkadaşlarına gösterilir"
        />
        <ListItem
          icon="chatbubble-ellipses-outline"
          iconColor={colors.text}
          title="Durum ve ruh hali paylaşımların"
          subtitle="Yalnızca o grubun üyeleri görür; geçmiş tutulmaz, son durum saklanır"
        />
        <ListItem
          icon="lock-closed-outline"
          iconColor={colors.text}
          title="Şifre saklamayız"
          subtitle="Giriş Google veya Apple hesabınla yapılır"
        />

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          TERCİHLER
        </Typography>
        <ListItem
          icon="pulse-outline"
          iconColor={colors.text}
          title="Hata raporlarını paylaş"
          subtitle="Çökme ve hata kayıtları, uygulamayı iyileştirmek için kişisel veri içermeden gönderilir"
          right={
            <Switch
              value={crashReports}
              onValueChange={handleCrashToggle}
              trackColor={{ false: colors.stroke, true: colors.passiveState }}
              thumbColor={crashReports ? colors.primary : colors.white}
            />
          }
        />

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          BELGELER
        </Typography>
        <ListItem
          icon="shield-checkmark-outline"
          iconColor={colors.text}
          title="Gizlilik Politikası"
          onPress={openPrivacyPolicy}
        />
        <ListItem
          icon="document-text-outline"
          iconColor={colors.text}
          title="Kullanım Şartları"
          onPress={openTermsOfUse}
        />

        <View style={styles.footnote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.lightText} />
          <Typography variant="caption" color={colors.lightText} style={styles.footnoteText}>
            Verilerini tamamen silmek istersen Ayarlar ekranının en altındaki Tehlikeli Bölge’den hesabını silebilirsin. Silme işlemi geri alınamaz.
          </Typography>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: layout.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  footnote: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingRight: spacing.lg,
  },
  footnoteText: {
    flex: 1,
  },
});
