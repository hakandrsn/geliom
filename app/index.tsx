import Typography from "@/components/shared/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";
import { spacing } from "@/theme/tokens";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { colors } = useTheme();
  const { firebaseUser, user, isLoading } = useAppStore();

  // Firebase girişi var ama backend user henüz gelmedi — sync ağ hatasında
  // _layout otomatik yeniden dener; kullanıcıya beklediğini söyle.
  const waitingForBackend = !!firebaseUser && !user && !isLoading;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        gap: spacing.lg,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {waitingForBackend && (
        <Typography variant="caption" style={{ color: colors.lightText }}>
          Sunucuya bağlanılıyor, lütfen bekleyin…
        </Typography>
      )}
    </View>
  );
}
