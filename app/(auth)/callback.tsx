import { SplashScreen as CustomSplashScreen } from "@/components/shared";
import React from "react";

/**
 * OAuth Callback Handler
 *
 * Google/Apple OAuth'dan döndükten sonra bu sayfaya yönlendiriliyor.
 * URL'den tokens alınıp session oluşturulana kadar splash screen gösteriliyor.
 *
 * NOT: Token parsing ve session oluşturma işlemi provider-auth.ts'te yapılıyor.
 * Bu sayfa sadece OAuth callback URL'ini handle etmek için var.
 *
 * Auth state change listener otomatik olarak home'a yönlendirecek.
 */
export default function AuthCallback() {
  // Global routing (_layout.tsx) session değişimini algılayıp yönlendirme yapacak
  return <CustomSplashScreen />;
}
