import {
  UIGroupMember as GroupMember,
  useDeleteNickname,
  useGroupMembers,
  useGroupNicknames,
  useLeaveGroup,
  useMutedNotificationsList,
  useRemoveGroupMember,
  useToggleMuteUser,
  useTransferGroupOwnership,
  useUpdateUserAvatar,
  useUpsertNickname,
} from "@/api";
import {
  NicknameBottomSheet,
  TransferOwnershipBottomSheet,
} from "@/components/bottomsheets";
// Added useBottomSheet import
import { AvatarSelector, BaseLayout, Typography } from "@/components/shared";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
// Removed Contexts
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore"; // Added Store
import { getAvatarSource } from "@/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManageMembersScreen() {
  const { colors } = useTheme();
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const router = useRouter();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

  const [avatarSelectorVisible, setAvatarSelectorVisible] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useGroupMembers(
    selectedGroup?.id || "",
  );
  const { data: nicknames = [] } = useGroupNicknames(selectedGroup?.id || "");
  const { data: mutedUsers = [] } = useMutedNotificationsList(user?.id || "");

  const upsertNickname = useUpsertNickname();
  const deleteNickname = useDeleteNickname();
  const toggleMute = useToggleMuteUser();
  const transferOwnership = useTransferGroupOwnership();
  const leaveGroup = useLeaveGroup();
  const updateAvatar = useUpdateUserAvatar();

  const isOwner = selectedGroup?.owner_id === user?.id;
  const mutedUserIds = new Set(mutedUsers.map((m: any) => m.muted_user_id));

  // Kullanıcının nickname'ini bul (mevcut kullanıcı için)
  const getNicknameForUser = (targetUserId: string) => {
    const nickname = nicknames.find(
      (n) => n.setter_user_id === user?.id && n.target_user_id === targetUserId,
    );
    return nickname?.nickname;
  };

  // Kullanıcı sessize alınmış mı?
  const isMuted = (targetUserId: string) => {
    return mutedUserIds.has(targetUserId);
  };

  const handleNicknamePress = (member: GroupMember) => {
    const currentNickname = getNicknameForUser(member.id);

    openBottomSheet(
      <NicknameBottomSheet
        member={member}
        currentNickname={currentNickname}
        onSave={async (nickname) => {
          if (!user?.id || !selectedGroup?.id) return;

          if (nickname.trim()) {
            await upsertNickname.mutateAsync({
              group_id: selectedGroup.id,
              setter_user_id: user.id,
              target_user_id: member.id,
              nickname: nickname.trim(),
            });
          } else {
            await deleteNickname.mutateAsync({
              groupId: selectedGroup.id,
              setterUserId: user.id,
              targetUserId: member.id,
            });
          }
          closeBottomSheet();
        }}
        onDelete={
          currentNickname
            ? async () => {
                if (!user?.id || !selectedGroup?.id) return;
                await deleteNickname.mutateAsync({
                  groupId: selectedGroup.id,
                  setterUserId: user.id,
                  targetUserId: member.id,
                });
                closeBottomSheet();
              }
            : undefined
        }
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["45%"] },
    );
  };

  const handleToggleMute = async (member: GroupMember) => {
    if (!user?.id) return;

    const currentlyMuted = isMuted(member.id);

    try {
      await toggleMute.mutateAsync({
        muterUserId: user.id,
        mutedUserId: member.id,
        isCurrentlyMuted: currentlyMuted,
      });
    } catch (error) {
      console.error("Sessize alma hatası:", error);
      Alert.alert("Hata", "İşlem başarısız oldu");
    }
  };

  const handleTransferOwnership = (member: GroupMember) => {
    if (!selectedGroup?.id || !isOwner) return;

    openBottomSheet(
      <TransferOwnershipBottomSheet
        member={member}
        groupName={selectedGroup.name}
        onConfirm={async () => {
          try {
            await transferOwnership.mutateAsync({
              groupId: selectedGroup.id,
              newOwnerId: member.id,
            });
            closeBottomSheet();
            Alert.alert("Başarılı", "Yöneticilik devredildi");
            // Artık yönetici olmadığımız için home'a replace ile git
            router.replace("/(drawer)/home");
          } catch (error) {
            console.error("Yöneticilik devri hatası:", error);
            Alert.alert("Hata", "Yöneticilik devredilemedi");
          }
        }}
        onCancel={closeBottomSheet}
      />,
      { snapPoints: ["55%"] },
    );
  };

  const handleAvatarSelect = async (avatar: string | null) => {
    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    try {
      await updateAvatar.mutateAsync(avatar);
      Alert.alert("Başarılı", "Avatar güncellendi");
    } catch (error: any) {
      console.error("Avatar güncelleme hatası:", error);
      const errorMessage = error?.message || "Avatar güncellenemedi";
      Alert.alert("Hata", errorMessage);
    }
  };

  const removeMember = useRemoveGroupMember();

  const handleRemoveMember = async (member: GroupMember) => {
    if (!selectedGroup?.id || !isOwner) return;

    if (member.id === user?.id) {
      // Kendini çıkarma
      Alert.alert(
        "Gruptan Ayrıl",
        "Gruptan ayrılmak istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Ayrıl",
            style: "destructive",
            onPress: async () => {
              try {
                await leaveGroup.mutateAsync(selectedGroup.id); // Fixed: pass only groupId
                // Gruptan ayrıldığımız için home'a replace ile git
                router.replace("/(drawer)/home");
              } catch (error) {
                console.error("Gruptan ayrılma hatası:", error);
                Alert.alert("Hata", "Gruptan ayrılamadınız");
              }
            },
          },
        ],
      );
    } else {
      // Başkasını çıkarma (sadece owner)
      Alert.alert(
        "Üyeyi Çıkar",
        `${member.displayName || member.customId} kullanıcısını gruptan çıkarmak istediğinize emin misiniz?`,
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Çıkar",
            style: "destructive",
            onPress: async () => {
              try {
                await removeMember.mutateAsync({
                  groupId: selectedGroup.id,
                  userId: member.id,
                });
                Alert.alert("Başarılı", "Üye gruptan çıkarıldı");
              } catch (error) {
                console.error("Üye çıkarma hatası:", error);
                Alert.alert("Hata", "Üye çıkarılamadı");
              }
            },
          },
        ],
      );
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
              Üyeleri Yönet
            </Typography>
          ),
          backgroundColor: colors.background,
        }}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <Typography variant="h6" style={styles.emptyText}>
            Lütfen bir grup seçin
          </Typography>
        </View>
      </BaseLayout>
    );
  }

  if (membersLoading) {
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
              Üyeleri Yönet
            </Typography>
          ),
          backgroundColor: colors.background,
        }}
      >
        <View
          style={[
            styles.container,
            styles.centerContent,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </BaseLayout>
    );
  }

  const renderMemberItem = ({ item }: { item: GroupMember }) => {
    // GroupMember now has flatten properties or includes user info
    // Assuming backend returns member merged with user info in GroupMember type or has user property
    // Checking api/groups.ts: GroupMember has id, displayName, photoUrl, customId
    // It does NOT have 'user' property or 'user_id' property in the interface I defined earlier.
    // However, if backend returns membership (UserGroup), it might differ.
    // The hook useGroupMembers calls /groups/:id/members.
    // In api/groups.ts I defined GroupMember as { id, displayName, ... }.

    // I shall align usage with GroupMember interface
    // Let's assume item.id is the User ID for now as per my simpler interface definition.

    const isMemberOwner = selectedGroup?.owner_id === item.id;
    const isCurrentUser = item.id === user?.id;
    const nickname = getNicknameForUser(item.id);
    const muted = isMuted(item.id);

    return (
      <View
        style={[
          styles.memberCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.stroke,
          },
        ]}
      >
        <View style={styles.memberHeader}>
          <View style={styles.memberLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={getAvatarSource(item.photoUrl)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.memberInfo}>
              <Typography
                variant="body"
                fontWeight="semibold"
                style={styles.memberName}
              >
                {nickname || item.displayName || item.customId || "Unknown"}
              </Typography>
              {nickname && (
                <Typography
                  variant="caption"
                  style={[
                    styles.memberSubtext,
                    { color: colors.secondaryText },
                  ]}
                >
                  {item.displayName || item.customId}
                </Typography>
              )}
              <View style={styles.badges}>
                {isMemberOwner && (
                  <Typography
                    variant="caption"
                    style={[styles.badge, { color: colors.primary }]}
                  >
                    Yönetici
                  </Typography>
                )}
                {muted && (
                  <Typography
                    variant="caption"
                    style={[styles.badge, { color: colors.error }]}
                  >
                    Sessize Alındı
                  </Typography>
                )}
              </View>
            </View>
          </View>
          {isCurrentUser && (
            <TouchableOpacity
              onPress={() => setAvatarSelectorVisible(true)}
              style={[
                styles.avatarEditButton,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="camera" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.memberActions}>
          {/* Nickname */}
          <TouchableOpacity
            onPress={() => handleNicknamePress(item)}
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Typography variant="bodySmall" style={{ color: colors.primary }}>
              {nickname ? "✏️" : "➕"} Takma Ad
            </Typography>
          </TouchableOpacity>

          {/* Sessize Al/Kaldır */}
          <TouchableOpacity
            onPress={() => handleToggleMute(item)}
            style={[
              styles.actionButton,
              {
                backgroundColor: muted
                  ? colors.error + "20"
                  : colors.secondary + "20",
              },
            ]}
          >
            <Typography
              variant="bodySmall"
              style={{ color: muted ? colors.error : colors.secondary }}
            >
              {muted ? "🔇 Aç" : "🔕 Sessize Al"}
            </Typography>
          </TouchableOpacity>

          {/* Yöneticilik Devri (sadece owner, kendisi hariç) */}
          {isOwner && !isCurrentUser && !isMemberOwner && (
            <TouchableOpacity
              onPress={() => handleTransferOwnership(item)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Typography variant="bodySmall" style={{ color: colors.warning }}>
                👑 Yönetici Yap
              </Typography>
            </TouchableOpacity>
          )}

          {/* Üyeyi Çıkar (sadece owner veya kendisi) */}
          {(isOwner || isCurrentUser) && (
            <TouchableOpacity
              onPress={() => handleRemoveMember(item)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.error + "20" },
              ]}
            >
              <Typography variant="bodySmall" style={{ color: colors.error }}>
                {isCurrentUser ? "🚪 Ayrıl" : "❌ Çıkar"}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
            Üyeleri Yönet
          </Typography>
        ),
        backgroundColor: colors.background,
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Typography variant="body" style={styles.emptyText}>
                Grupta üye yok
              </Typography>
            </View>
          }
        />

        {/* Avatar Selector Modal - Bu kalsın çünkü AvatarSelector zaten mevcut bir component */}
        <AvatarSelector
          visible={avatarSelectorVisible}
          currentAvatar={user?.photoUrl}
          onSelect={handleAvatarSelect}
          onClose={() => setAvatarSelectorVisible(false)}
        />
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  memberCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    marginBottom: 2,
  },
  memberSubtext: {
    marginBottom: 4,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    fontWeight: "600",
  },
  memberActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 32,
  },
});
