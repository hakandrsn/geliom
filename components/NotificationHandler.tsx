import { useGroupContext } from '@/contexts/GroupContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { OneSignal } from 'react-native-onesignal';

/**
 * NotificationHandler Component
 * 
 * OneSignal bildirimlerini handle eder:
 * - Bildirime tıklandığında ilgili gruba yönlendirir
 * - GroupContext'i kullanarak grubu seçer
 */
export function NotificationHandler() {
  const router = useRouter();
  const { setSelectedGroup, groups } = useGroupContext();
  const groupsRef = useRef(groups);
  const pendingGroupIdRef = useRef<string | null>(null);

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
      // Grubu seç
      await setSelectedGroup(group);
      console.log('✅ Grup seçildi:', group.name);

      // Ana sayfaya yönlendir
      router.push('/(drawer)/home');
      console.log('✅ Ana sayfaya yönlendirildi');
    } catch (error) {
      console.error('❌ Grup seçme hatası:', error);
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

      console.log('✅ Grup bilgisi alındı:', { groupId, groupName });

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
        // Belki de yeni katıldı ve liste güncellenmedi?
        // Yine de pending'e atabiliriz, belki liste güncellenir
        pendingGroupIdRef.current = groupId;
        return;
      }

      handleGroupNavigation(group);
    };

    // Event listener'ı ekle
    OneSignal.Notifications.addEventListener('click', clickHandler);

    // Cleanup
    return () => {
      OneSignal.Notifications.removeEventListener('click', clickHandler);
    };
  }, []); // Empty dependency array - handler is stable

  // Bu component görünmez (sadece handler)
  return null;
}

