import { describe, expect, it, vi } from 'vitest';
import {
  normalizeExerciseCatalogRow,
  getDistinctFilterOptions,
  fetchExerciseCatalogPage,
  fetchExerciseCatalogList,
  fetchExerciseCatalogById,
  formatExerciseCatalogRagContext,
} from '../exerciseCatalogService';

describe('normalizeExerciseCatalogRow', () => {
  it('maps Supabase exercise rows into the Exercise Library shape', () => {
    const row = {
      id: 'uuid-1',
      slug: 'kettlebell-single-arm-row',
      name: 'Kettlebell Single Arm Row',
      description: 'Updated description',
      steps: ['Hinge', 'Row'],
      primary_muscle: 'Back',
      secondary_muscles: ['Rhomboids'],
      equipment_needed: ['Kettlebell'],
      exercise_types: ['Strength'],
      difficulty: 'Beginner',
      video_urls: { '720p': 'https://example.com/video.mp4' },
      pro_tips: ['Drive the elbow back'],
      common_mistakes: ['Twisting the torso'],
      variations: ['Single Arm Dumbbell Row'],
      safety_considerations: ['Brace your core'],
      tags: ['Beginner', 'Back'],
    };

    expect(normalizeExerciseCatalogRow(row)).toEqual({
      id: 'uuid-1',
      slug: 'kettlebell-single-arm-row',
      name: 'Kettlebell Single Arm Row',
      description: 'Updated description',
      steps: ['Hinge', 'Row'],
      primaryMuscle: 'Back',
      secondaryMuscles: ['Rhomboids'],
      equipmentNeeded: ['Kettlebell'],
      exerciseTypes: ['Strength'],
      difficulty: 'Beginner',
      videoUrls: { '720p': 'https://example.com/video.mp4' },
      proTips: ['Drive the elbow back'],
      commonMistakes: ['Twisting the torso'],
      variations: ['Single Arm Dumbbell Row'],
      safetyConsiderations: ['Brace your core'],
      tags: ['Beginner', 'Back'],
      title: 'Kettlebell Single Arm Row',
      bodyPart: 'Back',
      target: 'Back',
      equipment: 'Kettlebell',
      muscles: ['Back', 'Rhomboids'],
      primaryMuscles: ['Back'],
      video_urls: { '720p': 'https://example.com/video.mp4' },
    });
  });
});

describe('catalog-wide operations', () => {
  it('lists a bounded catalog range and supports search', async () => {
    const supabase = createSupabaseMock();
    await fetchExerciseCatalogList(supabase, { limit: 50, offset: 10, searchTerm: 'bench' });

    expect(supabase.__calls).toContainEqual(['range', 10, 59]);
    expect(supabase.__calls).toContainEqual([
      'or',
      'name.ilike.%bench%,description.ilike.%bench%,primary_muscle.ilike.%bench%',
    ]);
  });

  it('loads one exercise by ID and formats compact AI context', async () => {
    const exerciseId = '123e4567-e89b-42d3-a456-426614174000';
    const row = {
      id: exerciseId,
      name: 'Bench Press',
      description: 'Press the bar',
      difficulty: 'Intermediate',
      primary_muscle: 'Chest',
      equipment_needed: ['Barbell'],
      steps: ['Unrack', 'Press'],
      secondary_muscles: ['Triceps'],
    };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    const supabase = { from: vi.fn(() => builder) };

    const exercise = await fetchExerciseCatalogById(supabase, exerciseId);
    expect(builder.eq).toHaveBeenCalledWith('id', exerciseId);
    expect(JSON.parse(formatExerciseCatalogRagContext(exercise))).toEqual({
      name: 'Bench Press',
      description: 'Press the bar',
      difficulty: 'Intermediate',
      target: 'Chest',
      equipment: 'Barbell',
      steps: ['Unrack', 'Press'],
      muscle_groups: ['Chest', 'Triceps'],
    });
  });

  it('loads a historical name without sending it to the UUID ID column', async () => {
    const row = { id: '123e4567-e89b-42d3-a456-426614174000', name: 'Leg Press' };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    };
    const supabase = { from: vi.fn(() => builder) };

    const exercise = await fetchExerciseCatalogById(supabase, 'Leg Press');

    expect(builder.eq).toHaveBeenCalledWith('name', 'Leg Press');
    expect(builder.eq).not.toHaveBeenCalledWith('id', 'Leg Press');
    expect(exercise.name).toBe('Leg Press');
  });
});

const createSupabaseMock = () => {
  const mock = { __calls: [] };
  const methods = ['from', 'select', 'order', 'range', 'eq', 'or', 'contains'];
  
  methods.forEach(method => {
    mock[method] = (...args) => {
      mock.__calls.push([method, ...args]);
      return mock;
    };
  });
  
  // Terminal Promise state
  mock.then = (resolve) => {
    resolve({ data: [], count: 0, error: null });
  };

  return mock;
};

describe('fetchExerciseCatalogPage & getDistinctFilterOptions', () => {
  it('builds a paginated query with single-select filters', async () => {
    const supabase = createSupabaseMock();

    await fetchExerciseCatalogPage(supabase, {
      searchTerm: 'row',
      primaryMuscle: 'Back',
      equipment: 'Kettlebell',
      difficulty: 'Beginner',
      tag: 'Back',
      page: 2,
      pageSize: 24,
    });

    expect(supabase.__calls).toContainEqual(['range', 24, 47]);
    expect(supabase.__calls).toContainEqual(['eq', 'primary_muscle', 'Back']);
  });

  it('normalizes distinct filter option values from rows', () => {
    expect(getDistinctFilterOptions([
      { primary_muscle: 'Back', equipment_needed: ['Kettlebell'], difficulty: 'Beginner', tags: ['Back'] },
      { primary_muscle: 'Chest', equipment_needed: ['Barbell'], difficulty: 'Intermediate', tags: ['Chest'] },
    ])).toEqual({
      primaryMuscles: ['Back', 'Chest'],
      equipment: ['Barbell', 'Kettlebell'],
      difficulties: ['Beginner', 'Intermediate'],
      tags: ['Back', 'Chest'],
    });
  });
});
