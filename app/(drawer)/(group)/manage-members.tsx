import {
  useGroupSession,
  useLeaveGroup,
  useRemoveGroupMember,
  useUpdateUserAvatar,
} from "@/api";
import type { GroupMemberEntry } from "@/api/types";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { ConfirmSheet } from "@/components/bottomsheets";
import { AvatarSelector, BaseLayout, Typography } from "@/components/shared";
import { Avatar, IconButton } from "@/components/ui";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";

const CONFIRM_SHEET_HEIGHT = 340;

interface MemberRow extends GroupMemberEntry {
  id: string; // userId
  isOnline: boolean;
}

export default function ManageMembersScreen() {
  const { colors } = useTheme();
  const { user, currentGroupId, groups, session } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const router = useRouter();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();

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

  const openAvatarPicker = () => {
    if (!user?.id) return;
    openBottomSheet(
      <AvatarSelector
        currentAvatar={user.photoUrl}
        name={user.displayName}
        seed={user.id}
        onCancel={closeBottomSheet}
        onSelect={async (avatar) => {
          try {
            await updateAvatar.mutateAsync(avatar);
            closeBottomSheet();
          } catch (error: any) {
            closeBottomSheet();
            console.error("Avatar güncelleme hatası:", error);
            Alert.alert("Hata", error?.message || "Avatar güncellenemedi");
          }
        }}
      />,
      { snapPoints: ["90%"], scrollable: true },
    );
  };

  /** Admin: üyeyi gruptan çıkarır — değişiklik herkese canlı yansır. */
  const handleRemoveMember = (member: MemberRow) => {
    if (!selectedGroup?.id || !isOwner) return;
    const name = member.displayName || member.customId;

    openBottomSheet(
      <ConfirmSheet
        icon="person-remove-outline"
        title="Üyeyi Çıkar"
        message={`${name}, "${selectedGroup.name}" grubundan çıkarılacak. Tekrar katılmak için yeniden davet gerekir.`}
        confirmLabel="Çıkar"
        destructive
        onCancel={closeBottomSheet}
        onConfirm={async () => {
          try {
            await removeMember.mutateAsync({
              groupId: selectedGroup.id,
              userId: member.id,
            });
            closeBottomSheet();
          } catch (error: any) {
            closeBottomSheet();
            const backendMessage = error?.response?.data?.message;
            Alert.alert(
              "Hata",
              (Array.isArray(backendMessage)
                ? backendMessage[0]
                : backendMessage) || "Üye çıkarılamadı",
            );
          }
        }}
      />,
      { snapPoints: [CONFIRM_SHEET_HEIGHT] },
    );
  };

  // Kural: admin gruptan ayrılamaz — önce tüm üyeleri çıkarmalı.
  // Grupta yalnızsa ayrılmak grubu tamamen siler.
  const otherMemberCount = members.filter((m) => m.id !== user?.id).length;

  const handleLeaveGroup = () => {
    if (!selectedGroup?.id) return;

    if (isOwner && otherMemberCount > 0) {
      openBottomSheet(
        <ConfirmSheet
          icon="information-circle-outline"
          title="Önce üyeleri çıkar"
          message="Grup yöneticisi olarak gruptan ayrılamazsın. Önce tüm üyeleri gruptan çıkarmalısın."
          confirmLabel="Anladım"
          cancelLabel="Kapat"
          onCancel={closeBottomSheet}
          onConfirm={closeBottomSheet}
        />,
        { snapPoints: [CONFIRM_SHEET_HEIGHT] },
      );
      return;
    }

    const deletesGroup = isOwner;
    openBottomSheet(
      <ConfirmSheet
        icon={deletesGroup ? "trash-outline" : "exit-outline"}
        title={deletesGroup ? "Grubu Sil" : "Gruptan Ayrıl"}
        message={
          deletesGroup
            ? `Grupta başka üye yok — ayrıldığında "${selectedGroup.name}" kalıcı olarak silinecek.`
            : `"${selectedGroup.name}" grubundan ayrılacaksın. Geri dönmek için yeniden davet gerekir.`
        }
        confirmLabel={deletesGroup ? "Grubu Sil" : "Ayrıl"}
        destructive
        onCancel={closeBottomSheet}
        onConfirm={async () => {
          try {
            await leaveGroup.mutateAsync(selectedGroup.id);
            closeBottomSheet();
            router.replace("/(drawer)/home");
          } catch (error: any) {
            closeBottomSheet();
            const backendMessage = error?.response?.data?.message;
            Alert.alert(
              "Hata",
              (Array.isArray(backendMessage)
                ? backendMessage[0]
                : backendMessage) || "Gruptan ayrılamadınız",
            );
          }
        }}
      />,
      { snapPoints: [CONFIRM_SHEET_HEIGHT] },
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
              <Avatar
                photoUrl={item.photoUrl}
                name={item.displayName}
                seed={item.id}
                size={40}
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
            <IconButton
              icon="color-palette-outline"
              variant="tonal"
              size={36}
              iconSize={18}
              onPress={openAvatarPicker}
            />
          )}
          {/* Admin, diğer üyeleri çıkarabilir */}
          {isOwner && !isCurrentUser && (
            <IconButton
              icon="person-remove-outline"
              variant="ghost"
              size={36}
              iconSize={18}
              color={colors.error}
              disabled={removeMember.isPending}
              onPress={() => handleRemoveMember(item)}
            />
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
            <BouncyButton
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
            </BouncyButton>
          }
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
    padding: layout.screenPadding,
    paddingBottom: 100,
  },
  memberCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
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
    marginRight: spacing.md,
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
