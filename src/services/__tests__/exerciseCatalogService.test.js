import { describe, expect, it, vi } from 'vitest';
import {
  normalizeExerciseCatalogRow,
  getDistinctFilterOptions,
  fetchExerciseCatalogPage
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
    });
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
