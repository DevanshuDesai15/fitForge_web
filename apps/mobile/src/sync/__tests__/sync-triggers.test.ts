import { describe, expect, it, vi } from 'vitest';
import { attachSyncTriggers, type SyncTriggerDependencies } from '../useSyncTriggers';

describe('sync lifecycle triggers', () => {
  it('syncs on reachable connectivity and when returning to the foreground, then unsubscribes', () => {
    const sync = vi.fn();
    let connectivity!: (state: { connected: boolean; reachable: boolean | null }) => void;
    let appState!: (state: 'active' | 'background' | 'inactive' | 'unknown' | 'extension') => void;
    const disconnectNetwork = vi.fn(); const disconnectApp = vi.fn();
    const dependencies: SyncTriggerDependencies = {
      subscribeConnectivity: (listener) => { connectivity = listener; return disconnectNetwork; },
      subscribeAppState: (listener) => { appState = listener; return disconnectApp; },
    };
    const detach = attachSyncTriggers(sync, dependencies);
    connectivity({ connected: false, reachable: false });
    connectivity({ connected: true, reachable: true });
    appState('background');
    appState('active');
    expect(sync).toHaveBeenCalledTimes(2);
    detach();
    expect(disconnectNetwork).toHaveBeenCalledOnce();
    expect(disconnectApp).toHaveBeenCalledOnce();
  });
});
