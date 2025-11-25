import { FIRST_SUBSCRIPTION_PLACEMENT } from '@/constants/adapty';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { AdaptyPaywall, AdaptyProfile, adapty } from 'react-native-adapty';
import { createPaywallView } from 'react-native-adapty/dist/ui';


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
    const [isReady, setIsReady] = useState<boolean>(false);

    // Paywall view'ı için ref'i tutuyoruz, sadece bir tane aktif olabilir.
    const paywallViewRef = useRef<any | null>(null);

    // Adapty'nin başlatılmasını bekle
    useEffect(() => {
        const initializeAdapty = async () => {
            try {
                // Adapty'nin hazır olmasını bekle
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsReady(true);
            } catch (err) {
                console.error('Adapty initialization error:', err);
                setIsReady(true); // Hata durumunda da devam et
            }
        };

        initializeAdapty();
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
            const view = await createPaywallView(paywall);
            paywallViewRef.current = view;

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