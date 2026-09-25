import { disconnectSocket, initSocket } from "@/api/socket";
import { loginOneSignal, logoutOneSignal } from "@/services/onesignal";
import { logoutAdapty } from "@/services/purchase";

/**
 * KULLANICI OTURUMUNA BAĞLI CANLI SERVİSLERİN TEK GİRİŞ NOKTASI.
 *
 * Login sonrası `connectUserServices`, logout'ta `disconnectUserServices`
 * çağrılır; socket ve push hedeflemesi (OneSignal external ID = Firebase UID)
 * başka hiçbir yerden yönetilmez. Tüm ortam bilgisi `config/app.config.ts`'ten gelir.
 */
export interface UserConnectionParams {
  /** Firebase UID — OneSignal external user ID olarak kullanılır */
  userId: string;
  /**
   * Firebase ID token provider'ı. Token ~1 saatte expire olduğu için
   * socket her (re)connect'te bu fonksiyonla taze token alır.
   */
  getToken: () => Promise<string>;
}

export const connectUserServices = ({ userId, getToken }: UserConnectionParams) => {
  // Socket: session katmanı + hedefli event'ler (premium:update vb.)
  initSocket(getToken);

  // Push: backend hedeflemeyi Firebase UID ile yapar
  loginOneSignal(userId).catch((error) => {
    console.error("❌ OneSignal login hatası:", error);
  });
};

export const disconnectUserServices = () => {
  disconnectSocket();
  logoutOneSignal();
  void logoutAdapty();
};
