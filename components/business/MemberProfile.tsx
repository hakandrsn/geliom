import { useGroupDashboardData } from "@/api/dashboard";
import { resolveNotificationPrefs, useUpdateGroupNotifications } from "@/api/groups";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Button, Typography } from "@/components/shared";
import { Avatar, Card, Emoji, EmptyState, ListItem, Skeleton } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, View } from "react-native";

function updatedLabel(value: string | undefined, now: number) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
  if (minutes < 1) return "Az önce güncellendi";
  if (minutes < 60) return `${minutes} dakika önce güncellendi`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce güncellendi`;
  return `${date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihinde güncellendi`;
}

export default function MemberProfile({ groupId, userId }: { groupId: string; userId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { session, groups, user } = useAppStore();
  const { data: members } = useGroupDashboardData(groupId);
  const update = useUpdateGroupNotifications();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [pendingNotify, setPendingNotify] = useState<boolean | null>(null);
  const group = session?.group.id === groupId ? session.group : undefined;
  const summary = groups.find((entry) => entry.id === groupId);
  const member = members.find((entry) => entry.userId === userId);
  const membership = user && group?.members[user.id];
  const prefs = summary?.notifications ?? resolveNotificationPrefs(membership || undefined);
  const notify = pendingNotify ?? !prefs.mutedUserIds.includes(userId);
  const unavailable = !groupId || !userId || !summary || (!!group && !member);
  const paused = !!group?.isPaused;
  const disabled = update.isPending || !prefs.enabled || paused || !membership;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = async (enabled: boolean) => {
    if (disabled) return;
    setPendingNotify(enabled);
    try {
      await update.mutateAsync({
        groupId,
        mutedUserIds: enabled
          ? prefs.mutedUserIds.filter((id) => id !== userId)
          : [...new Set([...prefs.mutedUserIds, userId])],
      });
    } catch {
      Alert.alert("Kaydedilemedi", "Bildirim tercihin değiştirilemedi. Tekrar deneyebilirsin.");
    } finally {
      setPendingNotify(null);
    }
  };

  const copyCode = async () => {
    if (!member?.customId) return;
    try {
      await Clipboard.setStringAsync(member.customId);
      setCopiedCode(member.customId);
    } catch {
      Alert.alert("Kopyalanamadı", "Kullanıcı kodunu kopyalayamadık. Tekrar deneyebilirsin.");
    }
  };

  if (unavailable) return (
    <EmptyState fullScreen icon="person-outline" title="Üyeye ulaşılamıyor"
      description="Bu kişi artık grupta olmayabilir. Üye listesinden devam edebilirsin.">
      <Button title="Ana sayfaya dön" onPress={() => router.replace("/(drawer)/home")} />
    </EmptyState>
  );

  if (!member || !group) return (
    <View style={styles.content}>
      <View style={styles.identity}>
        <Skeleton circle height={layout.touchTarget * 2} />
        <Skeleton width="55%" height={spacing.xxxl} />
        <Skeleton width="35%" />
      </View>
      <Skeleton height={layout.touchTarget * 4} />
      <Skeleton height={layout.touchTarget * 2} />
    </View>
  );

  const copied = !!member.customId && copiedCode === member.customId;
  const timestamp = updatedLabel(member.updatedAt, now);
  const name = member.displayName || member.customId || "Grup üyesi";
  const role = group.ownerId === userId ? "Grup sahibi" : member.role === "ADMIN" ? "Yönetici" : "Grup üyesi";
  const notice = paused
    ? "Bu grup duraklatıldığı için bildirim gönderilmiyor."
    : !prefs.enabled
      ? "Grup bildirimlerin kapalı. Kişi tercihini değiştirmek için önce grup bildirimlerini aç."
      : user?.pushEnabled === false
        ? "Uygulama bildirimlerin kapalı. Bu tercih saklanır; bildirim almak için Ayarlar’dan bildirimleri aç."
        : !prefs.statusUpdates && !prefs.moodUpdates
          ? "Durum ve ruh hali bildirimlerin kapalı. Bildirim almak için grup ayarlarından en az birini aç."
          : "Bu tercih yalnızca senin için ve bu grupta geçerli.";

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.identity}>
        <View style={[styles.avatarHalo, { backgroundColor: colors.passiveState }]}>
          <Avatar photoUrl={member.photoUrl} name={name} seed={userId}
            size={layout.touchTarget * 2} badge={member.moodEmoji} />
        </View>
        <Typography variant="h2" color={colors.text} style={styles.center}>{name}</Typography>
        {member.customId && (
          <BouncyButton onPress={() => void copyCode()} style={styles.code}>
            <Typography variant="bodySmall" color={colors.secondaryText}>
              {copied ? "Kullanıcı kodu kopyalandı" : `@${member.customId}`}
            </Typography>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={spacing.lg} color={colors.primary} />
          </BouncyButton>
        )}
        <View style={[styles.role, { backgroundColor: colors.passiveState }]}>
          <Ionicons name={group.ownerId === userId ? "ribbon-outline" : "people-outline"}
            size={spacing.lg} color={colors.primary} />
          <Typography variant="caption" color={colors.primary} fontWeight="semibold">{role}</Typography>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Typography variant="h5" color={colors.text}>Şu sıralar</Typography>
        <Typography variant="caption" color={colors.secondaryText}>{group.name} grubunda</Typography>
      </View>
      <Card padding={spacing.xl}>
        {!member.statusText && !member.moodText ? (
          <EmptyState icon="leaf-outline" title="Henüz bir paylaşım yok"
            description="Durumunu veya ruh halini paylaştığında burada görebilirsin." />
        ) : (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.passiveState }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={spacing.xxl} color={colors.primary} />
              </View>
              <View style={styles.detailText}>
                <Typography variant="caption" color={colors.secondaryText}>Ne yapıyor?</Typography>
                <Typography variant="bodyLarge" fontWeight="semibold" color={member.statusText ? colors.text : colors.lightText}>
                  {member.statusText || "Henüz durum paylaşmadı"}
                </Typography>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.stroke }]} />
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.passiveState }]}>
                {member.moodEmoji ? <Emoji size={spacing.xxl}>{member.moodEmoji}</Emoji>
                  : <Ionicons name="happy-outline" size={spacing.xxl} color={colors.primary} />}
              </View>
              <View style={styles.detailText}>
                <Typography variant="caption" color={colors.secondaryText}>Nasıl hissediyor?</Typography>
                <Typography variant="bodyLarge" fontWeight="semibold" color={member.moodText ? colors.text : colors.lightText}>
                  {member.moodText || "Henüz ruh hali paylaşmadı"}
                </Typography>
              </View>
            </View>
            {timestamp && <View style={styles.time}>
              <Ionicons name="time-outline" size={spacing.lg} color={colors.lightText} />
              <Typography variant="caption" color={colors.lightText}>{timestamp}</Typography>
            </View>}
          </View>
        )}
      </Card>

      {userId !== user?.id && <View style={styles.notifications}>
        <Typography variant="h5" color={colors.text}>Haberin olsun mu?</Typography>
        <ListItem icon={notify ? "notifications-outline" : "notifications-off-outline"}
          title="Bu kişiden bildirim al" subtitle={notify ? "Kişi tercihin açık" : "Bu kişiyi sessize aldın"}
          right={<Switch accessibilityLabel="Bu grupta bu kişiden bildirim al"
            value={notify} disabled={disabled} onValueChange={(value) => void toggleNotifications(value)}
            trackColor={{ false: colors.stroke, true: colors.passiveState }}
            thumbColor={notify ? colors.primary : colors.white} />}
        />
        <Typography variant="caption" color={colors.secondaryText}>{notice}</Typography>
      </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, paddingBottom: spacing.xxxl, gap: spacing.lg },
  identity: { alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  avatarHalo: { padding: spacing.md, borderRadius: radius.full, marginBottom: spacing.sm },
  center: { textAlign: "center" },
  code: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: layout.touchTarget, paddingHorizontal: spacing.md },
  role: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sectionHeading: { gap: spacing.xs },
  details: { gap: spacing.lg },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  detailIcon: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  detailText: { flex: 1, gap: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth },
  time: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  notifications: { paddingTop: spacing.md, gap: spacing.sm },
});
