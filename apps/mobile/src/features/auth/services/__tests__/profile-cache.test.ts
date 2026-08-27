import { describe, expect, it, vi } from 'vitest';
import { createProfileCache } from '../profile-cache';

describe('partitioned profile cache', () => {
  it('returns only a profile whose owner matches the requested Clerk user', async () => {
    const getItemAsync = vi.fn(async () => JSON.stringify({ id: 'user_1', preferences: { onboarding_completed: true } }));
    const cache = createProfileCache({ getItemAsync, setItemAsync: vi.fn() });
    await expect(cache.get('user_1')).resolves.toEqual(expect.objectContaining({ id: 'user_1' }));
    await expect(cache.get('user_2')).resolves.toBeNull();
  });

  it('rejects writes across user partitions', async () => {
    const cache = createProfileCache({ getItemAsync: vi.fn(), setItemAsync: vi.fn() });
    await expect(cache.set('user_2', { id: 'user_1', display_name: null, preferences: null })).rejects.toThrow('owner mismatch');
  });
});
