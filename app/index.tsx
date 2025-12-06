import { SplashScreen as CustomSplashScreen } from "@/components/shared";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <CustomSplashScreen />;
}