import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSupabase } from '../useSupabase';

const clerkState = vi.hoisted(() => ({
  session: null,
}));

const supabaseMocks = vi.hoisted(() => ({
  client: { from: vi.fn() },
  cleanup: vi.fn(),
  getSupabaseClient: vi.fn(),
  setSupabaseTokenProvider: vi.fn(),
}));

vi.mock('@clerk/clerk-react', () => ({
  useSession: () => clerkState,
}));

vi.mock('../../services/supabaseClient', () => ({
  getSupabaseClient: supabaseMocks.getSupabaseClient,
  setSupabaseTokenProvider: supabaseMocks.setSupabaseTokenProvider,
}));

function Harness() {
  useSupabase();
  return null;
}

describe('useSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerkState.session = null;
    supabaseMocks.getSupabaseClient.mockReturnValue(supabaseMocks.client);
    supabaseMocks.setSupabaseTokenProvider.mockReturnValue(
      supabaseMocks.cleanup
    );
  });

  it('registers the current Clerk Supabase-template token provider', async () => {
    const getToken = vi.fn().mockResolvedValue('clerk-token');
    clerkState.session = { id: 'sess_123', getToken };

    const view = render(<Harness />);

    expect(supabaseMocks.getSupabaseClient).toHaveBeenCalledTimes(1);
    const provider = supabaseMocks.setSupabaseTokenProvider.mock.calls[0][0];
    await act(async () => {
      await expect(provider()).resolves.toBe('clerk-token');
    });
    expect(getToken).toHaveBeenCalledWith({ template: 'supabase' });

    view.unmount();
    expect(supabaseMocks.cleanup).toHaveBeenCalledTimes(1);
  });

  it('replaces the token provider without recreating the shared client', () => {
    clerkState.session = { id: 'sess_123', getToken: vi.fn() };
    const { rerender } = render(<Harness />);

    clerkState.session = { id: 'sess_456', getToken: vi.fn() };
    rerender(<Harness />);

    expect(supabaseMocks.getSupabaseClient).toHaveBeenCalledTimes(2);
    expect(supabaseMocks.setSupabaseTokenProvider).toHaveBeenCalledTimes(2);
    expect(supabaseMocks.cleanup).toHaveBeenCalledTimes(1);
  });
});
