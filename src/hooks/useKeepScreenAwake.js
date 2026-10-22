import { useEffect } from 'react';
import { wakeLockManager } from '../utils/wakeLock';

// Holds a screen wake lock while `active`. Browsers drop the lock when the tab is hidden, so it is
// requested again when the page becomes visible.
export function useKeepScreenAwake(active) {
  useEffect(() => {
    if (!active) return undefined;
    wakeLockManager.requestWakeLock();
    const onVisible = () => wakeLockManager.handleVisibilityChange();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockManager.releaseWakeLock();
    };
  }, [active]);
}
