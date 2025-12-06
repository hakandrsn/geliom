import { useUserGroups } from '@/api/groups';
import { useAuth } from '@/contexts/AuthContext';
import type { GroupWithOwner } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const SELECTED_GROUP_STORAGE_KEY = '@geliom:selected_group_id';

interface GroupContextValue {
  selectedGroup: GroupWithOwner | null;
  setSelectedGroup: (group: GroupWithOwner | null) => Promise<void>;
  isLoading: boolean;
  groups: GroupWithOwner[];
  refetchGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextValue>({
  selectedGroup: null,
  setSelectedGroup: async () => {},
  isLoading: true,
  groups: [],
  refetchGroups: async () => {},
});

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroupState] = useState<GroupWithOwner | null>(null);

  // Kullanıcının tüm gruplarını fetch et
  const { data: groups = [], isLoading: groupsLoading, error: groupsError, refetch } = useUserGroups(user?.id || '');

  // AsyncStorage'dan seçili grup ID'sini yükle (sadece bir kez, gruplar yüklendiğinde)
  useEffect(() => {
    const loadSelectedGroup = async () => {
      if (!user?.id || groupsLoading || groups.length === 0) return;

      try {
        const storedGroupId = await AsyncStorage.getItem(SELECTED_GROUP_STORAGE_KEY);
        
        if (storedGroupId) {
          const group = groups.find(g => g.id === storedGroupId);
          if (group) {
            setSelectedGroupState(group);
            return;
          }
        }

        // Eğer stored group bulunamadıysa veya yoksa, ilk grubu seç
        if (groups.length > 0) {
          const firstGroup = groups[0];
          setSelectedGroupState(firstGroup);
          await AsyncStorage.setItem(SELECTED_GROUP_STORAGE_KEY, firstGroup.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error loading selected group:', errorMessage);
      }
    };

    loadSelectedGroup();
  }, [user?.id, groups, groupsLoading]);

  // Seçili grubu set et ve AsyncStorage'a kaydet
  const setSelectedGroup = useCallback(async (group: GroupWithOwner | null) => {
    try {
      setSelectedGroupState(group);
      if (group) {
        await AsyncStorage.setItem(SELECTED_GROUP_STORAGE_KEY, group.id);
      } else {
        await AsyncStorage.removeItem(SELECTED_GROUP_STORAGE_KEY);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving selected group:', errorMessage);
    }
  }, []);

  // Grupları yeniden fetch et
  const refetchGroups = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error refetching groups:', errorMessage);
    }
  }, [refetch]);

  // Gruplar değiştiğinde, seçili grup hala geçerli mi kontrol et
  useEffect(() => {
    if (selectedGroup && groups.length > 0) {
      const isStillValid = groups.some(g => g.id === selectedGroup.id);
      if (!isStillValid) {
        // Seçili grup artık geçerli değilse, ilk grubu seç
        if (groups.length > 0) {
          setSelectedGroup(groups[0]);
        } else {
          setSelectedGroup(null);
        }
      }
    } else if (!selectedGroup && groups.length > 0) {
      // Eğer seçili grup yoksa ama gruplar varsa, ilkini seç
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup, setSelectedGroup]);

  // Context value'yu memoize et - groups array referansı değiştiğinde güncellenir
  // structuralSharing: false sayesinde her zaman yeni array referansı gelir
  const value: GroupContextValue = useMemo(() => {
    // Eğer gruplar cache'ten gelip dolu ise, loading false olsun
    // Bu sayede cache'ten hemen veri gösterebiliriz
    const effectiveLoading = groupsLoading && groups.length === 0;
    
    return {
      selectedGroup,
      setSelectedGroup,
      isLoading: effectiveLoading,
      groups,
      refetchGroups,
    };
  }, [selectedGroup, setSelectedGroup, groupsLoading, groups, refetchGroups]);

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export const useGroupContext = (): GroupContextValue => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  
  return context;
};

