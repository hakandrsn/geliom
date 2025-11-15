import { useUserGroups } from '@/api/groups';
import { useAuth } from '@/contexts/AuthContext';
import type { GroupWithOwner } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const SELECTED_GROUP_STORAGE_KEY = '@geliom:selected_group_id';

interface GroupContextValue {
  selectedGroup: GroupWithOwner | null;
  setSelectedGroup: (group: GroupWithOwner | null) => Promise<void>;
  isLoading: boolean;
  groups: GroupWithOwner[];
}

const GroupContext = createContext<GroupContextValue>({
  selectedGroup: null,
  setSelectedGroup: async () => {},
  isLoading: true,
  groups: [],
});

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroupState] = useState<GroupWithOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kullanıcının tüm gruplarını fetch et
  const { data: groups = [], isLoading: groupsLoading } = useUserGroups(user?.id || '');

  // AsyncStorage'dan seçili grup ID'sini yükle
  useEffect(() => {
    const loadSelectedGroup = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const storedGroupId = await AsyncStorage.getItem(SELECTED_GROUP_STORAGE_KEY);
        
        if (storedGroupId && groups.length > 0) {
          const group = groups.find(g => g.id === storedGroupId);
          if (group) {
            setSelectedGroupState(group);
            setIsLoading(false);
            return;
          }
        }

        // Eğer stored group bulunamadıysa veya yoksa, ilk grubu seç
        if (groups.length > 0 && !selectedGroup) {
          const firstGroup = groups[0];
          setSelectedGroupState(firstGroup);
          await AsyncStorage.setItem(SELECTED_GROUP_STORAGE_KEY, firstGroup.id);
        }
      } catch (error) {
        console.error('Error loading selected group:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedGroup();
  }, [user?.id, groups, selectedGroup]);

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
      console.error('Error saving selected group:', error);
    }
  }, []);

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

  const value: GroupContextValue = {
    selectedGroup,
    setSelectedGroup,
    isLoading: isLoading || groupsLoading,
    groups,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export const useGroupContext = (): GroupContextValue => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupContext must be used within a GroupProvider');
  }
  return context;
};

