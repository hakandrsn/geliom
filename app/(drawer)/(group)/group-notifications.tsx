import {
  resolveNotificationPrefs,
  useGroupSession,
  useUpdateGroupNotifications,
} from "@/api";
import { BaseLayout, Typography } from "@/components/shared";
import { Avatar, ListItem } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";

/**
 * Bu grup için bildirim tercihlerim:
 *  1) Gruptan bildirim al (ana anahtar)
 *  2) Tür: durum değişiklikleri / ruh hali değişiklikleri
 *  3) Kişiler: belirli üyelerin değişikliklerini bildirme
 * Kaynak: aktif session'daki üyelik kaydı (patch'ler canlı gelir).
 */
export default function GroupNotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { currentGroupId, groups, user, session } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const update = useUpdateGroupNotifications();

  useGroupSession(selectedGroup?.id);

  const hasSession = !!session && session.group.id === selectedGroup?.id;
  const myMembership =
    hasSession && user ? session!.group.members[user.id] : undefined;
  const prefs = resolveNotificationPrefs(myMembership);

  const otherMembers = useMemo(() => {
    if (!hasSession || !session) return [];
    return Object.entries(session.group.members)
      .filter(([id]) => id !== user?.id)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) =>
        (a.displayName || a.customId).localeCompare(b.displayName || b.customId, "tr"),
      );
  }, [hasSession, session, user?.id]);

  const apply = async (changes: {
    enabled?: boolean;
    statusUpdates?: boolean;
    moodUpdates?: boolean;
    mutedUserIds?: string[];
  }) => {
    if (!selectedGroup) return;
    try {
      await update.mutateAsync({ groupId: selectedGroup.id, ...changes });
    } catch (e: any) {
      Alert.alert("Hata", e?.message || "Ayar kaydedilemedi");
    }
  };

  const toggleMember = (memberId: string, notify: boolean) => {
    const next = notify
      ? prefs.mutedUserIds.filter((id) => id !== memberId)
      : [...prefs.mutedUserIds, memberId];
    void apply({ mutedUserIds: next });
  };

  const switchColors = {
    trackColor: { false: colors.stroke, true: colors.passiveState },
  };
  const thumb = (on: boolean) => (on ? colors.primary : colors.white);
  const typesDisabled = !prefs.enabled;

  return (
    <BaseLayout
      headerShow
      backgroundColor={colors.background}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: (
          <Typography variant="h5" color={colors.text}>
            Grup Bildirimleri
          </Typography>
        ),
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {selectedGroup && (
          <Typography variant="bodySmall" color={colors.secondaryText} style={styles.intro}>
            {`Bu ayarlar yalnızca senin için ve yalnızca "${selectedGroup.name}" grubu için geçerli.`}
          </Typography>
        )}

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          GENEL
        </Typography>
        <ListItem
          icon={prefs.enabled ? "notifications" : "notifications-off-outline"}
          iconColor={colors.text}
          title="Bu gruptan bildirim al"
          subtitle={prefs.enabled ? "Açık" : "Kapalı — aşağıdaki ayarlar devre dışı"}
          right={
            <Switch
              value={prefs.enabled}
              onValueChange={(v) => void apply({ enabled: v })}
              {...switchColors}
              thumbColor={thumb(prefs.enabled)}
            />
          }
        />

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          NE ZAMAN
        </Typography>
        <ListItem
          icon="chatbubble-ellipses-outline"
          iconColor={colors.text}
          title="Durum değişince"
          subtitle="“İşte”, “Yolda” gibi durum güncellemeleri"
          disabled={typesDisabled}
          right={
            <Switch
              value={prefs.enabled && prefs.statusUpdates}
              disabled={typesDisabled}
              onValueChange={(v) => void apply({ statusUpdates: v })}
              {...switchColors}
              thumbColor={thumb(prefs.enabled && prefs.statusUpdates)}
            />
          }
        />
        <ListItem
          icon="happy-outline"
          iconColor={colors.text}
          title="Ruh hali değişince"
          subtitle="“Yorgun”, “Enerjik” gibi his güncellemeleri"
          disabled={typesDisabled}
          right={
            <Switch
              value={prefs.enabled && prefs.moodUpdates}
              disabled={typesDisabled}
              onValueChange={(v) => void apply({ moodUpdates: v })}
              {...switchColors}
              thumbColor={thumb(prefs.enabled && prefs.moodUpdates)}
            />
          }
        />

        <Typography variant="label" fontWeight="semibold" color={colors.secondaryText} style={styles.sectionTitle}>
          KİMDEN
        </Typography>
        {otherMembers.length === 0 ? (
          <Typography variant="bodySmall" color={colors.lightText} style={styles.empty}>
            Grupta henüz başka üye yok.
          </Typography>
        ) : (
          otherMembers.map((m) => {
            const notify = !prefs.mutedUserIds.includes(m.id);
            const name = m.displayName || m.customId;
            return (
              <View key={m.id} style={[styles.memberRow, typesDisabled && styles.dimmed]}>
                <Avatar photoUrl={m.photoUrl} name={m.displayName} seed={m.id} size={36} />
                <View style={styles.memberText}>
                  <Typography variant="body" fontWeight="medium" color={colors.text} numberOfLines={1}>
                    {name}
                  </Typography>
                  <Typography variant="caption" color={colors.lightText}>
                    {notify ? "Bildirim gelir" : "Sessizde"}
                  </Typography>
                </View>
                <Switch
                  value={prefs.enabled && notify}
                  disabled={typesDisabled}
                  onValueChange={(v) => toggleMember(m.id, v)}
                  {...switchColors}
                  thumbColor={thumb(prefs.enabled && notify)}
                />
              </View>
            );
          })
        )}

        <View style={styles.footnote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.lightText} />
          <Typography variant="caption" color={colors.lightText} style={styles.footnoteText}>
            Bildirimler, biri durumunu değiştirdikten 15 saniye sonra ve yalnızca uygulama kapalıyken gelir. Tüm grupları tek yerden yönetmek için Ayarlar › Bildirimler.
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
  intro: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  empty: {
    paddingVertical: spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: layout.touchTarget + spacing.md,
    paddingVertical: spacing.xs,
  },
  memberText: {
    flex: 1,
    gap: 2,
  },
  dimmed: {
    opacity: 0.5,
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
