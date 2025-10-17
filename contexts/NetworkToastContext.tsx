import NetworkToast, { NetworkToastType } from "@/components/ui/NetworkToast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import React, { createContext, useContext, useState } from "react";

interface ToastState {
  visible: boolean;
  type: NetworkToastType;
  message: string;
}

interface NetworkToastContextType {
  showWeakConnectionToast: (message?: string) => void;
  showOfflineToast: (message?: string) => void;
  hideToast: () => void;
  checkAndShowToast: () => Promise<boolean>; // Returns true if connection is OK
}

const NetworkToastContext = createContext<NetworkToastContextType | undefined>(undefined);

const DEFAULT_MESSAGES = {
  weak: "Face not recognized in the photo. Please upload a clearer photo.",
  offline: "No social media profile found for this person. Please try another photo.",
};

export function NetworkToastProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    type: 'weak',
    message: '',
  });
  const { checkConnection } = useNetworkStatus();

  const showWeakConnectionToast = (message?: string) => {
    setToastState({
      visible: true,
      type: 'weak',
      message: message || DEFAULT_MESSAGES.weak,
    });
  };

  const showOfflineToast = (message?: string) => {
    setToastState({
      visible: true,
      type: 'offline',
      message: message || DEFAULT_MESSAGES.offline,
    });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, visible: false }));
  };

  const checkAndShowToast = async (): Promise<boolean> => {
    const status = await checkConnection();

    if (status === 'offline') {
      showOfflineToast();
      return false;
    }

    if (status === 'weak') {
      showWeakConnectionToast();
      return false;
    }

    return true;
  };

  return (
    <NetworkToastContext.Provider
      value={{
        showWeakConnectionToast,
        showOfflineToast,
        hideToast,
        checkAndShowToast,
      }}
    >
      {children}
      <NetworkToast
        type={toastState.type}
        message={toastState.message}
        visible={toastState.visible}
        onHide={hideToast}
        duration={3000}
      />
    </NetworkToastContext.Provider>
  );
}

export function useNetworkToast() {
  const context = useContext(NetworkToastContext);
  if (!context) {
    throw new Error('useNetworkToast must be used within NetworkToastProvider');
  }
  return context;
}

