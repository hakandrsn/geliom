import { useAuth } from "@/contexts/AuthContext";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

export default function Index() {
    const router = useRouter();

    // 1. Fontları Yükle
    const [fontsLoaded] = useFonts({
        'Comfortaa-Light': require('@/assets/fonts/Comfortaa-Light.ttf'),
        'Comfortaa-Regular': require('@/assets/fonts/Comfortaa-Regular.ttf'),
        'Comfortaa-Medium': require('@/assets/fonts/Comfortaa-Medium.ttf'),
        'Comfortaa-SemiBold': require('@/assets/fonts/Comfortaa-SemiBold.ttf'),
        'Comfortaa-Bold': require('@/assets/fonts/Comfortaa-Bold.ttf'),
    });

    // 2. Auth Durumunu Al
    const { session, user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        // Herhangi bir yükleme işlemi devam ediyorsa bekle (Fontlar veya Auth)
        if (!fontsLoaded || authLoading) {
            return;
        }

        const performNavigation = async () => {
            try {
                // Senaryo 1: Oturum yok -> Login
                if (!session) {
                    router.replace("/(auth)/login");
                }
                // Senaryo 2: Oturum var ama User profili yüklenemedi (Nadir hata durumu) -> Login
                else if (session && !user) {
                    // Burada opsiyonel olarak bir hata ekranı da gösterilebilir ama
                    // güvenli olan tekrar girişe yönlendirmektir.
                    console.warn("Session var ama User yok, login'e yönlendiriliyor.");
                    router.replace("/(auth)/login");
                }
                // Senaryo 3: User var, Onboarding tamamlanmamış -> Onboarding
                else if (user && !user.has_completed_onboarding) {
                    router.replace("/onboarding");
                }
                // Senaryo 4: Her şey tamam -> Home
                else {
                    router.replace("/(drawer)/home");
                }
            } catch (e) {
                console.error("Yönlendirme hatası:", e);
            } finally {
                // Yönlendirme komutu verildikten sonra Splash'i kaldır
                await SplashScreen.hideAsync();
            }
        };

        performNavigation();

    }, [fontsLoaded, authLoading, session, user, router]);

    // Kullanıcıya hiçbir şey gösterme, Splash Screen zaten üstte
    return null;
}