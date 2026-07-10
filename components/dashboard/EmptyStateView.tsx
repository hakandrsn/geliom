import { groupKeys } from "@/api";
import { Button, GeliomButton } from "@/components/shared";
import { EmptyState } from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";

export default function EmptyStateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Gruplar yenilenirken hata oluştu:", errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <EmptyState
      fullScreen
      icon="people-outline"
      title="Hoş Geldin!"
      description="Henüz bir grubun seçili değil veya bir gruba üye değilsin. Arkadaşlarınla ve ailenle bağlantıda kalmak için bir grup oluştur veya katıl."
    >
      <Button
        variant="gradient"
        title="Yeni Grup Oluştur"
        onPress={() => router.push("/create-group")}
      />
      <Button
        variant="outline"
        title="Gruba Katıl"
        onPress={() => router.push("/join-group")}
      />
      <GeliomButton
        state={isRefreshing ? "loading" : "passive"}
        size="medium"
        layout="full-width"
        icon="refresh"
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        Gruplarımı Kontrol Et
      </GeliomButton>
    </EmptyState>
  );
}
