import { Typography } from "@/components/shared";
import { Avatar } from "@/components/ui";
import { toAvatarValue } from "@/constants/avatars";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

interface PreviewMember {
  name: string;
  avatar: string;
  states: { status: string; emoji: string }[];
}

// Uygulamanın ne yaptığını giriş yapmadan gösteren küçük sahne
const MEMBERS: PreviewMember[] = [
  {
    name: "Ayşe",
    avatar: "w-bandana",
    states: [
      { status: "Toplantıda", emoji: "💻" },
      { status: "Yolda", emoji: "🚗" },
      { status: "Kahve molası", emoji: "☕" },
    ],
  },
  {
    name: "Can",
    avatar: "m-glasses-blue",
    states: [
      { status: "Spor yapıyor", emoji: "⚡" },
      { status: "Müsait", emoji: "😊" },
    ],
  },
  {
    name: "Deniz",
    avatar: "w-curls-denim",
    states: [
      { status: "Uykuda", emoji: "🥱" },
      { status: "Okulda", emoji: "📚" },
      { status: "Rahat", emoji: "😌" },
    ],
  },
];

const TICK_MS = 2200;

/**
 * Login ekranı için canlı önizleme: üç üyenin durumu sırayla değişir.
 * Hem ürünü anlatır hem de yeni baş harfli avatarları sergiler.
 */
export default function LoginPreview() {
  const { colors, shadows } = useTheme();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.sheetBackground,
          borderColor: colors.stroke,
        },
        shadows.floating,
      ]}
    >
      {MEMBERS.map((member, index) => {
        // Her satır farklı anda değişsin diye kaydırılmış sayaç
        const step = Math.floor((tick + index) / MEMBERS.length);
        const current = member.states[step % member.states.length];
        const isChanging = (tick + index) % MEMBERS.length === 0;

        return (
          <View
            key={member.name}
            style={[
              styles.row,
              index < MEMBERS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.stroke,
              },
            ]}
          >
            <Avatar
              photoUrl={toAvatarValue(member.avatar)}
              name={member.name}
              size={40}
              badge={current.emoji}
            />
            <View style={styles.text}>
              <Typography variant="bodySmall" fontWeight="semibold" color={colors.text}>
                {member.name}
              </Typography>
              <Animated.View
                key={`${member.name}-${step}`}
                entering={FadeInDown.duration(320)}
                exiting={FadeOutUp.duration(200)}
              >
                <Typography variant="caption" color={colors.secondaryText}>
                  {current.status}
                </Typography>
              </Animated.View>
            </View>
            <View
              style={[
                styles.dot,
                { backgroundColor: isChanging ? colors.success : colors.lightText },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
});
