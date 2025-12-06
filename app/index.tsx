import { SplashScreen as CustomSplashScreen } from "@/components/shared";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

export default function Index() {
  // App initialization - tüm kritik verileri yükle (auth + groups)
  const { isInitialized, isLoading } = useAppInitialization();

  // Native splash screen'i gizle
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Not: Routing mantığı _layout.tsx'te yapılıyor
  // Bu sayfa sadece veriler yüklenene kadar splash screen gösterir
  // isInitialized true ve isLoading false olunca, _layout routing yapacak

  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log('✅ Index: App initialization tamamlandı (auth + groups), _layout routing yapacak');
    } else {
      console.log('🔵 Index: Loading state - isInitialized:', isInitialized, 'isLoading:', isLoading);
    }
  }, [isInitialized, isLoading]);

  // Veriler yüklenene kadar splash screen göster
  // index.tsx her zaman splash screen gösterir, routing _layout'ta olur
  return <CustomSplashScreen />;
}