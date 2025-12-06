import { groupKeys } from '@/api/groups';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupContext } from '@/contexts/GroupContext';
import { setSelectedGroupId } from '@/utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { OneSignal } from 'react-native-onesignal';

/**
 * NotificationHandler Component
 * 
 * OneSignal bildirimlerini handle eder:
 * - Bildirime tıklandığında ilgili gruba yönlendirir
 * - GroupContext'i kullanarak grubu seçer
 * - AsyncStorage'ı günceller
 * - Grup bulunamadığında grupları refresh eder
 */
export function NotificationHandler() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedGroup, groups } = useGroupContext();
  const queryClient = useQueryClient();
  const groupsRef = useRef(groups);
  const pendingGroupIdRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRY = 3;

  // Update ref when groups change
  useEffect(() => {
    groupsRef.current = groups;

    // Check if we have a pending navigation
    if (pendingGroupIdRef.current && groups.length > 0) {
      const group = groups.find((g: any) => g.id === pendingGroupIdRef.current);
      if (group) {
        console.log('🔄 Pending navigation executing for group:', group.name);
        handleGroupNavigation(group);
        pendingGroupIdRef.current = null;
      }
    }
  }, [groups]);

  const handleGroupNavigation = async (group: any) => {
    try {
      // Grubu seç (context)
      await setSelectedGroup(group);
      console.log('✅ Grup seçildi:', group.name);

      // AsyncStorage'ı da güncelle
      await setSelectedGroupId(group.id);
      console.log('✅ AsyncStorage güncellendi:', group.id);

      // Retry counter'ı sıfırla
      retryCountRef.current = 0;

      // Ana sayfaya yönlendir
      router.push('/(drawer)/home');
      console.log('✅ Ana sayfaya yönlendirildi');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Grup seçme hatası:', errorMessage);
    }
  };

  useEffect(() => {
    // Notification click handler
    const clickHandler = async (event: any) => {
      console.log('🔔 OneSignal notification clicked:', event);

      // additionalData'dan grup bilgisini al
      const additionalData = event.notification.additionalData;
      const groupId = additionalData?.group_id as string | undefined;
      const groupName = additionalData?.group_name as string | undefined;

      if (!groupId) {
        console.warn('⚠️ Bildirimde group_id bulunamadı');
        return;
      }

      console.log('✅ Grup bilgisi alındı:', groupId);

      const currentGroups = groupsRef.current;

      // Gruplar yüklü değilse bekle
      if (currentGroups.length === 0) {
        console.warn('⚠️ Gruplar henüz yüklenmedi, navigasyon kuyruğa alındı...');
        pendingGroupIdRef.current = groupId;
        return;
      }

      // Grubu bul
      const group = currentGroups.find(g => g.id === groupId);
      if (!group) {
        console.warn('⚠️ Grup bulunamadı (listede yok):', groupId);
        
        // Retry mekanizması: Grupları refresh et
        if (retryCountRef.current < MAX_RETRY && user?.id) {
          retryCountRef.current += 1;
          // Grupları yenileme denemesi
          
          // Grupları refresh et
          await queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(user.id) });
          
          // Pending'e ekle, bir sonraki güncelleme geldiğinde denenecek
          pendingGroupIdRef.current = groupId;
          
          // Biraz bekle ve tekrar dene
          setTimeout(() => {
            const refreshedGroups = groupsRef.current;
            const foundGroup = refreshedGroups.find(g => g.id === groupId);
            if (foundGroup) {
              console.log('✅ Grup refresh sonrası bulundu:', foundGroup.name);
              handleGroupNavigation(foundGroup);
              pendingGroupIdRef.current = null;
            }
          }, 1000);
          return;
        }
        
        // Max retry'a ulaşıldıysa veya user yoksa
        console.error('❌ Grup bulunamadı ve retry limit aşıldı:', groupId);
        retryCountRef.current = 0;
        pendingGroupIdRef.current = null;
        return;
      }

      handleGroupNavigation(group);
    };

    // Event listener'ı güvenli şekilde ekle
    try {
      OneSignal.Notifications.addEventListener('click', clickHandler);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ NotificationHandler: Click listener hatası:', errorMessage);
    }

    // Cleanup
    return () => {
      try {
        OneSignal.Notifications.removeEventListener('click', clickHandler);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []); // Empty dependency array - handler is stable

  // Bu component görünmez (sadece handler)
  return null;
}

