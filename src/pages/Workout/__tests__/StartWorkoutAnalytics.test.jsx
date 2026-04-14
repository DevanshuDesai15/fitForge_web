import { describe, expect, it, vi } from 'vitest';

import { beginWorkoutSession } from '../StartWorkout';

describe('beginWorkoutSession', () => {
  it('tracks workout_started for a user-initiated workout start', () => {
    const setWorkoutStartTime = vi.fn();
    const setWorkoutStarted = vi.fn();
    const posthog = { capture: vi.fn() };

    beginWorkoutSession({
      setWorkoutStartTime,
      setWorkoutStarted,
      posthog,
      analyticsPayload: {
        template_name: 'Push Day',
        exercise_count: 5,
      },
    });

    expect(setWorkoutStartTime).toHaveBeenCalledTimes(1);
    expect(setWorkoutStarted).toHaveBeenCalledWith(true);
    expect(posthog.capture).toHaveBeenCalledWith('workout_started', {
      template_name: 'Push Day',
      exercise_count: 5,
    });
  });

  it('does not track workout_started when restoring an in-progress workout', () => {
    const setWorkoutStartTime = vi.fn();
    const setWorkoutStarted = vi.fn();
    const posthog = { capture: vi.fn() };

    beginWorkoutSession({
      setWorkoutStartTime,
      setWorkoutStarted,
      posthog,
      analyticsPayload: {
        template_name: 'Push Day',
        exercise_count: 5,
      },
      shouldTrackAnalytics: false,
    });

    expect(setWorkoutStartTime).toHaveBeenCalledTimes(1);
    expect(setWorkoutStarted).toHaveBeenCalledWith(true);
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
