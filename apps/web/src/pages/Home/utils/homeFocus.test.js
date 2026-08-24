import { describe, expect, it } from 'vitest';
import { deriveHomeFocus } from './homeFocus';

describe('deriveHomeFocus', () => {
  it('returns hidden for users without a program or repeatable workout', () => {
    expect(
      deriveHomeFocus({
        nextWorkout: null,
        lastRepeatableWorkout: null,
      })
    ).toEqual({ mode: 'hidden', workout: null });
  });

  it('prefers the program workout when both program and repeat-last are available', () => {
    expect(
      deriveHomeFocus({
        nextWorkout: { name: 'Push Day' },
        lastRepeatableWorkout: { name: 'Chest Day' },
      })
    ).toEqual({
      mode: 'program',
      workout: { name: 'Push Day' },
    });
  });

  it('returns repeat-last when there is no program workout but there is workout history', () => {
    expect(
      deriveHomeFocus({
        nextWorkout: null,
        lastRepeatableWorkout: {
          name: 'Upper Body',
          exercises: [{ name: 'Bench Press' }],
        },
      })
    ).toEqual({
      mode: 'repeat-last',
      workout: {
        name: 'Upper Body',
        exercises: [{ name: 'Bench Press' }],
      },
    });
  });
});
