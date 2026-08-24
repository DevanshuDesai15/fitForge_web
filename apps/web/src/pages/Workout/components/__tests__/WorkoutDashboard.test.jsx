import { describe, expect, it } from 'vitest';
import { getWorkoutTabFromSearchParams } from '../workoutDashboardUtils';

describe('getWorkoutTabFromSearchParams', () => {
  it('opens the canonical exercise library tab from the URL', () => {
    expect(getWorkoutTabFromSearchParams(new URLSearchParams('tab=library'))).toBe(1);
  });

  it('defaults unknown or missing tabs to workouts', () => {
    expect(getWorkoutTabFromSearchParams(new URLSearchParams())).toBe(0);
    expect(getWorkoutTabFromSearchParams(new URLSearchParams('tab=unknown'))).toBe(0);
  });
});
