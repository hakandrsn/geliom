import type { DashboardMember } from "@/api/dashboard";
import { BouncyButton } from "@/components/anim/AnimatedComponents";
import { Typography } from "@/components/shared";
import { Avatar, Emoji } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import { formatRelativeTime } from "@/utils/status-display";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

interface MoodHeroProps {
  member: DashboardMember;
  onPress?: () => void;
  /** Verilirse avatar dokunulabilir olur ve kamera rozeti görünür */
  onAvatarPress?: () => void;
  /** Composer kartının içinde: kendi kenarlık/gölgesi yok */
  embedded?: boolean;
}

/**
 * Ana ekranın odak noktası: kullanıcının kendi durumu. Sakin bir kart —
 * renk yalnızca emoji karesinde ve küçük vurgularda. Başlık durum metni,
 * alt satır ruh hali ve zaman.
 */
export default function MoodHero({
  member,
  onPress,
  onAvatarPress,
  embedded = false,
}: MoodHeroProps) {
  const { colors, shadows } = useTheme();

  const status = member.statusText?.trim();
  const mood = member.moodText?.trim();
  const emoji = member.moodEmoji ?? member.statusEmoji;
  const relative = formatRelativeTime(member.updatedAt);
  const displayName = member.displayName || member.customId || "Sen";

  const title = status || mood || "Bugün nasılsın?";
  const subtitleParts: string[] = [];
  if (status && mood && status.toLocaleLowerCase("tr-TR") !== mood.toLocaleLowerCase("tr-TR")) {
    subtitleParts.push(`${mood} hissediyorsun`);
  }
  if (relative && (status || mood)) subtitleParts.push(relative);
  const subtitle =
    subtitleParts.length > 0
      ? subtitleParts.join(" · ")
      : status || mood
        ? "Grubun görüyor"
        : "Aşağıdan seç, grubun anında görsün";

  // Durum değişince emoji hafifçe zıplar
  const emojiScale = useSharedValue(1);
  useEffect(() => {
    if (!member.updatedAt) return;
    emojiScale.value = withSequence(withSpring(1.15), withSpring(1));
  }, [member.updatedAt, emojiScale]);
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <BouncyButton onPress={onPress} scaleTo={0.99} activeOpacity={0.9}>
      <View
        style={[
          styles.card,
          !embedded && {
            backgroundColor: colors.sheetBackground,
            borderColor: colors.stroke,
            borderWidth: 1,
          },
          !embedded && shadows.card,
          embedded && styles.embedded,
        ]}
      >
        {/* Sol: kullanıcının avatarı — dokununca avatar seçici (kartın geri
            kalanı dropdown'u açar). Sağ altta kamera rozeti. */}
        <BouncyButton onPress={onAvatarPress} disabled={!onAvatarPress} scaleTo={0.94}>
          <Avatar
            photoUrl={member.photoUrl}
            name={member.displayName}
            seed={member.userId}
            size={60}
          />
          {onAvatarPress && (
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: colors.primary, borderColor: colors.sheetBackground },
              ]}
            >
              <Ionicons name="camera" size={11} color="#FFFFFF" />
            </View>
          )}
        </BouncyButton>

        <View style={styles.info}>
          <Typography
            variant="caption"
            fontWeight="semibold"
            color={colors.secondaryText}
            numberOfLines={1}
          >
            {displayName}
          </Typography>

          <View style={styles.titleRow}>
            {emoji && (
              <Animated.View style={emojiStyle}>
                <Emoji size={22}>{emoji}</Emoji>
              </Animated.View>
            )}
            <Typography
              variant="h4"
              fontWeight="bold"
              color={colors.text}
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Typography>
          </View>

          <Typography
            variant="bodySmall"
            fontWeight="medium"
            color={colors.secondaryText}
            numberOfLines={1}
          >
            {subtitle}
          </Typography>
        </View>
      </View>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xxl,
  },
  embedded: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  title: {
    flexShrink: 1,
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
