import { useInviteUser } from "@/api/groups";
import { useUserByCustomId } from "@/api/users";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
// Removed Contexts
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchUserScreen() {
  const { user, groups, currentGroupId } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 56 + insets.top;

  const [customUserId, setCustomUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Custom user ID ile kullanıcı ara
  const {
    data: foundResult,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useUserByCustomId(customUserId.trim().toUpperCase());

  // foundResult is { found: boolean, user?: ... }
  const foundUser = foundResult?.found ? foundResult.user : null;

  const inviteUser = useInviteUser();

  const handleSearch = () => {
    if (!customUserId.trim()) {
      setSearchError("Kullanıcı ID gerekli");
      return;
    }

    setSearchError(null);
    refetchUser();
  };

  const handleSendInvite = async () => {
    if (!foundUser) {
      setSearchError("Kullanıcı bulunamadı");
      return;
    }

    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    if (!selectedGroup) {
      Alert.alert("Hata", "Lütfen önce bir grup seçin");
      return;
    }

    if (foundUser.id === user.id) {
      Alert.alert("Hata", "Kendinize davet gönderemezsiniz");
      return;
    }

    try {
      setIsSubmitting(true);
      setSearchError(null);

      await inviteUser.mutateAsync({
        groupId: selectedGroup.id,
        userId: foundUser.id,
      });

      Alert.alert(
        "Davet Gönderildi",
        `${foundUser.displayName || foundUser.customId} kullanıcısına ${selectedGroup.name} grubuna katılma daveti gönderildi.`,
        [
          {
            text: "Tamam",
            onPress: () => {
              setCustomUserId("");
              router.back();
            },
          },
        ],
      );
    } catch (error: any) {
      setSearchError(error.message || "Davet gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserIdChange = (text: string) => {
    // Sadece büyük harf ve rakam kabul et
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCustomUserId(cleaned);
    setSearchError(null);
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
            Kullanıcı Ara
          </Typography>
        ),
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAwareView
        contentContainerStyle={styles.contentContainer}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.headerSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="search" size={48} color={colors.primary} />
          </View>
          <Typography
            variant="h3"
            color={colors.text}
            style={{ marginTop: 24, marginBottom: 8 }}
          >
            Kullanıcı Ara ve Davet Et
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={{ textAlign: "center" }}
          >
            Kullanıcının custom ID&apos;sini girerek arama yapın ve gruba davet
            gönderin
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Typography
              variant="label"
              color={colors.text}
              style={{ marginBottom: 8 }}
            >
              Kullanıcı ID
            </Typography>
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: searchError
                      ? colors.error
                      : foundUser
                        ? colors.success
                        : colors.stroke,
                  },
                ]}
                placeholder="ABC12345"
                placeholderTextColor={colors.secondaryText + "80"}
                value={customUserId}
                onChangeText={handleUserIdChange}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <GeliomButton
                state={
                  isLoadingUser
                    ? "loading"
                    : customUserId.trim()
                      ? "active"
                      : "passive"
                }
                size="small"
                icon="search"
                onPress={handleSearch}
                disabled={!customUserId.trim() || isLoadingUser}
              >
                Ara
              </GeliomButton>
            </View>
            {searchError && (
              <Typography
                variant="caption"
                color={colors.error}
                style={{ marginTop: 4 }}
              >
                {searchError}
              </Typography>
            )}
            {foundUser && !searchError && (
              <Typography
                variant="caption"
                color={colors.success}
                style={{ marginTop: 4 }}
              >
                ✓ Kullanıcı bulundu
              </Typography>
            )}
          </View>

          {foundUser && (
            <View
              style={[
                styles.userCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.stroke,
                },
              ]}
            >
              <View style={styles.userCardHeader}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  {foundUser.photoUrl ? (
                    <Ionicons name="person" size={32} color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="person-outline"
                      size={32}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Typography
                    variant="h5"
                    color={colors.text}
                    numberOfLines={1}
                  >
                    {foundUser.displayName || "İsimsiz Kullanıcı"}
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    @{foundUser.custom_user_id}
                  </Typography>
                  {foundUser.email && (
                    <Typography
                      variant="caption"
                      color={colors.secondaryText}
                      style={{ marginTop: 2 }}
                    >
                      {foundUser.email}
                    </Typography>
                  )}
                </View>
              </View>
            </View>
          )}

          {selectedGroup && (
            <View
              style={[
                styles.groupInfo,
                {
                  backgroundColor: colors.cardBackground + "80",
                  borderColor: colors.stroke,
                },
              ]}
            >
              <View style={styles.groupInfoHeader}>
                <Ionicons
                  name="people"
                  size={20}
                  color={colors.secondaryText}
                />
                <Typography
                  variant="caption"
                  color={colors.secondaryText}
                  style={{ marginLeft: 8 }}
                >
                  Davet gönderilecek grup:{" "}
                  <Typography
                    variant="caption"
                    color={colors.text}
                    fontWeight="semibold"
                  >
                    {selectedGroup.name}
                  </Typography>
                </Typography>
              </View>
            </View>
          )}

          {!selectedGroup && (
            <View
              style={[
                styles.warningCard,
                {
                  backgroundColor: colors.warning + "20",
                  borderColor: colors.warning,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.warning}
              />
              <Typography
                variant="caption"
                color={colors.warning}
                style={{ marginLeft: 8, flex: 1 }}
              >
                Davet göndermek için önce bir grup seçmelisiniz.
              </Typography>
            </View>
          )}

          <GeliomButton
            state={
              isSubmitting
                ? "loading"
                : foundUser && selectedGroup
                  ? "active"
                  : "passive"
            }
            layout="full-width"
            size="large"
            icon="send"
            onPress={handleSendInvite}
            disabled={!foundUser || !selectedGroup || isSubmitting}
          >
            {isSubmitting ? "Gönderiliyor..." : "Davet Gönder"}
          </GeliomButton>
        </View>
      </KeyboardAwareView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 4,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: "Comfortaa-Medium",
  },
  userCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  groupInfo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  groupInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
});
