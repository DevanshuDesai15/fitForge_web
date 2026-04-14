import { useState, useEffect } from 'react';
import { fetchExerciseCatalogPage, fetchExerciseCatalogFilters } from '../../../services/exerciseCatalogService';

export const useExerciseCatalog = ({ supabase, filters }) => {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState({
    primaryMuscles: [],
    equipment: [],
    difficulties: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [pageData, options] = await Promise.all([
          fetchExerciseCatalogPage(supabase, filters),
          fetchExerciseCatalogFilters(supabase),
        ]);

        if (!active) return;
        setItems(pageData.items);
        setTotalCount(pageData.totalCount);
        setFilterOptions(options);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load exercises');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [supabase, filters]);

  return { items, totalCount, filterOptions, loading, error };
};
