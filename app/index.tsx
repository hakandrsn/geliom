import { SplashScreen as CustomSplashScreen } from "@/components/shared";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

export default function Index() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');

                if (hasSeen !== 'true') {
                    router.replace('/onboarding');
                }
                // Else durumunda bir şey yapmaya gerek yok,
                // _layout.tsx içindeki useAppInitialization ve router.replace devreye girecek.
                // Sadece splash'i gizleyip CustomSplashScreen'in görünmesini sağlıyoruz.
            } catch (e) {
                console.error(e);
            } finally {
                await SplashScreen.hideAsync();
                setIsReady(true);
            }
        };

        checkOnboarding();
    }, [router]);

    // Native splash gizlendikten sonra JS splash gösterilir
    // _layout.tsx yönlendirmeyi yapana kadar bu ekranda kalır
    return <CustomSplashScreen />;
}