import { describe, expect, it } from 'vitest';
import { initialOnboardingState, onboardingReducer } from '../onboarding';

describe('onboardingReducer', () => {
  it('moves between the five bounded setup steps', () => {
    let state = initialOnboardingState();
    for (let index = 0; index < 8; index += 1) state = onboardingReducer(state, { type: 'next' });
    expect(state.step).toBe(4);
    state = onboardingReducer(state, { type: 'back' });
    expect(state.step).toBe(3);
  });

  it('keeps selections made across optional steps', () => {
    let state = initialOnboardingState();
    state = onboardingReducer(state, { type: 'set-units', units: 'metric' });
    state = onboardingReducer(state, { type: 'set-experience', experience: 'returning' });
    state = onboardingReducer(state, { type: 'toggle-day', day: 'mon' });
    state = onboardingReducer(state, { type: 'toggle-day', day: 'wed' });
    expect(state.units).toBe('metric');
    expect(state.experience).toBe('returning');
    expect(state.trainingDays).toEqual(['mon', 'wed']);
  });
});
