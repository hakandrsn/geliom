import { useGroupContext } from '@/contexts/GroupContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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

      // Gruplar yüklü değilse bekle
      if (groups.length === 0) {
        console.warn('⚠️ Gruplar henüz yüklenmedi, bekleniyor...');
        // Bir süre sonra tekrar dene (basit retry mekanizması)
        setTimeout(() => {
          const group = groups.find(g => g.id === groupId);
          if (group) {
            handleGroupNavigation(group);
          }
        }, 1000);
        return;
      }

      // Grubu bul
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        console.warn('⚠️ Grup bulunamadı:', groupId);
        return;
      }

      handleGroupNavigation(group);
    };

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

    // Event listener'ı ekle
    OneSignal.Notifications.addEventListener('click', clickHandler);

    // Cleanup
    return () => {
      OneSignal.Notifications.removeEventListener('click', clickHandler);
    };
  }, [router, setSelectedGroup, groups]);

  // Bu component görünmez (sadece handler)
  return null;
}

