import { useMoods } from '@/api/moods';
import { useCustomStatuses, useDefaultStatuses } from '@/api/statuses';
import { BaseLayout, GeliomButton, Typography } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Mood, Status } from '@/types/database';
import { getMoodOrder, getStatusOrder, saveMoodOrder, saveStatusOrder } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

type ItemType = Status | Mood;

export default function ReorderStatusMoodScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedGroup } = useGroupContext();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'status' | 'mood'>('status');
  const [statusOrder, setStatusOrder] = useState<number[]>([]);
  const [moodOrder, setMoodOrder] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Status ve mood verilerini çek
  const { data: defaultStatuses = [] } = useDefaultStatuses();
  const { data: customStatuses = [] } = useCustomStatuses(selectedGroup?.id || '', user?.id);
  const { data: allMoods = [] } = useMoods(selectedGroup?.id);

  // Local storage'dan sıralamayı yükle
  useEffect(() => {
    const loadOrders = async () => {
      if (user?.id) {
        const [statusOrderData, moodOrderData] = await Promise.all([
          getStatusOrder(user.id),
          getMoodOrder(user.id),
        ]);
        setStatusOrder(statusOrderData);
        setMoodOrder(moodOrderData);
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [user?.id]);

  // Status'leri birleştir ve sırala (tüm status'ler - custom + default)
  const sortedStatuses = useMemo(() => {
    const allStatuses = [...customStatuses, ...defaultStatuses];
    
    if (statusOrder.length === 0) {
      // Sıralama yoksa: Custom'lar önce, sonra default'lar
      return allStatuses;
    }
    
    const ordered: Status[] = [];
    const unordered: Status[] = [];
    
    // Sıralamaya göre tüm status'leri ekle (custom + default)
    statusOrder.forEach((statusId) => {
      const status = allStatuses.find(s => s.id === statusId);
      if (status) {
        ordered.push(status);
      }
    });
    
    // Sıralamada olmayan status'leri sona ekle
    allStatuses.forEach((status) => {
      if (!statusOrder.includes(status.id) && !ordered.find(s => s.id === status.id)) {
        unordered.push(status);
      }
    });
    
    return [...ordered, ...unordered];
  }, [customStatuses, defaultStatuses, statusOrder]);

  // Mood'ları sırala (tüm mood'lar - custom + default)
  const sortedMoods = useMemo(() => {
    if (moodOrder.length === 0) {
      // Sıralama yoksa: Custom'lar önce, sonra default'lar
      const customMoods = allMoods.filter(m => m.group_id != null);
      const defaultMoods = allMoods.filter(m => m.group_id == null);
      return [...customMoods, ...defaultMoods];
    }
    
    const ordered: Mood[] = [];
    const unordered: Mood[] = [];
    
    // Sıralamaya göre tüm mood'ları ekle (custom + default)
    moodOrder.forEach((moodId) => {
      const mood = allMoods.find(m => m.id === moodId);
      if (mood) {
        ordered.push(mood);
      }
    });
    
    // Sıralamada olmayan mood'ları sona ekle
    allMoods.forEach((mood) => {
      if (!moodOrder.includes(mood.id) && !ordered.find(m => m.id === mood.id)) {
        unordered.push(mood);
      }
    });
    
    return [...ordered, ...unordered];
  }, [allMoods, moodOrder]);

  const handleStatusDragEnd = ({ data }: { data: Status[] }) => {
    const newOrder = data.map(s => s.id);
    setStatusOrder(newOrder);
    setHasChanges(true);
  };

  const handleMoodDragEnd = ({ data }: { data: Mood[] }) => {
    const newOrder = data.map(m => m.id);
    setMoodOrder(newOrder);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      await Promise.all([
        saveStatusOrder(user.id, statusOrder),
        saveMoodOrder(user.id, moodOrder),
      ]);
      setHasChanges(false);
      router.back();
    } catch (error) {
      console.error('Sıralama kaydetme hatası:', error);
    }
  };

  const renderStatusItem = ({ item, drag, isActive }: RenderItemParams<Status>) => {
    const isCustom = item.is_custom;
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.item,
            {
              backgroundColor: colors.cardBackground,
              borderColor: isActive ? colors.primary : colors.stroke,
              opacity: isActive ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.itemContent}>
            <Ionicons name="reorder-three-outline" size={24} color={colors.secondaryText} style={styles.dragHandle} />
            {item.emoji && (
              <Typography variant="h6" style={{ marginRight: 8 }}>{item.emoji}</Typography>
            )}
            <Typography variant="body" color={colors.text} style={{ flex: 1 }}>
              {item.text}
            </Typography>
            {isCustom && (
              <Ionicons name="star" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderMoodItem = ({ item, drag, isActive }: RenderItemParams<Mood>) => {
    const isCustom = item.group_id != null;
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.item,
            {
              backgroundColor: colors.cardBackground,
              borderColor: isActive ? colors.primary : colors.stroke,
              opacity: isActive ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.itemContent}>
            <Ionicons name="reorder-three-outline" size={24} color={colors.secondaryText} style={styles.dragHandle} />
            {item.emoji && (
              <Typography variant="h6" style={{ marginRight: 8 }}>{item.emoji}</Typography>
            )}
            <Typography variant="body" color={colors.text} style={{ flex: 1 }}>
              {item.text}
            </Typography>
            {isCustom && (
              <Ionicons name="star" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (isLoading) {
    return (
      <BaseLayout
        headerShow={true}
        header={{
          leftIcon: {
            icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
            onPress: () => router.back(),
          },
          title: <Typography variant="h5" color={colors.text}>Sıralama</Typography>,
          backgroundColor: colors.background,
          style: { borderBottomWidth: 0 },
        }}
      >
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      headerShow={true}
      header={{
        leftIcon: {
          icon: <Ionicons name="arrow-back" size={24} color={colors.text} />,
          onPress: () => router.back(),
        },
        title: <Typography variant="h5" color={colors.text}>Sıralama</Typography>,
        rightIcon: hasChanges ? {
          icon: (
            <GeliomButton
              state="active"
              size="small"
              onPress={handleSave}
            >
              Kaydet
            </GeliomButton>
          ),
          onPress: handleSave,
        } : undefined,
        backgroundColor: colors.background,
        style: { borderBottomWidth: 0 },
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.cardBackground, borderColor: colors.stroke }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('status')}
            style={[
              styles.tab,
              activeTab === 'status' && { backgroundColor: colors.primary },
            ]}
          >
            <Typography
              variant="body"
              color={activeTab === 'status' ? colors.white : colors.text}
              fontWeight={activeTab === 'status' ? 'semibold' : 'regular'}
            >
              Status
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('mood')}
            style={[
              styles.tab,
              activeTab === 'mood' && { backgroundColor: colors.primary },
            ]}
          >
            <Typography
              variant="body"
              color={activeTab === 'mood' ? colors.white : colors.text}
              fontWeight={activeTab === 'mood' ? 'semibold' : 'regular'}
            >
              Mood
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Typography variant="caption" color={colors.secondaryText} style={{ textAlign: 'center', paddingHorizontal: 16 }}>
            Tüm status/mood'ları sürükleyip bırakarak sıralayabilirsiniz. Özel olanların yanında yıldız ikonu görünür.
          </Typography>
        </View>

        {/* Status List */}
        {activeTab === 'status' && (
          <View style={styles.listContainer}>
            <View style={styles.section}>
              <Typography variant="h6" color={colors.text} style={styles.sectionTitle}>
                Status'ler
              </Typography>
              <DraggableFlatList
                data={sortedStatuses}
                onDragEnd={handleStatusDragEnd}
                keyExtractor={(item) => `status-${item.id}`}
                renderItem={renderStatusItem}
                contentContainerStyle={styles.listContent}
              />
            </View>
          </View>
        )}

        {/* Mood List */}
        {activeTab === 'mood' && (
          <View style={styles.listContainer}>
            <View style={styles.section}>
              <Typography variant="h6" color={colors.text} style={styles.sectionTitle}>
                Mood'lar
              </Typography>
              <DraggableFlatList
                data={sortedMoods}
                onDragEnd={handleMoodDragEnd}
                keyExtractor={(item) => `mood-${item.id}`}
                renderItem={renderMoodItem}
                contentContainerStyle={styles.listContent}
              />
            </View>
          </View>
        )}
      </View>
    </BaseLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dragHandle: {
    marginRight: 12,
  },
});

