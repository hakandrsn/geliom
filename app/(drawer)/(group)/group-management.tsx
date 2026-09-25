import {
  useGroupJoinRequests,
  useGroupSession,
  resolveNotificationPrefs,
  useUpdateGroup,
} from "@/api";
import { fonts } from '@/theme/typography';
import { GroupNameBottomSheet } from "@/components/bottomsheets";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
import { PLAN_LIMITS, groupCapacity } from "@/constants/premium";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function GroupManagementScreen() {
  const { currentGroupId, groups, user, session } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();
  const router = useRouter();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const [isCopying, setIsCopying] = useState(false);

  const updateGroup = useUpdateGroup();


  // Ekran açıkken session'ı canlı tut (mute durumu session'dan okunur)
  useGroupSession(selectedGroup?.id);

  const isOwner = selectedGroup?.ownerId === user?.id;
  const { isPremium, openPaywall } = usePremiumGate();
  const liveGroup =
    session && session.group.id === selectedGroup?.id ? session.group : undefined;
  const memberCount = liveGroup
    ? Object.keys(liveGroup.members).length
    : (selectedGroup?.memberCount ?? 0);
  const capacity = groupCapacity(liveGroup?.ownerIsPremium ?? isPremium);

  // Kendi üyeliğimin mute durumu aktif session'dan okunur
  const myMembership =
    session && user && session.group.id === selectedGroup?.id
      ? session.group.members[user.id]
      : undefined;
  const notificationPrefs = resolveNotificationPrefs(myMembership);
  const notificationSummary = !notificationPrefs.enabled
    ? "Kapalı"
    : [
        notificationPrefs.statusUpdates && notificationPrefs.moodUpdates
          ? "Durum ve ruh hali"
          : notificationPrefs.statusUpdates
            ? "Sadece durum"
            : notificationPrefs.moodUpdates
              ? "Sadece ruh hali"
              : "Tür seçilmedi",
        notificationPrefs.mutedUserIds.length > 0
          ? `${notificationPrefs.mutedUserIds.length} kişi sessizde`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

  // Bekleyen istekler (sadece admin görebilir)
  const { data: joinRequests = [] } = useGroupJoinRequests(
    isOwner && selectedGroup ? selectedGroup.id : "",
  );
  const pendingRequestsCount = joinRequests.length;

  const handleJoinRequestsPress = () => {
    if (selectedGroup) {
      router.push("/(drawer)/(group)/join-requests");
    }
  };

  if (!selectedGroup) {
    return (
      <BaseLayout
        headerShow={true}
        header={{
          leftIcon: {
            icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
            onPress: () => router.back(),
          },
          title: (
            <Typography variant="h5" color={colors.text}>
              Grup Yönetimi
            </Typography>
          ),
          backgroundColor: colors.background,
          style: { borderBottomWidth: 0 },
        }}
      >
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={64}
            color={colors.secondaryText}
          />
          <Typography
            variant="h4"
            color={colors.text}
            style={{ marginTop: 16, marginBottom: 8 }}
          >
            Grup Seçilmedi
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={{ textAlign: "center" }}
          >
            Grup yönetimi için bir grup seçmelisiniz.
          </Typography>
        </View>
      </BaseLayout>
    );
  }

  const copyInviteCode = async () => {
    if (selectedGroup.inviteCode) {
      await Clipboard.setStringAsync(selectedGroup.inviteCode);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleUpdateGroupName = () => {
    if (!isOwner) return;

    openBottomSheet(
      <GroupNameBottomSheet
        currentName={selectedGroup.name}
        onSave={async (name) => {
          try {
            await updateGroup.mutateAsync({
              id: selectedGroup.id,
              updates: { name: name.trim() },
            });
            closeBottomSheet();
            Alert.alert("Başarılı", "Grup adı güncellendi");
          } catch (error: any) {
            console.error("Grup adı güncelleme hatası:", error);
            Alert.alert("Hata", error.message || "Grup adı güncellenemedi");
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["35%"] },
    );
  };

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: (
          <Typography variant="h5" color={colors.text}>
            Grup Yönetimi
          </Typography>
        ),
        rightIcon: isOwner
          ? {
              icon: (
                <View style={styles.rightIconContainer}>
                  <TouchableOpacity
                    onPress={handleJoinRequestsPress}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: colors.cardBackground + "80",
                        borderColor: colors.stroke,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      color={colors.text}
                    />
                    {pendingRequestsCount > 0 && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.error },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          color={colors.white}
                          style={styles.badgeText}
                        >
                          {pendingRequestsCount > 9
                            ? "9+"
                            : pendingRequestsCount}
                        </Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ),
              onPress: handleJoinRequestsPress,
            }
          : undefined,
        backgroundColor: colors.background,
        style: { borderBottomWidth: 0 },
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Davet Kodu — çerçevesiz, sade */}
        <View style={styles.inviteSection}>
          <Typography variant="caption" color={colors.secondaryText}>
            {selectedGroup.name} • Davet Kodu
          </Typography>
          <View style={styles.inviteCodeContainer}>
            <Typography
              variant="h3"
              color={colors.primary}
              style={styles.inviteCode}
            >
              {selectedGroup.inviteCode || "N/A"}
            </Typography>
            <GeliomButton
              state={isCopying ? "active" : "passive"}
              size="small"
              icon={isCopying ? "checkmark" : "copy"}
              onPress={copyInviteCode}
            >
              {isCopying ? "Kopyalandı" : "Kopyala"}
            </GeliomButton>
          </View>
        </View>

        {/* Grup Ayarları (Sadece Owner) */}
        {isOwner && (
          <View style={styles.settingsSection}>
            <Typography
              variant="h5"
              color={colors.text}
              style={styles.sectionTitle}
            >
              Grup Ayarları
            </Typography>

            {/* Grup Adı Değiştir */}
            <ListItem
              icon="pencil-outline"
              title="Grup Adı"
              subtitle={selectedGroup.name}
              onPress={handleUpdateGroupName}
            />

            {/* Durum ve ruh hali listesi — ekle, sil, sürükleyerek sırala */}
            <ListItem
              icon="list-outline"
              title="Durum ve Ruh Halleri"
              subtitle={
                liveGroup
                  ? `${liveGroup.statusOptions.length} durum · ${liveGroup.moodOptions.length} ruh hali`
                  : "Grubun seçeneklerini düzenle"
              }
              premium={!isPremium}
              onPress={() => router.push("/(drawer)/(group)/reorder-status-mood")}
            />
          </View>
        )}

        {/* Kişisel Ayarlar (tüm üyeler) */}
        <View style={styles.settingsSection}>
          <Typography
            variant="h5"
            color={colors.text}
            style={styles.sectionTitle}
          >
            Kişisel Ayarlar
          </Typography>

          {/* Grup Bildirimleri — herkes kendi tercihlerini yönetir */}
          <ListItem
            icon={
              notificationPrefs.enabled
                ? "notifications-outline"
                : "notifications-off-outline"
            }
            title="Grup Bildirimleri"
            subtitle={notificationSummary}
            onPress={() =>
              router.push("/(drawer)/(group)/group-notifications")
            }
          />
        </View>

        {/* Üye Yönetimi — sadece grup sahibi */}
        {isOwner && (
          <View style={styles.actionsContainer}>
            <Typography
              variant="h5"
              color={colors.text}
              style={styles.sectionTitle}
            >
              Üye Yönetimi
            </Typography>

            <ListItem
              icon="people-outline"
              title="Üyeleri Yönet"
              subtitle={`${memberCount}/${capacity} üye`}
              onPress={() => router.push("/(drawer)/(group)/manage-members")}
            />
            {/* Ücretsiz grupta kapasite 5 — sahibi Premium ile 20'ye çıkarabilir */}
            {!isPremium && (
              <ListItem
                icon="rocket-outline"
                title={`Grubu ${PLAN_LIMITS.PREMIUM.MAX_GROUP_MEMBERS} kişiye çıkar`}
                subtitle={
                  memberCount >= capacity
                    ? "Grup dolu — yeni üye katılamıyor"
                    : `Şu an en fazla ${capacity} kişi katılabilir`
                }
                premium
                onPress={() => openPaywall()}
              />
            )}
          </View>
        )}
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  rightIconContainer: {
    position: "relative",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  contentContainer: {
    paddingBottom: 64,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  inviteSection: {
    paddingHorizontal: 4,
    paddingTop: 8,
    marginBottom: 24,
    gap: 4,
  },
  inviteCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteCode: {
    letterSpacing: 2,
    fontFamily: fonts.bold,
  },
  actionsContainer: {
    gap: 12,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
});
