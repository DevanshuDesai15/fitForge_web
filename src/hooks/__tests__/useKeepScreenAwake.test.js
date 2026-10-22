import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeepScreenAwake } from '../useKeepScreenAwake';
import { wakeLockManager } from '../../utils/wakeLock';

vi.mock('../../utils/wakeLock', () => ({
  wakeLockManager: { requestWakeLock: vi.fn(), releaseWakeLock: vi.fn(), handleVisibilityChange: vi.fn() },
}));

describe('useKeepScreenAwake', () => {
  it('holds the lock while active, re-requests when the tab is visible again, and releases on unmount', () => {
    const { unmount } = renderHook(() => useKeepScreenAwake(true));
    expect(wakeLockManager.requestWakeLock).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(wakeLockManager.handleVisibilityChange).toHaveBeenCalled();
    unmount();
    expect(wakeLockManager.releaseWakeLock).toHaveBeenCalled();
  });

  it('does nothing when inactive', () => {
    vi.clearAllMocks();
    renderHook(() => useKeepScreenAwake(false));
    expect(wakeLockManager.requestWakeLock).not.toHaveBeenCalled();
  });
});
