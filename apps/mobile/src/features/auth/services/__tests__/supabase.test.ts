import { describe, expect, it, vi } from 'vitest';
import { createMobileSupabaseClient } from '../supabase';

describe('mobile Supabase authentication', () => {
  it('uses the current Clerk token for Data API requests', async () => {
    const getToken = vi.fn().mockResolvedValue('clerk-session-token');
    const factory = vi.fn().mockReturnValue({});
    createMobileSupabaseClient({ url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test', getToken, factory });
    const options = factory.mock.calls[0][2];
    await expect(options.accessToken()).resolves.toBe('clerk-session-token');
    expect(factory).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_test', expect.any(Object));
  });

  it('rejects privileged keys before constructing a public client', () => {
    expect(() => createMobileSupabaseClient({ url: 'https://example.supabase.co', publishableKey: 'service_role_secret', getToken: vi.fn(), factory: vi.fn() })).toThrow('privileged');
  });
});
