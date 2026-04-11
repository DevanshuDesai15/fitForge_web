import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSupabase } from '../useSupabase';

const clerkState = vi.hoisted(() => ({
  session: null,
}));

const createClientMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn() })));

vi.mock('@clerk/clerk-react', () => ({
  useSession: () => clerkState,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args) => createClientMock(...args),
}));

function Harness() {
  useSupabase();
  return null;
}

describe('useSupabase', () => {
  beforeEach(() => {
    createClientMock.mockClear();
    clerkState.session = null;
  });

  it('does not recreate the client when Clerk returns a new session object with the same id', () => {
    clerkState.session = {
      id: 'sess_123',
      getToken: vi.fn(),
    };

    const { rerender } = render(<Harness />);

    clerkState.session = {
      id: 'sess_123',
      getToken: vi.fn(),
    };

    rerender(<Harness />);

    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it('recreates the client when the session id changes', () => {
    clerkState.session = {
      id: 'sess_123',
      getToken: vi.fn(),
    };

    const { rerender } = render(<Harness />);

    clerkState.session = {
      id: 'sess_456',
      getToken: vi.fn(),
    };

    rerender(<Harness />);

    expect(createClientMock).toHaveBeenCalledTimes(2);
  });
});
