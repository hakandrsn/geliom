import { Skeleton } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { layout, radius, spacing } from "@/theme/tokens";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Dashboard yüklenirken gerçek yerleşimi taklit eden iskelet ekran. */
export default function DashboardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Profil kartı — en üstte */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.cardBackground, borderColor: colors.stroke },
        ]}
      >
        <Skeleton height={44} circle />
        <View style={styles.profileLines}>
          <Skeleton width={120} height={14} />
          <Skeleton width={90} height={10} />
        </View>
      </View>

      {/* Grup adı + kopyala */}
      <View style={styles.topBar}>
        <View style={styles.titleBlock}>
          <Skeleton width={150} height={20} />
          <Skeleton width={60} height={12} />
        </View>
        <Skeleton width={92} height={34} radius={radius.full} />
      </View>

      {/* Chip satırları */}
      {[0, 1].map((row) => (
        <View key={row} style={styles.chipSection}>
          <Skeleton width={70} height={10} style={styles.chipLabel} />
          <View style={styles.chipRow}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                width={i === 0 ? 110 : 88}
                height={40}
                radius={radius.full}
              />
            ))}
          </View>
        </View>
      ))}

      {/* Üye kartları */}
      <View style={styles.members}>
        <Skeleton width={90} height={10} style={styles.chipLabel} />
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.memberCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.stroke,
              },
            ]}
          >
            <Skeleton height={52} circle />
            <View style={styles.profileLines}>
              <Skeleton width={130} height={14} />
              <Skeleton width={100} height={10} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    marginTop: spacing.lg,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: layout.screenPadding,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  profileLines: {
    flex: 1,
    gap: spacing.sm,
  },
  chipSection: {
    marginTop: spacing.xl,
  },
  chipLabel: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
  },
  members: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: layout.screenPadding,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
});
