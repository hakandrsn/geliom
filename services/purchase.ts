import { useAppStore } from "@/store/useAppStore";
import { Linking } from "react-native";
import { adapty, createPaywallView } from "react-native-adapty";

// const FIRST_SUBSCRIPTION_PLACEMENT = "PLACEMENT_ID"; // If constant file missing

let isAdaptyActivated = false;
let isAdaptyActivating = false;
let activationPromise: Promise<void> | null = null;
// let paywallViewRef: any | null = null;

export const activateAdapty = async (): Promise<void> => {
  if (isAdaptyActivated) return;
  if (isAdaptyActivating && activationPromise) return activationPromise;

  isAdaptyActivating = true;

  activationPromise = (async () => {
    const key = process.env.EXPO_PUBLIC_ADAPTY_PUBLIC_SDK_KEY;
    if (!key) {
      console.warn("Adapty key missing");
      isAdaptyActivating = false;
      return;
    }

    try {
      await adapty.activate(key, { lockMethodsUntilReady: false });
      isAdaptyActivated = true;
      console.log("✅ Adapty activated");
    } catch (error) {
      console.error("Adapty activation error", error);
    } finally {
      isAdaptyActivating = false;
    }
  })();

  return activationPromise;
};

export const checkSubscription = async (): Promise<boolean> => {
  if (!isAdaptyActivated && !isAdaptyActivating) {
    await activateAdapty();
  }

  try {
    const profile = await adapty.getProfile();
    const hasActive = Object.values(profile.accessLevels || {}).some(
      (l) => l.isActive,
    );
    // Sync with store
    useAppStore.getState().setSubscribed(hasActive);
    return hasActive;
  } catch (error) {
    console.error("Check subscription error", error);
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  try {
    await adapty.restorePurchases();
    return await checkSubscription();
  } catch (error) {
    console.error("Restore error", error);
    return false;
  }
};

// Simplified showPaywall for now
export interface ShowPaywallOptions {
  placementId?: string;
  onSuccess?: (purchase: any) => void;
  onFailure?: (error: any) => void;
}

export const showPaywall = async (options: ShowPaywallOptions = {}) => {
  const { placementId = "placement-id", onSuccess, onFailure } = options;
  // Note: use actual constant for placementId

  try {
    if (!isAdaptyActivated) await activateAdapty();

    const paywall = await adapty.getPaywall(placementId);
    const view = await createPaywallView(paywall);
    // paywallViewRef = view;

    view.setEventHandlers({
      onPurchaseCompleted: (purchase, product) => {
        (async () => {
          try {
            // Safe check using getProfile or verify purchase object
            const profile = await adapty.getProfile();
            if (profile.accessLevels?.["premium"]?.isActive) {
              useAppStore.getState().setSubscribed(true);
              onSuccess?.(purchase);
            } else {
              onFailure?.(new Error("No access level granted"));
            }
          } catch (e) {
            console.error("Purchase handling error", e);
            onFailure?.(e);
          }
          view.dismiss();
        })();
        return true; // or whatever the expected return type is, often void or boolean
      },
      onPurchaseFailed: (error) => {
        onFailure?.(error);
        view.dismiss();
      },
      onPaywallClosed: () => {
        view.dismiss();
      },
      onUrlPress: (url) => {
        Linking.openURL(url);
        return false;
      },
    });

    await view.present();
  } catch (error) {
    console.error("Show paywall error", error);
    onFailure?.(error);
  }
};
