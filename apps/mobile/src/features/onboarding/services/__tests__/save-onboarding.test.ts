import { describe, expect, it, vi } from 'vitest';
import { buildOnboardingProfileUpdate, saveOnboarding } from '../save-onboarding';
import { initialOnboardingState } from '../../model/onboarding';

describe('buildOnboardingProfileUpdate', () => {
  it('merges web-compatible preferences and converts imperial weight to kilograms', () => {
    const payload = buildOnboardingProfileUpdate({
      state: { ...initialOnboardingState(), units: 'imperial', bodyweight: '220.462', height: '72', experience: 'advanced', weeklyTarget: 5, trainingDays: ['mon', 'fri'], starterProgram: 'push-pull-legs', restAlerts: false },
      existingPreferences: { theme: 'dark', profile: { bio: 'Keep me' } },
    });
    expect(payload.bodyweight_kg).toBe(100);
    expect(payload.training_frequency).toBe(5);
    expect(payload.preferences).toMatchObject({
      theme: 'dark', units: 'imperial', onboarding_completed: true,
      experience_level: 'advanced', training_days: ['mon', 'fri'], starter_program: 'push-pull-legs', rest_timer_notifications: false,
      profile: { bio: 'Keep me', height: 72, heightUnit: 'in', experienceLevel: 'advanced', workoutFrequency: 5 },
    });
  });

  it('leaves optional measurements unset when skipped', () => {
    const payload = buildOnboardingProfileUpdate({ state: initialOnboardingState(), existingPreferences: {} });
    expect(payload).not.toHaveProperty('bodyweight_kg');
  });
});

describe('saveOnboarding', () => {
  it('updates only the current Clerk-owned profile row', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'user_1', preferences: { onboarding_completed: true } }, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ update })) };
    await saveOnboarding(client as never, 'user_1', initialOnboardingState(), {});
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user_1');
  });
});
