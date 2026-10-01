import { Button, Typography } from "@/components/shared";
import { Emoji } from "@/components/ui";
import { PREMIUM_BENEFITS } from "@/constants/premium";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { layout, radius, spacing } from "@/theme/tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  cubicBezier,
  Easing,
  FadeIn,
  FadeInDown,
  Keyframe,
  useReducedMotion,
} from "react-native-reanimated";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** Satırlar yukarıdan sırayla iner: her biri bir öncekinden bu kadar sonra */
const STAGGER = 110;
/** Paywall'un (native) kapanması bitmeden RN Modal açılırsa iOS modalı yutar */
const OPEN_DELAY = 600;

/** Kahraman emoji: hafif yukarıdan, %90'dan büyüyerek gelir — scale(0) değil */
const heroEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -16 }, { scale: 0.9 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT },
}).duration(420);

/** Giriş bittikten sonra emojinin hafif süzülmesi (azaltılmış harekette kapalı) */
const floatAnimation = {
  animationName: {
    "0%": { transform: [{ translateY: 0 }] },
    "50%": { transform: [{ translateY: -6 }] },
    "100%": { transform: [{ translateY: 0 }] },
  },
  animationDuration: "2400ms",
  animationIterationCount: "infinite",
  animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1),
  animationDelay: "500ms",
} as const;

/** Kullanıcı bazında "gösterildi" işareti — yalnızca ilk abonelikte açılır */
const SHOWN_KEY_PREFIX = "premiumWelcomeShown:";

/** Geliştirmede modalı elle açmak için (Ayarlar → Geliştirici) */
const manualOpeners = new Set<() => void>();
export const showPremiumWelcome = () => manualOpeners.forEach((open) => open());

const dropIn = (index: number) =>
  FadeInDown.duration(380)
    .delay(200 + index * STAGGER)
    .easing(EASE_OUT);

/**
 * "Premium'a hoş geldin" — kullanıcı İLK kez abone olduğunda, bir kez açılır.
 * Gösterildiği kullanıcı bazında cihaza yazılır; yenileme, abonelik bitip
 * yeniden başlaması veya aynı hesabın sonraki açılışları tekrar göstermez.
 * Tetik: aynı oturumda aynı kullanıcının premium'u false → true dönmesi
 * (uygulama içi satın alma, panelden verilen erişim, başka cihazda satın
 * alma). Giriş/açılış tetiklemez: store'daki kullanıcı açılışta null'dan
 * başlar ve kalıcı değildir.
 */
export default function PremiumWelcomeModal() {
  const { colors, shadows } = useTheme();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      const sameUser = !!state.user && state.user.id === prev.user?.id;
      if (sameUser && !prev.isSubscribed && state.isSubscribed) {
        const key = `${SHOWN_KEY_PREFIX}${state.user!.id}`;
        clearTimeout(timer);
        timer = setTimeout(async () => {
          // Okunamazsa göstermemek, iki kez göstermekten iyidir
          const alreadyShown = await AsyncStorage.getItem(key).catch(() => "1");
          if (alreadyShown) return;
          await AsyncStorage.setItem(key, "1").catch(() => undefined);
          setVisible(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, OPEN_DELAY);
      }
    });
    const openNow = () => setVisible(true);
    manualOpeners.add(openNow);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      manualOpeners.delete(openNow);
    };
  }, []);

  const close = () => setVisible(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.card, { backgroundColor: colors.sheetBackground }, shadows.floating]}
        >
          {/* Ekranın tek gradient yüzeyi */}
          <LinearGradient
            colors={colors.premiumGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Animated.View entering={heroEntering}>
              <Animated.View style={reducedMotion ? undefined : floatAnimation}>
                <Emoji size={64}>🎉</Emoji>
              </Animated.View>
            </Animated.View>
            <Animated.View entering={dropIn(0)}>
              <Typography variant="h4" fontWeight="bold" color={colors.white} style={styles.center}>
                {"Premium'a hoş geldin!"}
              </Typography>
            </Animated.View>
            <Animated.View entering={dropIn(1)}>
              <Typography variant="body" color={colors.white} style={[styles.center, styles.muted]}>
                Aboneliğin aktif. Artık bunların hepsi senin:
              </Typography>
            </Animated.View>
          </LinearGradient>

          <View style={styles.benefits}>
            {PREMIUM_BENEFITS.map((b, i) => (
              <Animated.View key={b.title} entering={dropIn(i + 2)} style={styles.benefit}>
                <View style={[styles.benefitEmoji, { backgroundColor: colors.premiumTint }]}>
                  <Emoji size={26}>{b.emoji}</Emoji>
                </View>
                <View style={styles.benefitText}>
                  <Typography variant="body" fontWeight="semibold" color={colors.text}>
                    {b.title}
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText}>
                    {b.subtitle}
                  </Typography>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={dropIn(PREMIUM_BENEFITS.length + 2)} style={styles.actions}>
            <Button variant="primary" title="Harika, başlayalım" onPress={close} />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: layout.screenPadding,
  },
  card: {
    borderRadius: radius.xxl,
    overflow: "hidden",
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  center: {
    textAlign: "center",
  },
  muted: {
    opacity: 0.9,
  },
  benefits: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  benefitEmoji: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
