import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  mapTemplateToDb,
  mapProgramToDb,
  mapWorkoutToDb,
  mapTemplateUpdateToDb,
} from '../../../../services/workoutDataService';
import { createWorkoutMutationLayer } from '../useWorkoutMutations';

describe('workoutDataService', () => {
  it('maps a template payload into Supabase fields', () => {
    const timestamps = {
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    };

    const resultA = mapTemplateToDb(
      {
        name: 'Push Day',
        description: 'Chest and triceps',
        exercises: [{ id: 'bench', name: 'Bench Press' }],
      },
      'user_123',
      timestamps
    );

    const resultB = mapTemplateToDb(
      {
        name: 'Push Day',
        description: 'Chest and triceps',
        exercises: [{ id: 'bench', name: 'Bench Press' }],
      },
      'user_123',
      timestamps
    );

    expect(resultA).toEqual(resultB);
    expect(resultA).toMatchObject({
      user_id: 'user_123',
      name: 'Push Day',
      description: 'Chest and triceps',
      exercises: [{ id: 'bench', name: 'Bench Press' }],
    });
  });

  it('maps a program to store template ids rather than embedded template objects', () => {
    const timestamps = {
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    };

    const resultA = mapProgramToDb(
      {
        name: 'PPL',
        templateIds: ['push', 'pull', 'legs'],
      },
      'user_123',
      timestamps
    );

    const resultB = mapProgramToDb(
      {
        name: 'PPL',
        templateIds: ['push', 'pull', 'legs'],
      },
      'user_123',
      timestamps
    );

    expect(resultA).toEqual(resultB);
    expect(resultA).toMatchObject({
      user_id: 'user_123',
      name: 'PPL',
      template_ids: ['push', 'pull', 'legs'],
    });
  });

  it('maps a workout entry into Supabase fields', () => {
    const timestamps = {
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    };

    const resultA = mapWorkoutToDb(
      {
        templateId: 'template_1',
        templateName: 'Push Day',
        dayName: 'Monday',
        exercises: [],
        duration: 45,
        completed: true,
      },
      'user_123',
      timestamps
    );

    const resultB = mapWorkoutToDb(
      {
        templateId: 'template_1',
        templateName: 'Push Day',
        dayName: 'Monday',
        exercises: [],
        duration: 45,
        completed: true,
      },
      'user_123',
      timestamps
    );

    expect(resultA).toEqual(resultB);
    expect(resultA).toMatchObject({
      user_id: 'user_123',
      template_id: 'template_1',
      name: 'Push Day - Monday',
      template_name: 'Push Day',
      day_name: 'Monday',
      duration: 45,
      completed: true,
    });
  });

  it('falls back to a non-null workout name when only day metadata exists', () => {
    const result = mapWorkoutToDb(
      {
        templateName: 'Custom Workout',
        dayName: 'Workout Session',
      },
      'user_123'
    );

    expect(result.name).toBe('Custom Workout - Workout Session');
  });
});

describe('createWorkoutMutationLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates templates and invalidates only the template cache on success', async () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    };

    const single = vi.fn().mockResolvedValue({ data: { id: 'template_1' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });

    const supabase = { from };

    const layer = createWorkoutMutationLayer({
      supabase,
      queryClient,
      userId: 'user_123',
    });

    await layer.createTemplate({
      name: 'Push Day',
      description: 'Chest and triceps',
      exercises: [],
    });

    expect(from).toHaveBeenCalledWith('workout_templates');
    expect(insert).toHaveBeenCalledWith([{
      user_id: 'user_123',
      name: 'Push Day',
      description: 'Chest and triceps',
      category: null,
      difficulty: null,
      exercises: [],
      estimated_duration_minutes: null,
      is_custom: false,
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:00:00.000Z',
    }]);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['workoutTemplates', 'user_123'],
    });
  });

  it('updates templates with partial patches only', async () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    };

    const single = vi.fn().mockResolvedValue({ data: { id: 'template_1' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select,
        }),
      }),
    });
    const from = vi.fn().mockReturnValue({ update });

    const supabase = { from };

    const layer = createWorkoutMutationLayer({
      supabase,
      queryClient,
      userId: 'user_123',
    });

    expect(
      mapTemplateUpdateToDb({
        name: 'Push Day Updated',
      })
    ).toEqual({
      name: 'Push Day Updated',
    });

    await layer.updateTemplate('template_1', {
      name: 'Push Day Updated',
    });

    expect(update).toHaveBeenCalledWith({
      name: 'Push Day Updated',
      updated_at: '2026-04-03T12:00:00.000Z',
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['workoutTemplates', 'user_123'],
    });
  });

  it('reports whether a delete matched a row', async () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    };

    const data = [{ id: 'template_1' }];
    const select = vi.fn().mockResolvedValue({ data, error: null });
    const deleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select,
        }),
      }),
    });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    const supabase = { from };

    const layer = createWorkoutMutationLayer({
      supabase,
      queryClient,
      userId: 'user_123',
    });

    const result = await layer.deleteTemplate('template_1');

    expect(result).toEqual({ deleted: true, id: 'template_1' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['workoutTemplates', 'user_123'],
    });
  });

  it('reports a no-op delete when nothing matched', async () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    };

    const select = vi.fn().mockResolvedValue({ data: [], error: null });
    const deleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select,
        }),
      }),
    });
    const from = vi.fn().mockReturnValue({ delete: deleteFn });

    const supabase = { from };

    const layer = createWorkoutMutationLayer({
      supabase,
      queryClient,
      userId: 'user_123',
    });

    const result = await layer.deleteTemplate('template_1');

    expect(result).toEqual({ deleted: false, id: 'template_1' });
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});
