import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { mapGoalToDb, createGoalMutationLayer } from '../useGoalMutations';

describe('mapGoalToDb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps frontend goal fields to Supabase columns', () => {
    const result = mapGoalToDb(
      {
        title: 'Bench 225',
        type: 'personal_record',
        targetValue: '225',
        currentValue: 135,
        exerciseName: 'Bench Press',
        deadline: '2026-05-01T00:00:00.000Z',
      },
      'user_123',
      {
        createdAt: '2026-04-03T12:00:00.000Z',
        updatedAt: '2026-04-03T12:00:00.000Z',
      }
    );

    expect(result).toMatchObject({
      user_id: 'user_123',
      type: 'personal_record',
      target_value: 225,
      current_value: 135,
      exercise_name: 'Bench Press',
      deadline: '2026-05-01T00:00:00.000Z',
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:00:00.000Z',
    });
  });
});

describe('createGoalMutationLayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a goal and invalidates the current user goals cache', async () => {
    const queryClient = {
      invalidateQueries: vi.fn(),
    };

    const single = vi.fn().mockResolvedValue({ data: { id: 'goal_1' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const supabase = { from };

    const layer = createGoalMutationLayer({
      supabase,
      queryClient,
      userId: 'user_123',
    });

    await layer.createGoal({
      title: 'Bench 225',
      type: 'personal_record',
      targetValue: '225',
      currentValue: 135,
      exerciseName: 'Bench Press',
    });

    expect(from).toHaveBeenCalledWith('goals');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user_123',
        type: 'personal_record',
        target_value: 225,
        current_value: 135,
        exercise_name: 'Bench Press',
        deadline: null,
        created_at: '2026-04-03T12:00:00.000Z',
        updated_at: '2026-04-03T12:00:00.000Z',
      }),
    ]);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['goals', 'user_123'],
    });
  });
});
