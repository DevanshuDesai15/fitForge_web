import { describe, expect, it } from 'vitest';
import { buildOnboardingPayload, buildStarterProgram, shouldShowSetup } from '../onboarding';

const NOW = new Date('2026-10-22T12:00:00Z');
const user = (hoursAgo) => ({ uid: 'user_1', email: 'dev@example.com', createdAt: new Date(NOW.getTime() - hoursAgo * 3600000) });

describe('shouldShowSetup', () => {
  it('shows for a new account that has not finished setup', () => {
    expect(shouldShowSetup({ profile: null, user: user(1), now: NOW.getTime() })).toBe(true);
    expect(shouldShowSetup({ profile: { preferences: {} }, user: user(23), now: NOW.getTime() })).toBe(true);
  });

  it('never shows for an existing account, or after setup was done or skipped', () => {
    expect(shouldShowSetup({ profile: null, user: user(30), now: NOW.getTime() })).toBe(false);
    expect(shouldShowSetup({ profile: { preferences: { onboarding: { completed: true } } }, user: user(1), now: NOW.getTime() })).toBe(false);
    expect(shouldShowSetup({ profile: null, user: {}, now: NOW.getTime() })).toBe(false);
  });
});

describe('buildOnboardingPayload', () => {
  const profile = { display_name: 'Dev', bodyweight_kg: 80, preferences: { units: 'imperial', theme: 'dark', keepScreenAwake: true } };

  it('writes only the completed flag when everything was skipped, keeping other preferences', () => {
    const p = buildOnboardingPayload({ answers: {}, profile, currentUser: user(1), now: NOW });
    expect(p.id).toBe('user_1');
    expect(p.bodyweight_kg).toBeUndefined();
    expect(p.preferences).toMatchObject({ theme: 'dark', keepScreenAwake: true, onboarding: { completed: true, skipped: true } });
  });

  it('saves the answered steps into the profile and preferences', () => {
    const p = buildOnboardingPayload({
      answers: { units: 'metric', weight: '74', height: '178', level: 'returning', target: 5, days: ['Mon', 'Wed'], alerts: true, firstProgram: 'starter' },
      profile, currentUser: user(1), now: NOW,
    });
    expect(p.bodyweight_kg).toBe(74);
    expect(p.training_frequency).toBe(5);
    expect(p.preferences).toMatchObject({ units: 'metric', weeklyGoal: 5, restTimerAlerts: true, trainingDays: ['Mon', 'Wed'], firstProgram: 'starter', theme: 'dark' });
    expect(p.preferences.profile).toMatchObject({ height: 178, heightUnit: 'cm', experienceLevel: 'Intermediate' });
    expect(p.preferences.onboarding).toMatchObject({ completed: true, skipped: false });
  });

  it('converts imperial bodyweight to kilograms and keeps the stored weight when none was entered', () => {
    expect(buildOnboardingPayload({ answers: { units: 'imperial', weight: '165' }, profile, currentUser: user(1) }).bodyweight_kg).toBeCloseTo(74.8, 1);
    expect(buildOnboardingPayload({ answers: { target: 4 }, profile, currentUser: user(1) }).bodyweight_kg).toBe(80);
  });
});

describe('buildStarterProgram', () => {
  it('has three startable days with real exercises', () => {
    const { program, days } = buildStarterProgram();
    expect(program.name).toBe('Beginner Foundations');
    expect(days).toHaveLength(3);
    days.forEach((day) => expect(day.exercises.length).toBeGreaterThan(0));
  });
});
