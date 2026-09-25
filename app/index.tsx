import { Button, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from "@/services/auth";
import { useAppStore } from "@/store/useAppStore";
import { layout, spacing } from "@/theme/tokens";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { colors } = useTheme();
  const { firebaseUser, user, isLoading, error } = useAppStore();

  // Firebase girişi var ama backend user henüz gelmedi — _layout 5 sn'de bir
  // yeniden dener. Kullanıcı burada kilitli kalmasın diye çıkış seçeneği var.
  const waitingForBackend = !!firebaseUser && !user && !isLoading;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        paddingHorizontal: layout.screenPadding,
        gap: spacing.lg,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {waitingForBackend && (
        <>
          <Typography
            variant="caption"
            style={{ color: colors.lightText, textAlign: "center" }}
          >
            {error ?? "Sunucuya bağlanılıyor, lütfen bekleyin…"}
          </Typography>
          {error && (
            <Button
              variant="outline"
              title="Çıkış yap"
              onPress={() => {
                signOut().catch(() => {});
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
