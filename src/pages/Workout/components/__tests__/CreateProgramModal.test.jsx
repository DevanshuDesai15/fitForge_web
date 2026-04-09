import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CreateProgramModal from '../CreateProgramModal';
import { seedStarterProgramsWithMutations } from '../../hooks/useWorkoutPrograms';
import {
  buildWorkoutStartState,
  findNextDayInProgram,
  loadCompletedWorkoutsFromSupabase,
} from '../WorkoutsTab';
import {
  buildStarterWorkoutRecommendations,
  buildStarterWorkoutStartState,
} from '../starterWorkoutRecommendations';
import { syncProgramTemplateIds } from '../../hooks/useWorkoutMutations';

const mutationSpies = vi.hoisted(() => ({
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  createProgram: vi.fn(),
  updateProgram: vi.fn(),
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'user_123' },
  }),
}));

vi.mock('../../../Workout/hooks/useWorkoutMutations', async () => {
  const actual = await vi.importActual('../../../Workout/hooks/useWorkoutMutations');
  return {
    ...actual,
    useWorkoutMutations: () => mutationSpies,
  };
});

vi.mock('../../../../services/localExerciseService', () => ({
  fetchAllExercises: vi.fn().mockResolvedValue([]),
}));

describe('CreateProgramModal', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    mutationSpies.createTemplate.mockReset();
    mutationSpies.updateTemplate.mockReset();
    mutationSpies.createProgram.mockReset();
    mutationSpies.updateProgram.mockReset();

    mutationSpies.createTemplate.mockResolvedValue({ id: 'template_1' });
    mutationSpies.createProgram.mockResolvedValue({ id: 'program_1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates workout templates first and saves programs with templateIds', async () => {
    const onClose = vi.fn();
    const onProgramCreated = vi.fn();

    render(
      <CreateProgramModal
        open
        onClose={onClose}
        onProgramCreated={onProgramCreated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /start from scratch/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.change(screen.getByLabelText(/program name/i), {
      target: { value: 'Custom Split' },
    });
    fireEvent.click(screen.getByRole('button', { name: /configure days/i }));

    fireEvent.click(screen.getByRole('button', { name: /add day/i }));
    fireEvent.click(screen.getByRole('button', { name: /create program/i }));

    await waitFor(() => {
      expect(mutationSpies.createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Day 1',
          exercises: [],
        })
      );
    });

    expect(mutationSpies.createProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Split',
        templateIds: ['template_1'],
      })
    );
    expect(mutationSpies.createProgram).not.toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.any(Array),
      })
    );
    expect(onProgramCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe('seedStarterProgramsWithMutations', () => {
  it('creates starter templates and programs through the shared mutation layer', async () => {
    const createTemplate = vi
      .fn()
      .mockResolvedValueOnce({ id: 'template_push' })
      .mockResolvedValueOnce({ id: 'template_pull' })
      .mockResolvedValueOnce({ id: 'template_legs' })
      .mockResolvedValueOnce({ id: 'template_upper_a' })
      .mockResolvedValueOnce({ id: 'template_lower_a' })
      .mockResolvedValueOnce({ id: 'template_upper_b' })
      .mockResolvedValueOnce({ id: 'template_lower_b' });
    const createProgram = vi.fn().mockResolvedValue({ id: 'program_1' });

    await seedStarterProgramsWithMutations({
      createTemplate,
      createProgram,
    });

    expect(createTemplate).toHaveBeenCalled();
    expect(createProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Pull Legs',
        templateIds: ['template_push', 'template_pull', 'template_legs'],
      })
    );
    expect(createProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Upper Lower Split',
        templateIds: [
          'template_upper_a',
          'template_lower_a',
          'template_upper_b',
          'template_lower_b',
        ],
      })
    );
  });
});

describe('loadCompletedWorkoutsFromSupabase', () => {
  it('loads completed workouts from Supabase and maps fields for recommendations', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'workout_1',
          user_id: 'user_123',
          template_id: 'template_1',
          day_name: 'Day 1',
          completed: true,
          timestamp: '2026-04-03T12:00:00.000Z',
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const eqCompleted = vi.fn().mockReturnValue({ order });
    const eqUser = vi.fn().mockReturnValue({ eq: eqCompleted });
    const select = vi.fn().mockReturnValue({ eq: eqUser });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from };

    const result = await loadCompletedWorkoutsFromSupabase({
      supabase,
      userId: 'user_123',
    });

    expect(from).toHaveBeenCalledWith('workouts');
    expect(select).toHaveBeenCalledWith('*');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user_123');
    expect(eqCompleted).toHaveBeenCalledWith('completed', true);
    expect(order).toHaveBeenCalledWith('timestamp', { ascending: false });
    expect(limit).toHaveBeenCalledWith(50);
    expect(result).toEqual([
      expect.objectContaining({
        id: 'workout_1',
        userId: 'user_123',
        templateId: 'template_1',
        dayName: 'Day 1',
        completed: true,
        timestamp: '2026-04-03T12:00:00.000Z',
      }),
    ]);
  });
});

describe('buildWorkoutStartState', () => {
  it('uses the selected day template id instead of the parent program id', () => {
    const result = buildWorkoutStartState(
      {
        id: 'program_1',
        name: 'Push Pull Legs',
      },
      {
        id: 'day_2',
        templateId: 'template_pull',
        name: 'Pull Day',
        exercises: [{ name: 'Rows' }],
      }
    );

    expect(result).toEqual({
      templateId: 'template_pull',
      dayId: 'template_pull',
      workout: {
        name: 'Push Pull Legs - Pull Day',
        programName: 'Push Pull Legs',
        dayName: 'Pull Day',
        exercises: [{ name: 'Rows' }],
      },
    });
  });
});

describe('findNextDayInProgram', () => {
  it('returns the next incomplete normalized day using template ids without mutating order', () => {
    const program = {
      id: 'program_1',
      days: [
        { id: 'day_2', templateId: 'template_pull', name: 'Pull Day', exercises: [] },
        { id: 'day_1', templateId: 'template_push', name: 'Push Day', exercises: [] },
        { id: 'day_3', templateId: 'template_legs', name: 'Leg Day', exercises: [] },
      ],
    };

    const result = findNextDayInProgram(program, [
      { templateId: 'template_push', dayName: 'Push Day' },
    ]);

    expect(result).toEqual(expect.objectContaining({
      templateId: 'template_pull',
      name: 'Pull Day',
    }));
    expect(program.days.map(day => day.id)).toEqual(['day_2', 'day_1', 'day_3']);
  });
});

describe('syncProgramTemplateIds', () => {
  it('deletes newly created templates if the parent program save fails afterward', async () => {
    const createTemplate = vi.fn().mockResolvedValue({ id: 'template_new' });
    const updateTemplate = vi.fn();
    const deleteTemplate = vi.fn().mockResolvedValue({ deleted: true, id: 'template_new' });

    const result = await syncProgramTemplateIds({
      days: [{ id: 'day_1', name: 'Day 1', exercises: [] }],
      createTemplate,
      updateTemplate,
      deleteTemplate,
      defaults: { isCustom: true },
    });

    await result.rollback();

    expect(deleteTemplate).toHaveBeenCalledWith('template_new');
  });
});

describe('buildStarterWorkoutRecommendations', () => {
  it('returns three AI starter workouts with populated exercise previews', () => {
    const result = buildStarterWorkoutRecommendations();

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        duration: '60 min',
        difficulty: 'Beginner',
        isAIPick: true,
        type: 'starter',
        exercises: expect.any(Number),
        dayData: expect.objectContaining({
          exercises: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
            }),
          ]),
        }),
      })
    );
  });
});

describe('buildStarterWorkoutStartState', () => {
  it('builds populated route state for starter workouts', () => {
    const starterWorkout = buildStarterWorkoutRecommendations()[0];
    const originalExercise = starterWorkout.dayData.exercises[0];
    const originalSet = originalExercise.sets[0];
    const result = buildStarterWorkoutStartState(starterWorkout);
    const resultExercise = result.workout.exercises[0];
    const resultSet = resultExercise.sets[0];

    expect(result).toEqual(
      expect.objectContaining({
        templateId: starterWorkout.dayData.templateId,
        dayId: starterWorkout.dayData.id,
        workout: expect.objectContaining({
          name: starterWorkout.title,
          exercises: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(String) }),
          ]),
        }),
      })
    );
    expect(result.workout.exercises).not.toBe(starterWorkout.dayData.exercises);
    expect(resultExercise).not.toBe(originalExercise);
    expect(resultSet).not.toBe(originalSet);

    resultExercise.name = 'Changed Name';
    resultSet.completed = true;

    expect(starterWorkout.dayData.exercises[0].name).toBe(originalExercise.name);
    expect(starterWorkout.dayData.exercises[0].sets[0].completed).toBe(false);
  });
});
