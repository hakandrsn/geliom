import { useCreateGroup } from "@/api/groups";
import { fonts } from "@/theme/typography";
import KeyboardAwareView from "@/components/KeyboardAwareView";
import { BaseLayout, GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { GROUP_NAME_RULES, PLAN_LIMITS, membershipLimit } from "@/constants/premium";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppStore } from "@/store/useAppStore";
import { getApiErrorMessage, getPremiumLimitCode } from "@/utils/api-error";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GROUP_TYPES = [
  { value: "family", label: "Aile", icon: "home", desc: "Ev halkı için" },
  {
    value: "friends",
    label: "Arkadaşlar",
    icon: "people",
    desc: "En yakınlar için",
  },
  { value: "work", label: "İş", icon: "briefcase", desc: "Ekip için" },
  { value: "other", label: "Diğer", icon: "shapes", desc: "Özel gruplar" },
];

export default function CreateGroupScreen() {
  const { user } = useAppStore();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const createGroupMutation = useCreateGroup();

  const headerHeight = 56 + insets.top;

  const [name, setName] = useState("");
  const [type, setType] = useState("family");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const groups = useAppStore((state) => state.groups);
  const { isPremium, requirePremium, openPaywall } = usePremiumGate();
  const limit = membershipLimit(isPremium);
  const atLimit = groups.length >= limit;

  const submit = async () => {
    try {
      setIsSubmitting(true);
      // API sadece name kabul eder; grup tipi yalnızca UI'da görsel bir seçim
      await createGroupMutation.mutateAsync({ name: name.trim() });
      router.replace("/(drawer)/home");
    } catch (error: any) {
      const code = getPremiumLimitCode(error);
      if (code === "MEMBERSHIP_LIMIT" && !isPremium) {
        // Sunucu limit dedi (liste eskiyse): satın alınırsa tekrar dene
        openPaywall(() => void submit());
      } else {
        Alert.alert(
          code ? "Limit doldu" : "Hata",
          getApiErrorMessage(error, "Grup oluşturulamadı"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGroup = () => {
    const trimmed = name.trim();
    if (trimmed.length < GROUP_NAME_RULES.MIN_LENGTH) {
      setNameError(`En az ${GROUP_NAME_RULES.MIN_LENGTH} karakter gerekli`);
      return;
    }
    if (trimmed.length > GROUP_NAME_RULES.MAX_LENGTH) {
      setNameError(`En fazla ${GROUP_NAME_RULES.MAX_LENGTH} karakter olabilir`);
      return;
    }
    if (!user?.id) return;

    if (atLimit) {
      if (isPremium) {
        Alert.alert(
          "Grup limitine ulaştın",
          `Premium ile en fazla ${limit} gruba üye olabilirsin. Yeni grup için önce bir gruptan ayrıl.`,
        );
        return;
      }
      // Ücretsiz planda limit dolu: paywall, satın alınırsa oluşturmaya devam
      requirePremium(() => void submit());
      return;
    }

    void submit();
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
            Yeni Birlik Kur
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
          <Typography
            variant="h3"
            color={colors.primary}
            style={{ marginBottom: 8 }}
          >
            {name ? name : "İsimsiz Grup"}
          </Typography>
          <Typography
            variant="body"
            color={colors.secondaryText}
            style={{ textAlign: "center" }}
          >
            Sevdiklerinle anlık durumlarını paylaşmak için özel bir alan.
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Typography
              variant="label"
              color={colors.text}
              style={{ marginBottom: 8 }}
            >
              Grup İsmi
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: nameError ? colors.error : colors.stroke,
                },
              ]}
              placeholder="Örn: Canım Ailem"
              placeholderTextColor={colors.secondaryText + "80"}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setNameError(null);
              }}
              maxLength={GROUP_NAME_RULES.MAX_LENGTH}
            />
            <View style={styles.inputMeta}>
              <Typography variant="caption" color={nameError ? colors.error : colors.lightText}>
                {nameError ?? " "}
              </Typography>
              <Typography variant="caption" color={colors.lightText}>
                {name.length}/{GROUP_NAME_RULES.MAX_LENGTH}
              </Typography>
            </View>
            {atLimit && !isPremium && (
              <Typography variant="caption" color={colors.secondaryText} style={styles.planHint}>
                Ücretsiz planda {PLAN_LIMITS.FREE.MAX_MEMBERSHIPS} gruba üye olabilirsin. Yeni grup için Premium gerekir.
              </Typography>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Typography
              variant="label"
              color={colors.text}
              style={{ marginBottom: 12 }}
            >
              Grup Tipi
            </Typography>
            <View style={styles.typeGrid}>
              {GROUP_TYPES.map((groupType) => {
                const isSelected = type === groupType.value;
                return (
                  <TouchableOpacity
                    key={groupType.value}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "10"
                          : colors.cardBackground,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.stroke,
                      },
                    ]}
                    onPress={() => setType(groupType.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.tertiary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={groupType.icon as any}
                        size={20}
                        color={isSelected ? colors.white : colors.primary}
                      />
                    </View>
                    <Typography
                      variant="body"
                      fontWeight="semibold"
                      color={colors.text}
                      style={{ marginTop: 8 }}
                    >
                      {groupType.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <GeliomButton
            state={isSubmitting ? "loading" : "active"}
            layout="full-width"
            size="large"
            icon="checkmark-circle"
            onPress={handleCreateGroup}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Oluşturuluyor..." : "Grubu Oluştur"}
          </GeliomButton>
        </View>
      </KeyboardAwareView>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  inputMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  planHint: {
    marginTop: 6,
  },
  contentContainer: { padding: 24, paddingBottom: 100 },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  form: { gap: 28 },
  inputGroup: { gap: 4 },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: fonts.medium,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  typeCard: {
    width: "48%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
