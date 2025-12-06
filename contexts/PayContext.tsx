import { FIRST_SUBSCRIPTION_PLACEMENT } from '@/constants/adapty';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { AdaptyPaywall, AdaptyProfile, adapty } from 'react-native-adapty';
import { createPaywallView } from 'react-native-adapty/dist/ui';

// Global singleton flags - Adapty'nin yalnızca bir kez activate edilmesini garanti eder
let isAdaptyActivating = false;
let isAdaptyActivated = false;
let activationPromise: Promise<void> | null = null;

const activateAdapty = async (): Promise<void> => {
  // Eğer zaten activate edildiyse, hemen dön
  if (isAdaptyActivated) {
    return;
  }

  // Eğer şu anda activate ediliyorsa, mevcut promise'i bekle
  if (isAdaptyActivating && activationPromise) {
    return activationPromise;
  }

  isAdaptyActivating = true;

  activationPromise = (async () => {
    const key = process.env.EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY || '';
    if (!key) {
      console.warn('⚠️ Adapty key bulunamadı!');
      isAdaptyActivating = false;
      isAdaptyActivated = true;
      throw new Error('Adapty key not found');
    }

    try {
      console.log('🔵 Adapty activate ediliyor...');
      
      // Timeout ile Adapty activation - 10 saniye içinde tamamlanmazsa devam et
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Adapty activation timeout')), 10000);
      });
      
      const activationPromise = adapty.activate(key, { lockMethodsUntilReady: false });
      
      try {
        await Promise.race([activationPromise, timeoutPromise]);
        console.log('✅ Adapty başarıyla activate edildi');
      } catch (timeoutError) {
        console.warn('⚠️ Adapty activation timeout, devam ediliyor...');
        // Timeout olsa bile devam et
      }
      
      isAdaptyActivated = true;
      isAdaptyActivating = false;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Adapty activation hatası:', errorMessage);
      isAdaptyActivating = false;
      isAdaptyActivated = true; // Hata durumunda da flag'i set et ki tekrar denemesin
      // Hata olsa bile throw etme, app çalışmaya devam etsin
    }
  })();

  return activationPromise;
};

// Yeni arayüzler ve tipler
interface ShowPaywallOptions {
    placementId?: string;
    condition?: () => Promise<boolean>;
    onSuccess?: (purchase: any) => void;
    onFailure?: (error: Error) => void;
    onClose?: () => void;
    onPresent?: (paywall: AdaptyPaywall) => void;
    trackingContext?: Record<string, any>;
}

interface PayContextType {
    isSubscribed: boolean;
    loading: boolean;
    error: Error | null;
    isReady: boolean;
    checkSubscription: () => Promise<void>;
    showPaywall: (options: ShowPaywallOptions) => Promise<void>;
    reStorePurchases: () => Promise<void>;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

const PayProvider = ({ children }: { children: React.ReactNode }) => {
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [isReady, setIsReady] = useState<boolean>(isAdaptyActivated);

    // Paywall view'ı için ref'i tutuyoruz, sadece bir tane aktif olabilir.
    const paywallViewRef = useRef<any | null>(null);

    // Adapty'yi initialize et
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            try {
                await activateAdapty();
                if (isMounted) {
                    setIsReady(true);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                    setIsReady(true); // Hata durumunda da devam et
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, []);

    const checkSubscription = async () => {
        if (!isReady) return;
        setLoading(true);
        try {
            const profile: AdaptyProfile = await adapty.getProfile();
            const hasActiveSubscription = Object.values(profile.accessLevels || {}).some(level => level.isActive);
            setIsSubscribed(hasActiveSubscription);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error checking subscription'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isReady) {
            checkSubscription();
        }
    }, [isReady]);

    const showPaywall = async (options: ShowPaywallOptions) => {
        const {
            placementId = FIRST_SUBSCRIPTION_PLACEMENT,
            condition,
            onSuccess,
            onFailure,
            onClose,
            onPresent,
            trackingContext = {}
        } = options;
        if (condition && !(await condition())) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const paywall = await adapty.getPaywall(placementId);
            console.log('Paywall fetched:', JSON.stringify(paywall, null, 2));

            try {
                const products = await adapty.getPaywallProducts(paywall);
                console.log('Paywall products fetched:', JSON.stringify(products, null, 2));
            } catch (productError) {
                console.error('Error fetching paywall products explicitly:', productError);
            }

            const view = await createPaywallView(paywall);
            paywallViewRef.current = view;
            console.log('Paywall view created:', view);
            // 3. Olay dinleyicilerini (event handlers) ayarla
            view.registerEventHandlers({
                onPurchaseCompleted: (purchase: any) => {
                    if (purchase?.profile?.accessLevels?.['premium']?.isActive) {
                        setIsSubscribed(true);
                        onSuccess?.(purchase);
                    } else {
                        // Satın alma başarılı ama yetki gelmedi durumu
                        onFailure?.(new Error('Purchase succeeded but no access level was granted.'));
                    }
                    view.dismiss();
                },
                onPurchaseFailed: (err) => {
                    setError(err);
                    onFailure?.(err);
                    view.dismiss();
                },
                onPaywallClosed: () => {
                    onClose?.();
                },
                onUrlPress: (url) => {
                    Linking.openURL(url);
                    return false; // Paywall'u açık tut
                }
            });

            // 4. Paywall'u göster
            await view.present();
            setLoading(false);
            onPresent?.(paywall);

        } catch (err: any) {
            console.error('err paywall4', err);
            setError(err);
            setLoading(false);
            onFailure?.(err);
        }
    };

    const reStorePurchases = async (): Promise<void> => {
        setLoading(true);
        try {
            await adapty.restorePurchases();
            await checkSubscription();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error during restore'));
        } finally {
            setLoading(false);
        }
    };

    const value = {
        isSubscribed,
        loading,
        error,
        isReady,
        checkSubscription,
        showPaywall,
        reStorePurchases
    };

    return <PayContext.Provider value={value}>{children}</PayContext.Provider>;
};

const usePay = () => {
    const context = useContext(PayContext);
    if (context === undefined) {
        throw new Error('usePay must be used within a PayProvider');
    }
    return context;
};

export { usePay };
export default PayProvider;