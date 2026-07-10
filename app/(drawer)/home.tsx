import React from "react";

// Contexts & Theme
import { useTheme } from "@/contexts/ThemeContext";
import { useAppStore } from "@/store/useAppStore";

// Components
import { useGroupSession } from "@/api/groups";
import { DashboardView, EmptyStateView } from "@/components/dashboard";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { BaseLayout } from "@/components/shared";

export default function HomeScreen() {
  const { groups, currentGroupId, isLoading } = useAppStore();
  const selectedGroup = groups.find((g) => g.id === currentGroupId);
  const { colors } = useTheme();

  // Grup ekranı açıkken socket session'ı canlı tutulur:
  // tüm üye/status/mood verisi ve patch'ler buradan store'a akar.
  useGroupSession(selectedGroup?.id);

  // İçerik Render Mantığı
  const renderContent = () => {
    if (isLoading) {
      return <DashboardSkeleton />;
    }

    if (selectedGroup) {
      return <DashboardView group={selectedGroup} />;
    }

    // Grup seçili değilse genel karşılama ekranı
    return <EmptyStateView />;
  };

  return (
    <BaseLayout headerShow={false} backgroundColor={colors.background}>
      {renderContent()}
    </BaseLayout>
  );
}
