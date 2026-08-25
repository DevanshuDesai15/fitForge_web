import { describe, expect, it, vi } from 'vitest';
import { performSignOut, signOutDecision } from '../sign-out-policy';

describe('signOutDecision', () => {
  it('allows a clean local queue without a warning', () => expect(signOutDecision(0, false)).toBe('proceed'));
  it('requires confirmation when local work is pending', () => expect(signOutDecision(2, false)).toBe('confirm'));
  it('allows an acknowledged pending queue', () => expect(signOutDecision(2, true)).toBe('proceed'));
});

describe('performSignOut', () => {
  it('clears the selected partition only after Clerk signs out', async () => {
    const order: string[] = [];
    const signOut = vi.fn(async () => { order.push('sign-out'); });
    const clearPartition = vi.fn(async () => { order.push('clear'); });
    await performSignOut({ pendingCount: 0, acknowledged: false, signOut, clearPartition });
    expect(order).toEqual(['sign-out', 'clear']);
  });

  it('does not sign out before pending work is acknowledged', async () => {
    const signOut = vi.fn();
    const result = await performSignOut({ pendingCount: 1, acknowledged: false, signOut, clearPartition: vi.fn() });
    expect(result).toBe('confirm');
    expect(signOut).not.toHaveBeenCalled();
  });
});
