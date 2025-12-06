import { SplashScreen as CustomSplashScreen } from "@/components/shared";
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

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
  const router = useRouter();

  useEffect(() => {
    // OAuth callback URL'i handle ediliyor (provider-auth.ts'te)
    // Auth state change listener otomatik routing yapacak
    // Bu sayfa sadece geçici bir placeholder
    console.log('🔵 OAuth callback sayfası yüklendi, auth state değişikliği bekleniyor...');
  }, []);

  // Auth state change listener routing yapana kadar splash screen göster
  return <CustomSplashScreen />;
}

