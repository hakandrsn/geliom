import { useUpdateGroupNotifications } from "@/api";
import { BaseLayout, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

/**
 * Bildirim ayarları:
 *  - Ana anahtar: cihaz izni + OneSignal aboneliği (tümünü kapat/aç)
 *  - Grup listesi: her grubu ayrı ayrı sessize al (sunucu tarafında mute)
 * Grubun ayrıntılı ayarları grup yönetiminde kalır.
 */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const groups = useAppStore((state) => state.groups);
  const updateNotifications = useUpdateGroupNotifications();
  const {
    isNotificationsEnabled,
    isSystemEnabled,
    toggleNotifications,
    openSettings,
  } = useNotificationSettings();
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const handleGroupToggle = async (groupId: string, enabled: boolean) => {
    setPendingGroupId(groupId);
    try {
      // Optimistic güncelleme ve geri alma mutation içinde
      await updateNotifications.mutateAsync({ groupId, enabled });
    } catch {
      // onError store'u geri aldı
    } finally {
      setPendingGroupId(null);
    }
  };

  const switchColors = {
    trackColor: { false: colors.stroke, true: colors.passiveState },
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          GENEL
        </Typography>
        <ListItem
          icon={isNotificationsEnabled ? "notifications" : "notifications-off-outline"}
          iconColor={colors.text}
          title="Tüm bildirimler"
          subtitle={
            isNotificationsEnabled
              ? "Grup arkadaşların durum değiştirince haber ver"
              : "Kapalı — hiçbir gruptan bildirim gelmez"
          }
          right={
            <Switch
              value={isNotificationsEnabled}
              onValueChange={toggleNotifications}
              {...switchColors}
              thumbColor={isNotificationsEnabled ? colors.primary : colors.white}
            />
          }
        />
        {!isSystemEnabled && (
          <ListItem
            icon="settings-outline"
            iconColor={colors.warning}
            title="Cihaz izni kapalı"
            subtitle="Bildirimler için telefonun ayarlarından Geliom’a izin ver"
            onPress={openSettings}
          />
        )}

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          GRUPLAR
        </Typography>
        {groups.length === 0 ? (
          <Typography variant="bodySmall" color={colors.lightText} style={styles.empty}>
            Henüz bir grubun yok.
          </Typography>
        ) : (
          groups.map((group) => {
            const enabled = group.notifications?.enabled ?? true;
            return (
              <ListItem
                key={group.id}
                icon={enabled ? "people" : "people-outline"}
                iconColor={colors.text}
                title={group.name}
                subtitle={enabled ? "Bildirimler açık" : "Sessizde"}
                disabled={!isNotificationsEnabled}
                right={
                  <Switch
                    value={enabled && isNotificationsEnabled}
                    disabled={!isNotificationsEnabled || pendingGroupId === group.id}
                    onValueChange={(value) => handleGroupToggle(group.id, value)}
                    {...switchColors}
                    thumbColor={enabled && isNotificationsEnabled ? colors.primary : colors.white}
                  />
                }
              />
            );
          })
        )}

        <View style={styles.footnote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.lightText} />
          <Typography variant="caption" color={colors.lightText} style={styles.footnoteText}>
            Durum ve ruh hali ayrımı ile kişi bazlı sessize alma o grubun yönetim ekranındaki "Grup Bildirimleri"nden yapılır. Uygulama açıkken güncellemeleri zaten canlı görürsün; bildirim sadece kapalıyken gelir.
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
  empty: {
    paddingVertical: spacing.md,
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
