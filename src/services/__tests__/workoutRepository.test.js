import { describe, expect, it, vi } from 'vitest';
import {
  createWorkoutRecord,
  listWorkouts,
  updateWorkoutRecord,
} from '../workoutRepository';

function createThenableBuilder(response) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
  };
  return builder;
}

describe('workoutRepository', () => {
  it('returns mapped workouts and applies user, completion, order, and limit filters', async () => {
    const builder = createThenableBuilder({
      data: [{ id: 'workout_1', user_id: 'user_123', completed_at: 'now' }],
      error: null,
    });
    const supabase = { from: vi.fn(() => builder) };

    const result = await listWorkouts({
      supabase,
      userId: 'user_123',
      completed: true,
      orderBy: 'completed_at',
      limit: 10,
      columns: 'id, completed_at',
    });

    expect(supabase.from).toHaveBeenCalledWith('workouts');
    expect(builder.select).toHaveBeenCalledWith('id, completed_at');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user_123');
    expect(builder.eq).toHaveBeenCalledWith('completed', true);
    expect(builder.order).toHaveBeenCalledWith('completed_at', { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 'workout_1', userId: 'user_123', completedAt: 'now' }]);
  });

  it('returns an empty result without querying when the user is absent', async () => {
    const supabase = { from: vi.fn() };
    await expect(listWorkouts({ supabase, userId: null })).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('throws read errors unchanged', async () => {
    const failure = new Error('read failed');
    const builder = createThenableBuilder({ data: null, error: failure });
    const supabase = { from: vi.fn(() => builder) };
    await expect(listWorkouts({ supabase, userId: 'user_123' })).rejects.toBe(failure);
  });

  it('maps create input and returns a canonical workout', async () => {
    const builder = createThenableBuilder({
      data: { id: 'workout_1', user_id: 'user_123', template_name: 'Quick Add' },
      error: null,
    });
    const supabase = { from: vi.fn(() => builder) };

    const result = await createWorkoutRecord({
      supabase,
      userId: 'user_123',
      workout: { templateName: 'Quick Add', exercises: [] },
    });

    expect(builder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ user_id: 'user_123', template_name: 'Quick Add' }),
    ]);
    expect(result).toMatchObject({ id: 'workout_1', userId: 'user_123', templateName: 'Quick Add' });
  });

  it('scopes updates to both workout and user IDs', async () => {
    const builder = createThenableBuilder({
      data: { id: 'workout_1', user_id: 'user_123', exercises: [] },
      error: null,
    });
    const supabase = { from: vi.fn(() => builder) };

    await updateWorkoutRecord({
      supabase,
      userId: 'user_123',
      id: 'workout_1',
      workout: { exercises: [] },
    });

    expect(builder.eq).toHaveBeenCalledWith('id', 'workout_1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user_123');
  });
});
