import {
  useApproveJoinRequest,
  useGroupJoinRequests,
  useRejectJoinRequest,
} from "@/api/groups";
import { ConfirmSheet } from "@/components/bottomsheets";
import { BaseLayout, Typography } from "@/components/shared";
import { useBottomSheet } from "@/contexts/BottomSheetContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { getApiErrorMessage, getPremiumLimitCode } from "@/utils/api-error";
// Removed Context imports
import { useTheme } from "@/contexts/ThemeContext";
// import type { GroupJoinRequestWithDetails } from '@/types/database'; // Removed old type
import { useAppStore } from "@/store/useAppStore"; // Added Store
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const CONFIRM_SHEET_HEIGHT = 340;

export default function JoinRequestsScreen() {
  const { user, currentGroupId, groups } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  // Sadece owner ise istekleri göster
  const isOwner = selectedGroup?.ownerId === user?.id;
  const groupId = selectedGroup?.id || "";

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useGroupJoinRequests(groupId);

  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();
  const { openBottomSheet, closeBottomSheet } = useBottomSheet();
  const { isPremium, openPaywall } = usePremiumGate();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const requesterName = (request: any) => request.displayName || "Kullanıcı";

  const handleApprove = (request: any) => {
    openBottomSheet(
      <ConfirmSheet
        icon="person-add-outline"
        title="İsteği Onayla"
        message={`${requesterName(request)} "${selectedGroup?.name}" grubuna katılacak.`}
        confirmLabel="Onayla"
        onCancel={closeBottomSheet}
        onConfirm={async () => {
          try {
            await approveRequest.mutateAsync({
              requestId: request.id,
              groupId,
            });
            closeBottomSheet();
          } catch (error: any) {
            closeBottomSheet();
            const code = getPremiumLimitCode(error);
            if (code === "GROUP_CAPACITY" && !isPremium) {
              // Grup dolu ve sahibi (sen) ücretsizde: Premium ile 20 kişiye çık
              openPaywall();
              return;
            }
            Alert.alert(
              code ? "Onaylanamadı" : "Hata",
              getApiErrorMessage(error, "İstek onaylanamadı"),
            );
          }
        }}
      />,
      { snapPoints: [CONFIRM_SHEET_HEIGHT] },
    );
  };

  const handleReject = (request: any) => {
    openBottomSheet(
      <ConfirmSheet
        icon="person-remove-outline"
        title="İsteği Reddet"
        message={`${requesterName(request)} adlı kullanıcının katılım isteği reddedilecek.`}
        confirmLabel="Reddet"
        destructive
        onCancel={closeBottomSheet}
        onConfirm={async () => {
          try {
            await rejectRequest.mutateAsync({
              requestId: request.id,
              groupId,
            });
            closeBottomSheet();
          } catch (error: any) {
            closeBottomSheet();
            Alert.alert("Hata", error.message || "İstek reddedilemedi");
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
              Katılma İstekleri
            </Typography>
          ),
          backgroundColor: colors.background,
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
            Katılma isteklerini görmek için bir grup seçmelisiniz.
          </Typography>
        </View>
      </BaseLayout>
    );
  }

  if (!isOwner) {
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
              Katılma İstekleri
            </Typography>
          ),
          backgroundColor: colors.background,
        }}
      >
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={colors.secondaryText}
          />
          <Typography
            variant="h4"
            color={colors.text}
            style={{ marginTop: 16, marginBottom: 8 }}
          >
            Yetki Gerekli
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={{ textAlign: "center" }}
          >
            Sadece grup kurucusu katılma isteklerini görebilir.
          </Typography>
        </View>
      </BaseLayout>
    );
  }

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
            Katılma İstekleri
          </Typography>
        ),
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Typography variant="body" color={colors.secondaryText}>
              Yükleniyor...
            </Typography>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color={colors.secondaryText}
            />
            <Typography
              variant="h4"
              color={colors.text}
              style={{ marginTop: 16, marginBottom: 8 }}
            >
              Bekleyen İstek Yok
            </Typography>
            <Typography
              variant="body"
              color={colors.secondaryText}
              style={{ textAlign: "center" }}
            >
              Şu anda {selectedGroup.name} grubuna katılmak isteyen kimse yok.
            </Typography>
          </View>
        ) : (
          <View style={styles.requestsList}>
            <Typography
              variant="label"
              color={colors.secondaryText}
              style={{ marginBottom: 12 }}
            >
              {requests.length} Bekleyen İstek
            </Typography>
            {requests.map((request) => (
              <View
                key={request.id}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.stroke,
                  },
                ]}
              >
                <View style={styles.requestHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.requestInfo}>
                    <Typography
                      variant="h5"
                      color={colors.text}
                      numberOfLines={1}
                    >
                      {request.displayName || "İsimsiz Kullanıcı"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={colors.secondaryText}
                      style={{ marginTop: 4 }}
                    >
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString(
                            "tr-TR",
                            {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "Tarih bilinmiyor"}
                    </Typography>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      { borderColor: colors.error },
                    ]}
                    onPress={() => handleReject(request)}
                    disabled={rejectRequest.isPending}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.error}
                    />
                    <Typography
                      variant="button"
                      color={colors.error}
                      style={{ marginLeft: 4 }}
                    >
                      Reddet
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.approveButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleApprove(request)}
                    disabled={approveRequest.isPending}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.white}
                    />
                    <Typography
                      variant="button"
                      color={colors.white}
                      style={{ marginLeft: 4 }}
                    >
                      Onayla
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rejectButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  approveButton: {
    // backgroundColor will be set inline
  },
});
