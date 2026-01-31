import { BaseLayout, Typography } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function EditMember() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse memberData if it exists
  const memberData = params.memberData
    ? JSON.parse(params.memberData as string)
    : null;

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
            Üye Düzenle
          </Typography>
        ),
        backgroundColor: colors.background,
      }}
    >
      <View style={styles.container}>
        {memberData ? (
          <View style={{ padding: 16 }}>
            <Typography variant="body" color={colors.text}>
              Üye: {memberData.user?.display_name || memberData.user_id}
            </Typography>
            <Typography variant="caption" color={colors.secondaryText}>
              (Düzenleme özellikleri yapım aşamasında)
            </Typography>
          </View>
        ) : (
          <Typography variant="body" color={colors.error}>
            Üye bilgisi bulunamadı
          </Typography>
        )}
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
