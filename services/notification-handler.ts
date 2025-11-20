import { OneSignal } from 'react-native-onesignal';

// Notification click handler'ı setup et
// Bu fonksiyon Provider.tsx'te çağrılacak
export const setupNotificationHandler = () => {
  // Notification açıldığında (kullanıcı bildirime tıkladığında)
  OneSignal.Notifications.addEventListener('click', async (event) => {
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

    // Navigation için router ve group context'e ihtiyacımız var
    // Bu handler'ı bir component içinde setup etmeliyiz
    // Şimdilik sadece log, gerçek navigation'ı NotificationHandler component'inde yapacağız
  });
};

