import { useUserByCustomId } from "@/api/users";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Share, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchUserScreen() {
  const { user, groups, currentGroupId } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 56 + insets.top;

  const [customUserId, setCustomUserId] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Custom user ID ile kullanıcı ara
  const {
    data: foundResult,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useUserByCustomId(customUserId.trim().toUpperCase());

  // foundResult: { found: boolean, user?: { id, customId, displayName, photoUrl } }
  const foundUser = foundResult?.found ? foundResult.user : null;

  const handleSearch = () => {
    if (!customUserId.trim()) {
      setSearchError("Kullanıcı ID gerekli");
      return;
    }

    setSearchError(null);
    refetchUser();
  };

  // API'de doğrudan davet endpoint'i yok — davet kodu paylaşılır,
  // kullanıcı bu kodla katılır veya katılma isteği gönderir.
  const handleShareInvite = async () => {
    if (!selectedGroup) return;

    try {
      await Share.share({
        message: `${selectedGroup.name} grubuna katıl!\n\nDavet Kodu: ${selectedGroup.inviteCode}\n\nUygulamayı indir ve bu kodu kullanarak gruba katıl.`,
        title: `${selectedGroup.name} - Grup Daveti`,
      });
    } catch (error) {
      console.error("Davet paylaşılırken hata oluştu:", error);
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
            Kullanıcının custom ID&apos;sini girerek arama yapın ve gruba
            katılması için davet kodunu paylaşın
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
            {foundResult && !foundResult.found && !searchError && (
              <Typography
                variant="caption"
                color={colors.error}
                style={{ marginTop: 4 }}
              >
                Kullanıcı bulunamadı
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
                  <Ionicons
                    name={foundUser.photoUrl ? "person" : "person-outline"}
                    size={32}
                    color={colors.primary}
                  />
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
                    @{foundUser.customId}
                  </Typography>
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
                  Davet kodu paylaşılacak grup:{" "}
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
                Davet kodu paylaşmak için önce bir grup seçmelisiniz.
              </Typography>
            </View>
          )}

          <GeliomButton
            state={selectedGroup ? "active" : "passive"}
            layout="full-width"
            size="large"
            icon="share-social"
            onPress={handleShareInvite}
            disabled={!selectedGroup}
          >
            Davet Kodunu Paylaş
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
