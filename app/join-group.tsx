import { useJoinGroup } from "@/api/groups";
import { fonts } from "@/theme/typography";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { PLAN_LIMITS, membershipLimit } from "@/constants/premium";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppStore } from "@/store/useAppStore";
import { getApiErrorMessage, getPremiumLimitCode } from "@/utils/api-error";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INVITE_CODE_LENGTH = 6;

export default function JoinGroupScreen() {
  const { user } = useAppStore();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 56 + insets.top;

  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const joinGroup = useJoinGroup();

  const isCodeComplete = inviteCode.trim().length === INVITE_CODE_LENGTH;

  const groups = useAppStore((state) => state.groups);
  const { isPremium, requirePremium, openPaywall } = usePremiumGate();
  const atLimit = groups.length >= membershipLimit(isPremium);

  const submit = async () => {
    try {
      setIsSubmitting(true);
      setCodeError(null);

      const group = await joinGroup.mutateAsync({
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      Alert.alert("Gruba katıldın", `${group.name} grubuna katıldın.`, [
        { text: "Tamam", onPress: () => router.replace("/(drawer)/home") },
      ]);
    } catch (error: any) {
      const status = error?.response?.status;
      const code = getPremiumLimitCode(error);
      if (status === 404) {
        setCodeError("Geçersiz davet kodu");
      } else if (code === "MEMBERSHIP_LIMIT" && !isPremium) {
        openPaywall(() => void submit());
      } else if (code === "GROUP_CAPACITY") {
        // Katılan kişi premium alsa da açılmaz — yalnızca grup sahibi açabilir
        setCodeError(
          "Bu grup dolu. Grubun yöneticisi Premium'a geçerse kapasite 20 kişiye çıkar.",
        );
      } else {
        setCodeError(getApiErrorMessage(error, "Gruba katılamadın"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = () => {
    if (!isCodeComplete) {
      setCodeError(`${INVITE_CODE_LENGTH} haneli davet kodu gerekli`);
      return;
    }
    if (!user?.id) return;

    if (atLimit) {
      if (isPremium) {
        setCodeError(
          `Premium ile en fazla ${PLAN_LIMITS.PREMIUM.MAX_MEMBERSHIPS} gruba üye olabilirsin. Önce bir gruptan ayrıl.`,
        );
        return;
      }
      requirePremium(() => void submit());
      return;
    }

    void submit();
  };

  const handleCodeChange = (text: string) => {
    // Sadece büyük harf ve rakam kabul et
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setInviteCode(cleaned);
    setCodeError(null);
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
            Gruba Katıl
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
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Typography
            variant="h3"
            color={colors.text}
            style={{ marginTop: 24, marginBottom: 8 }}
          >
            Davet Kodu ile Katıl
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={{ textAlign: "center" }}
          >
            Grup kurucusundan aldığınız {INVITE_CODE_LENGTH} haneli davet
            kodunu girin
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Typography
              variant="label"
              color={colors.text}
              style={{ marginBottom: 8 }}
            >
              Davet Kodu
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: codeError
                    ? colors.error
                    : isCodeComplete
                      ? colors.success
                      : colors.stroke,
                },
              ]}
              placeholder="AB3K9X"
              placeholderTextColor={colors.secondaryText + "80"}
              value={inviteCode}
              onChangeText={handleCodeChange}
              maxLength={INVITE_CODE_LENGTH}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {codeError && (
              <Typography
                variant="caption"
                color={colors.error}
                style={{ marginTop: 4 }}
              >
                {codeError}
              </Typography>
            )}
          </View>

          <GeliomButton
            state={
              isSubmitting ? "loading" : isCodeComplete ? "active" : "passive"
            }
            layout="full-width"
            size="large"
            icon="enter"
            onPress={handleJoin}
            disabled={!isCodeComplete || isSubmitting}
          >
            {isSubmitting ? "Katılınıyor..." : "Gruba Katıl"}
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
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: 2,
    textAlign: "center",
  },
});
