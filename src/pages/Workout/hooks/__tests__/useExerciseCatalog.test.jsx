import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useExerciseCatalog } from '../useExerciseCatalog';
import { fetchExerciseCatalogPage, fetchExerciseCatalogFilters } from '../../../../services/exerciseCatalogService';

vi.mock('../../../../services/exerciseCatalogService', () => ({
  fetchExerciseCatalogPage: vi.fn(),
  fetchExerciseCatalogFilters: vi.fn(),
}));

describe('useExerciseCatalog', () => {
  it('loads page data and filter options', async () => {
    vi.mocked(fetchExerciseCatalogPage).mockResolvedValue({ items: [], totalCount: 0 });
    vi.mocked(fetchExerciseCatalogFilters).mockResolvedValue({ primaryMuscles: [], equipment: [], difficulties: [], tags: [] });

    const supabaseMock = {};
    const filtersMock = { searchTerm: '', primaryMuscle: '', equipment: '', difficulty: '', tag: '', page: 1, pageSize: 24 };

    const { result } = renderHook(() =>
      useExerciseCatalog({
        supabase: supabaseMock,
        filters: filtersMock,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.items).toEqual(expect.any(Array));
    expect(result.current.filterOptions).toEqual(expect.any(Object));
  });
});
