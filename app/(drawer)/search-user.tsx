import { useCreateJoinRequest } from "@/api/groups";
import { useUserByCustomId } from "@/api/users";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { GeliomButton, Typography } from "@/components/shared";
// Removed Contexts
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchUserScreen() {
  const { user, groups, currentGroupId } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = 56 + insets.top;

  const [customUserId, setCustomUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Custom user ID ile kullanıcı ara
  const {
    data: foundUser,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useUserByCustomId(customUserId.trim().toUpperCase());

  const createJoinRequest = useCreateJoinRequest();

  const handleSearch = () => {
    if (!customUserId.trim()) {
      setSearchError("Kullanıcı ID gerekli");
      return;
    }

    setSearchError(null);
    refetchUser();
  };

  const handleSendInvite = async () => {
    if (!foundUser?.user) {
      setSearchError("Kullanıcı bulunamadı");
      return;
    }

    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    // Grup seçimi yoksa veya seçili grup yoksa uyarı ver
    const targetGroupId = selectedGroupId || selectedGroup?.id;
    if (!targetGroupId) {
      Alert.alert("Hata", "Lütfen önce bir grup seçin veya grup ID girin");
      return;
    }

    if (foundUser.user.id === user.id) {
      Alert.alert("Hata", "Kendinize davet gönderemezsiniz");
      return;
    }

    try {
      setIsSubmitting(true);
      setSearchError(null);

      await createJoinRequest.mutateAsync({
        group_id: targetGroupId,
        requester_id: foundUser.user.id,
      });

      Alert.alert(
        "Davet Gönderildi",
        `${
          foundUser.user?.displayName || foundUser.user?.customId
        } kullanıcısına davet gönderildi.`,
        [
          {
            text: "Tamam",
            onPress: () => {
              setCustomUserId("");
              setSelectedGroupId(null);
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
    <>
      <Stack.Screen
        options={{
          title: "Kullanıcı Ara",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: "Comfortaa-SemiBold",
          },
        }}
      />
      <KeyboardAwareView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.contentContainer}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={!customUserId.trim() || isLoadingUser}
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor:
                        customUserId.trim() && !isLoadingUser
                          ? colors.primary
                          : colors.secondaryText + "40",
                    },
                  ]}
                >
                  {isLoadingUser ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="search" size={20} color={colors.white} />
                  )}
                </TouchableOpacity>
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
              {foundUser?.user && !searchError && (
                <Typography
                  variant="caption"
                  color={colors.success}
                  style={{ marginTop: 4 }}
                >
                  ✓ Kullanıcı bulundu
                </Typography>
              )}
            </View>

            {foundUser?.user && (
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
                    {foundUser.user.photoUrl ? (
                      <Ionicons
                        name="person"
                        size={32}
                        color={colors.primary}
                      />
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
                      {foundUser.user.displayName || "İsimsiz Kullanıcı"}
                    </Typography>
                    <Typography variant="caption" color={colors.secondaryText}>
                      @{foundUser.user.customId}
                    </Typography>
                    {foundUser.user.email && (
                      <Typography
                        variant="caption"
                        color={colors.secondaryText}
                        style={{ marginTop: 2 }}
                      >
                        {foundUser.user.email}
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
                  Davet göndermek için önce bir grup seçmelisiniz veya grup
                  yönetimi sayfasından davet gönderebilirsiniz.
                </Typography>
              </View>
            )}

            <GeliomButton
              state={
                isSubmitting
                  ? "loading"
                  : foundUser && (selectedGroup || selectedGroupId)
                    ? "active"
                    : "passive"
              }
              layout="full-width"
              size="large"
              icon="send"
              onPress={handleSendInvite}
              disabled={
                !foundUser?.user ||
                (!selectedGroup && !selectedGroupId) ||
                isSubmitting
              }
            >
              {isSubmitting ? "Gönderiliyor..." : "Davet Gönder"}
            </GeliomButton>
          </View>
        </ScrollView>
      </KeyboardAwareView>
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 4,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingRight: 50,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: "Comfortaa-Medium",
  },
  searchButton: {
    position: "absolute",
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
