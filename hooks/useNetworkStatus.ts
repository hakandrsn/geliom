import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'weak';

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  status: NetworkStatus;
  type: string | null;
}

export interface NetworkStatusHook {
  isOnline: boolean;
  isOffline: boolean;
  isWeak: boolean;
  status: NetworkStatus;
  checkConnection: () => Promise<NetworkStatus>;
  networkState: NetworkState;
}

const WEAK_CONNECTION_THRESHOLD = 2; // Mbps

export const useNetworkStatus = (): NetworkStatusHook => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    status: 'online',
    type: null,
  });

  const determineNetworkStatus = (state: NetInfoState): NetworkStatus => {
    // Bağlantı yoksa
    if (!state.isConnected || state.isInternetReachable === false) {
      return 'offline';
    }

    // Bağlantı var - hız kontrolü
    if (state.details) {
      const details = state.details as any;
      
      // Cellular için
      if (state.type === 'cellular' && details.cellularGeneration) {
        // 2G zayıf kabul edilir
        if (details.cellularGeneration === '2g') {
          return 'weak';
        }
      }

      // WiFi için (eğer effectiveConnectionType varsa)
      if (details.effectiveConnectionType) {
        const effectiveType = details.effectiveConnectionType;
        // slow-2g veya 2g zayıf kabul edilir
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          return 'weak';
        }
      }
    }

    return 'online';
  };

  const checkConnection = async (): Promise<NetworkStatus> => {
    try {
      const state = await NetInfo.fetch();
      const status = determineNetworkStatus(state);

      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        status,
        type: state.type,
      });

      return status;
    } catch (error) {
      console.error('Network check failed:', error);
      return 'offline';
    }
  };

  useEffect(() => {
    // İlk durumu kontrol et
    checkConnection();

    // Network değişikliklerini dinle
    const unsubscribe = NetInfo.addEventListener((state) => {
      const status = determineNetworkStatus(state);

      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        status,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline: networkState.status === 'online',
    isOffline: networkState.status === 'offline',
    isWeak: networkState.status === 'weak',
    status: networkState.status,
    checkConnection,
    networkState,
  };
};

