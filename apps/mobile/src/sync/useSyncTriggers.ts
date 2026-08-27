import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type SyncTriggerDependencies = {
  subscribeConnectivity(listener: (state: { connected: boolean; reachable: boolean | null }) => void): () => void;
  subscribeAppState(listener: (state: AppStateStatus) => void): () => void;
};

export function attachSyncTriggers(sync: () => void, dependencies: SyncTriggerDependencies) {
  let previousAppState: AppStateStatus = 'active';
  let wasReachable: boolean | null = null;
  const unsubscribeConnectivity = dependencies.subscribeConnectivity((state) => {
    const reachable = state.connected && state.reachable !== false;
    if (reachable && wasReachable === false) sync();
    wasReachable = reachable;
  });
  const unsubscribeAppState = dependencies.subscribeAppState((state) => {
    if (state === 'active' && previousAppState !== 'active') sync();
    previousAppState = state;
  });
  return () => { unsubscribeConnectivity(); unsubscribeAppState(); };
}

const nativeDependencies: SyncTriggerDependencies = {
  subscribeConnectivity: (listener) => NetInfo.addEventListener((state: NetInfoState) => listener({ connected: Boolean(state.isConnected), reachable: state.isInternetReachable })),
  subscribeAppState: (listener) => { const subscription = AppState.addEventListener('change', listener); return () => subscription.remove(); },
};

export function useSyncTriggers(enabled: boolean, sync: () => void, dependencies: SyncTriggerDependencies = nativeDependencies) {
  useEffect(() => {
    if (!enabled) return undefined;
    sync();
    return attachSyncTriggers(sync, dependencies);
  }, [dependencies, enabled, sync]);
}
