import {
  useGroupSession,
  useLeaveGroup,
  useRemoveGroupMember,
  useUpdateUserAvatar,
} from "@/api";
import type { GroupMemberEntry } from "@/api/types";
import { AvatarSelector, BaseLayout, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { getAvatarSource } from "@/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface MemberRow extends GroupMemberEntry {
  id: string; // userId
  isOnline: boolean;
}

export default function ManageMembersScreen() {
  const { colors } = useTheme();
  const { user, currentGroupId, groups, session } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const router = useRouter();

  const [avatarSelectorVisible, setAvatarSelectorVisible] = useState(false);

  const leaveGroup = useLeaveGroup();
  const removeMember = useRemoveGroupMember();
  const updateAvatar = useUpdateUserAvatar();

  // Ekran açıkken session'ı canlı tut (ref-count'lu — home ile paylaşılır)
  useGroupSession(selectedGroup?.id);

  const isOwner = selectedGroup?.ownerId === user?.id;

  // Üye listesi aktif session'dan gelir (members: userId ile key'lenmiş map)
  const hasSession = !!session && session.group.id === selectedGroup?.id;
  const members: MemberRow[] = useMemo(() => {
    if (!hasSession || !session) return [];
    const online = new Set(session.onlineUserIds);
    return Object.entries(session.group.members).map(([userId, member]) => ({
      ...member,
      id: userId,
      isOnline: online.has(userId),
    }));
  }, [hasSession, session]);

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

  /** Admin: üyeyi gruptan çıkarır — değişiklik herkese canlı yansır. */
  const handleRemoveMember = (member: MemberRow) => {
    if (!selectedGroup?.id || !isOwner) return;

    Alert.alert(
      "Üyeyi Çıkar",
      `${member.displayName || member.customId} gruptan çıkarılacak. Emin misiniz?`,
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
            } catch (error: any) {
              const backendMessage = error?.response?.data?.message;
              Alert.alert(
                "Hata",
                (Array.isArray(backendMessage)
                  ? backendMessage[0]
                  : backendMessage) || "Üye çıkarılamadı",
              );
            }
          },
        },
      ],
    );
  };

  // Kural: admin gruptan ayrılamaz — önce tüm üyeleri çıkarmalı.
  // Grupta yalnızsa ayrılmak grubu tamamen siler.
  const otherMemberCount = members.filter((m) => m.id !== user?.id).length;

  const handleLeaveGroup = () => {
    if (!selectedGroup?.id) return;

    if (isOwner && otherMemberCount > 0) {
      Alert.alert(
        "Ayrılamazsınız",
        "Grup yöneticisi olarak gruptan ayrılamazsınız. Önce tüm üyeleri gruptan çıkarmalısınız.",
      );
      return;
    }

    Alert.alert(
      isOwner ? "Grubu Sil" : "Gruptan Ayrıl",
      isOwner
        ? "Grupta başka üye yok — ayrıldığınızda grup kalıcı olarak silinecek. Emin misiniz?"
        : "Gruptan ayrılmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: isOwner ? "Grubu Sil" : "Ayrıl",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGroup.mutateAsync(selectedGroup.id);
              router.replace("/(drawer)/home");
            } catch (error: any) {
              const backendMessage = error?.response?.data?.message;
              Alert.alert(
                "Hata",
                (Array.isArray(backendMessage)
                  ? backendMessage[0]
                  : backendMessage) || "Gruptan ayrılamadınız",
              );
            }
          },
        },
      ],
    );
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

  if (!hasSession) {
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

  const renderMemberItem = ({ item }: { item: MemberRow }) => {
    const isMemberOwner = selectedGroup.ownerId === item.id;
    const isCurrentUser = item.id === user?.id;

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
              {item.isOnline && (
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: colors.success,
                      borderColor: colors.cardBackground,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.memberInfo}>
              <Typography
                variant="body"
                fontWeight="semibold"
                style={styles.memberName}
              >
                {item.displayName || item.customId || "İsimsiz"}
                {isCurrentUser ? " (Sen)" : ""}
              </Typography>
              <Typography
                variant="caption"
                style={[styles.memberSubtext, { color: colors.secondaryText }]}
              >
                @{item.customId}
              </Typography>
              <View style={styles.badges}>
                {isMemberOwner && (
                  <Typography
                    variant="caption"
                    style={[styles.badge, { color: colors.primary }]}
                  >
                    Yönetici
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
                { backgroundColor: colors.passiveState },
              ]}
            >
              <Ionicons name="camera" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {/* Admin, diğer üyeleri çıkarabilir */}
          {isOwner && !isCurrentUser && (
            <TouchableOpacity
              onPress={() => handleRemoveMember(item)}
              disabled={removeMember.isPending}
              style={[
                styles.removeButton,
                { backgroundColor: colors.cardBackground, borderColor: colors.error },
              ]}
            >
              <Ionicons name="person-remove" size={14} color={colors.error} />
              <Typography
                variant="caption"
                fontWeight="semibold"
                style={{ color: colors.error, marginLeft: 4 }}
              >
                Çıkar
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
          ListFooterComponent={
            <TouchableOpacity
              onPress={handleLeaveGroup}
              style={[
                styles.leaveButton,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.error,
                },
              ]}
            >
              <Ionicons
                name={
                  isOwner && otherMemberCount === 0
                    ? "trash-outline"
                    : "exit-outline"
                }
                size={20}
                color={colors.error}
              />
              <Typography
                variant="body"
                fontWeight="semibold"
                style={{ color: colors.error, marginLeft: 8 }}
              >
                {isOwner && otherMemberCount === 0
                  ? "Grubu Sil ve Ayrıl"
                  : "Gruptan Ayrıl"}
              </Typography>
            </TouchableOpacity>
          }
        />

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
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  avatarEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
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
  },
  badge: {
    fontWeight: "600",
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    marginTop: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 32,
  },
});
