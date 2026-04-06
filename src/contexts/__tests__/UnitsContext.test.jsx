import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnitsProvider, useUnits } from '../UnitsContext';

const authState = {
  currentUser: null,
};

const supabaseState = {
  client: null,
};

vi.mock('../AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../../hooks/useSupabase', () => ({
  useSupabase: () => supabaseState.client,
}));

function TestConsumer() {
  const { unitPreference, updateUnitPreference, loading } = useUnits();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="unitPreference">{unitPreference}</div>
      <button type="button" onClick={() => updateUnitPreference('metric')}>
        set metric
      </button>
    </div>
  );
}

function renderUnitsProvider() {
  return render(
    <UnitsProvider>
      <TestConsumer />
    </UnitsProvider>
  );
}

describe('UnitsContext', () => {
  beforeEach(() => {
    authState.currentUser = null;
    supabaseState.client = null;
    window.localStorage.clear();
  });

  it('loads unit preference from Supabase profile preferences', async () => {
    authState.currentUser = { uid: 'user_123' };

    const single = vi.fn().mockResolvedValue({
      data: { preferences: { units: 'metric' } },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    supabaseState.client = { from };

    renderUnitsProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('unitPreference')).toHaveTextContent('metric');
    expect(from).toHaveBeenCalledWith('profiles');
    expect(window.localStorage.getItem('weightUnit')).toBe('kg');
  });

  it('falls back to localStorage for authenticated users when Supabase has no units preference yet', async () => {
    authState.currentUser = { uid: 'user_123' };
    window.localStorage.setItem('weightUnit', 'kg');

    const single = vi.fn().mockResolvedValue({
      data: { preferences: {} },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    supabaseState.client = { from };

    renderUnitsProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('unitPreference')).toHaveTextContent('metric');
  });

  it('persists updated preferences to Supabase and mirrors localStorage', async () => {
    authState.currentUser = { uid: 'user_123' };

    const selectSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: { preferences: { units: 'imperial', theme: 'dark' } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { preferences: { units: 'imperial', theme: 'dark' } },
        error: null,
      });
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle });
    const select = vi.fn().mockReturnValue({ eq: selectEq });

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select,
          upsert,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    supabaseState.client = { from };

    renderUnitsProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'set metric' }));

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user_123',
          preferences: {
            units: 'metric',
            theme: 'dark',
          },
          updated_at: expect.any(String),
        })
      );
    });

    expect(screen.getByTestId('unitPreference')).toHaveTextContent('metric');
    expect(window.localStorage.getItem('weightUnit')).toBe('kg');
  });
});
