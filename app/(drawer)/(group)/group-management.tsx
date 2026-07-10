import {
  useCreateCustomStatus,
  useCreateMood,
  useGroupJoinRequests,
  useGroupSession,
  useMuteGroup,
  useUpdateGroup,
} from "@/api";
import {
  ConfirmSheet,
  GroupNameBottomSheet,
  StatusMoodBottomSheet,
} from "@/components/bottomsheets";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { ListItem } from "@/components/ui";
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

  const createMood = useCreateMood();
  const createCustomStatus = useCreateCustomStatus();
  const muteGroup = useMuteGroup();

  // Ekran açıkken session'ı canlı tut (mute durumu session'dan okunur)
  useGroupSession(selectedGroup?.id);

  const isOwner = selectedGroup?.ownerId === user?.id;

  // Kendi üyeliğimin mute durumu aktif session'dan okunur
  const myMembership =
    session && user && session.group.id === selectedGroup?.id
      ? session.group.members[user.id]
      : undefined;
  const isGroupMuted = myMembership?.isMuted ?? false;

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

  // Custom status'ler bu gruba özel, lokal tutulur (bkz. useCustomStatuses)
  const handleCreateStatus = () => {
    if (!user?.id) return;
    openBottomSheet(
      <StatusMoodBottomSheet
        type="status"
        onSave={async (text, emoji) => {
          try {
            await createCustomStatus.mutateAsync({
              userId: user.id,
              groupId: selectedGroup.id,
              text,
              emoji: emoji || undefined,
            });
            closeBottomSheet();
            Alert.alert("Başarılı", "Özel durum eklendi");
          } catch (e: any) {
            Alert.alert("Hata", e.message || "Durum eklenemedi");
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["55%"] },
    );
  };

  // Alert.prompt iOS-only olduğu için bottom sheet kullanılır (Android desteği)
  const handleCreateMood = () => {
    openBottomSheet(
      <StatusMoodBottomSheet
        type="mood"
        onSave={async (text, emoji) => {
          createMood.mutate(
            {
              groupId: selectedGroup.id,
              data: {
                text,
                emoji: emoji || "✨",
                mood: text.toLowerCase().replace(/\s/g, "_"),
              },
            },
            {
              onSuccess: () => Alert.alert("Başarılı", "Mood eklendi"),
              onError: (e: any) => {
                const backendMessage = e?.response?.data?.message;
                Alert.alert(
                  "Hata",
                  (Array.isArray(backendMessage)
                    ? backendMessage[0]
                    : backendMessage) ||
                    e.message ||
                    "Mood eklenemedi",
                );
              },
            },
          );
          closeBottomSheet();
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["50%"] },
    );
  };

  // Alert yerine ortak onay sheet'i — grup adı bağlam olarak gösterilir
  const handleMuteToggle = () => {
    const next = !isGroupMuted;
    openBottomSheet(
      <ConfirmSheet
        icon={next ? "notifications-off-outline" : "notifications-outline"}
        title={next ? "Grubu Sessize Al" : "Sessize Almayı Kaldır"}
        message={
          next
            ? `"${selectedGroup.name}" grubundan gelen bildirimler kapatılacak. Devam etmek istiyor musun?`
            : `"${selectedGroup.name}" grubundan gelen bildirimler tekrar açılacak. Devam etmek istiyor musun?`
        }
        confirmLabel={next ? "Sessize Al" : "Bildirimleri Aç"}
        destructive={next}
        onConfirm={async () => {
          try {
            await muteGroup.mutateAsync({
              groupId: selectedGroup.id,
              isMuted: next,
            });
            closeBottomSheet();
          } catch (e: any) {
            closeBottomSheet();
            Alert.alert("Hata", e.message || "İşlem başarısız oldu");
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["40%"] },
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

            {/* Özel Durum Ekle */}
            <ListItem
              icon="add-circle-outline"
              title="Özel Durum Ekle"
              subtitle="Gruba özel durum oluştur"
              premium
              onPress={handleCreateStatus}
            />

            {/* Özel Mood Ekle */}
            <ListItem
              icon="happy-outline"
              title="Özel Mood Ekle"
              subtitle="Gruba özel mood oluştur"
              premium
              onPress={handleCreateMood}
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

          {/* Sıralama */}
          <ListItem
            icon="swap-vertical-outline"
            title="Sıralama"
            subtitle="Status ve mood sırasını düzenle"
            onPress={() => router.push("/(drawer)/(group)/reorder-status-mood")}
          />

          {/* Grubu Sessize Al — herkes kendi bildirimini yönetir */}
          <ListItem
            icon={
              isGroupMuted
                ? "notifications-outline"
                : "notifications-off-outline"
            }
            iconColor={colors.error}
            title={isGroupMuted ? "Sessize Almayı Kaldır" : "Grubu Sessize Al"}
            subtitle={isGroupMuted ? "Bildirimleri aç" : "Bildirimleri kapat"}
            onPress={handleMuteToggle}
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
              subtitle="Üyeleri görüntüle ve düzenle"
              onPress={() => router.push("/(drawer)/(group)/manage-members")}
            />
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
    fontFamily: "Comfortaa-Bold",
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
