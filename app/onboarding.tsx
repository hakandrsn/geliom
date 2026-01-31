import { GeliomButton, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Fake Data - Başlangıç
const INITIAL_MEMBERS = [
  { id: "1", name: "Sen", status: "", mood: "", color: "#4F46E5", isMe: true },
  {
    id: "2",
    name: "Ayşe",
    status: "",
    mood: "",
    color: "#E11D48",
    isMe: false,
  },
  { id: "3", name: "Can", status: "", mood: "", color: "#10B981", isMe: false },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Akış Kontrolü
  const [step, setStep] = useState(0);
  const [inputText, setInputText] = useState("");
  const [members, setMembers] = useState(INITIAL_MEMBERS);

  // Animasyon Değerleri
  const notifTranslateY = useSharedValue(-150);
  const notifOpacity = useSharedValue(0);

  // --- SENARYO AKIŞI (Zamanlayıcılar) ---
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStep(1);
      startTyping();
    }, 2500);
    return () => clearTimeout(timer1);
  }, []);

  const startTyping = () => {
    const textToType = "Aile Grubu";
    let i = 0;
    const interval = setInterval(() => {
      setInputText(textToType.slice(0, i + 1));
      i++;
      if (i === textToType.length) {
        clearInterval(interval);
        setTimeout(() => setStep(2), 1000);
      }
    }, 80);
  };

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        setStep(3);
        triggerUpdates();
      }, 1500);
    }
  }, [step]);

  const triggerUpdates = () => {
    setMembers((prev) =>
      prev.map((m) => (m.name === "Ayşe" ? { ...m, status: "Yolda 🚗" } : m)),
    );
    setTimeout(() => {
      setMembers((prev) =>
        prev.map((m) => (m.name === "Can" ? { ...m, mood: "🎮" } : m)),
      );
    }, 800);
    setTimeout(() => {
      notifOpacity.value = withTiming(1, { duration: 500 });
      notifTranslateY.value = withTiming(60, { duration: 600 });
      setTimeout(() => {
        notifTranslateY.value = withTiming(-150, { duration: 500 });
        setStep(4); // FİNAL
      }, 3000);
    }, 1200);
  };

  // --- Local State: Kaydet ---
  const handleFinish = async () => {
    try {
      // Update local state and persist
      useAppStore.getState().setHasCompletedOnboarding(true);
      router.replace("/(drawer)/home");
    } catch (error) {
      console.error("Onboarding kaydetme hatası:", error);
      router.replace("/(drawer)/home");
    }
  };

  const notifStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: notifTranslateY.value }],
    opacity: notifOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ... Notification Component ... */}
      <Animated.View
        style={[
          styles.notification,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.stroke,
          },
          notifStyle,
        ]}
      >
        <View
          style={[styles.notifIcon, { backgroundColor: colors.primary + "20" }]}
        >
          <Ionicons name="notifications" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="bodySmall" fontWeight="bold" color={colors.text}>
            Geliom
          </Typography>
          <Typography variant="caption" color={colors.secondaryText}>
            Ayşe: &#34;Yolda 🚗&#34; durumunu paylaştı.
          </Typography>
        </View>
      </Animated.View>

      <View style={styles.centerContent}>
        {/* ... Diğer Sahneler (0, 1, 2, 3) ... */}

        {step === 0 && (
          <Animated.View
            entering={FadeIn.duration(800)}
            exiting={FadeOut.duration(500)}
            style={styles.stageContainer}
          >
            <Typography
              variant="h3"
              color={colors.primary}
              style={{ marginBottom: 12 }}
            >
              Geliom
            </Typography>
            <Typography
              variant="body"
              color={colors.secondaryText}
              style={{ textAlign: "center" }}
            >
              Sevdiklerinle, kelimelere ihtiyaç duymadan anlaş.
            </Typography>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View
            entering={FadeInUp.duration(600)}
            exiting={FadeOut.duration(400)}
            style={styles.stageContainer}
          >
            <Typography
              variant="body"
              color={colors.secondaryText}
              style={{ marginBottom: 16 }}
            >
              Bir grup oluştur...
            </Typography>
            <View
              style={[
                styles.fakeInput,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Typography variant="h5" color={colors.text}>
                {inputText}
              </Typography>
              <View
                style={[styles.cursor, { backgroundColor: colors.primary }]}
              />
            </View>
          </Animated.View>
        )}

        {(step === 2 || step === 3) && (
          <Animated.View style={[styles.listWrapper, { width: width * 0.85 }]}>
            {/* Liste Görünümü */}
            {members.map((member, index) => (
              <Animated.View
                key={member.id}
                entering={FadeInDown.delay(index * 150).duration(600)}
                layout={Layout.duration(400)}
                style={[
                  styles.memberRow,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.stroke,
                  },
                ]}
              >
                {/* ... Member Items ... */}
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: member.color + "20" },
                  ]}
                >
                  <Typography variant="h6" color={member.color}>
                    {member.name[0]}
                  </Typography>
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Typography
                    variant="body"
                    fontWeight="semibold"
                    color={colors.text}
                  >
                    {member.name}
                  </Typography>
                  <Animated.View
                    key={member.status || "empty"}
                    entering={FadeIn.duration(500)}
                  >
                    {member.status ? (
                      <Typography
                        variant="caption"
                        color={colors.primary}
                        fontWeight="bold"
                      >
                        {member.status}
                      </Typography>
                    ) : (
                      <Typography
                        variant="caption"
                        color={colors.secondaryText}
                        style={{ opacity: 0.5 }}
                      >
                        Durum yok
                      </Typography>
                    )}
                  </Animated.View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* SAHNE 4: FINAL */}
        {step === 4 && (
          <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.stageContainer}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Ionicons name="rocket" size={40} color={colors.primary} />
            </View>

            <Typography
              variant="h4"
              color={colors.text}
              style={{ marginTop: 20, marginBottom: 8 }}
            >
              Hazırsın!
            </Typography>

            <Typography
              variant="body"
              color={colors.secondaryText}
              style={{ textAlign: "center", marginBottom: 30 }}
            >
              Sade, hızlı ve anlık durum paylaşımı.
            </Typography>

            <GeliomButton
              size="large"
              layout="icon-right"
              icon="arrow-forward"
              onPress={handleFinish}
              style={{ minWidth: 200 }}
            >
              Başla
            </GeliomButton>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stageContainer: { alignItems: "center", width: "100%" },
  fakeInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
    maxWidth: 300,
  },
  cursor: { width: 2, height: 20, marginLeft: 2, opacity: 0.5 },
  listWrapper: {},
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  notification: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 100,
    elevation: 5,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
