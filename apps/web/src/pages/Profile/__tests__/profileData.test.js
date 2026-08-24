import { describe, expect, it } from 'vitest';
import {
  buildProfileUpdatePayload,
  getProfileNotifications,
  mapProfileToUserData,
} from '../profileData';

describe('profileData', () => {
  it('maps the current schema into the profile page user model', () => {
    const result = mapProfileToUserData({
      profile: {
        display_name: 'Grant Ustin',
        email: 'grant@example.com',
        age: 29,
        bodyweight_kg: 82.5,
        created_at: '2026-04-01T00:00:00.000Z',
        preferences: {
          units: 'metric',
          profile: {
            bio: 'Loves lifting',
            height: '183',
            heightUnit: 'cm',
            fitnessGoal: 'Build Muscle & Strength',
          },
        },
      },
      currentUser: { email: 'grant@example.com' },
    });

    expect(result.fullName).toBe('Grant Ustin');
    expect(result.weight).toBe(82.5);
    expect(result.bio).toBe('Loves lifting');
    expect(result.fitnessGoal).toBe('Build Muscle & Strength');
  });

  it('builds a payload that only uses supported profile columns', () => {
    const payload = buildProfileUpdatePayload({
      currentUser: {
        uid: 'user_123',
        email: 'grant@example.com',
      },
      profile: {
        display_name: 'Old Name',
        preferences: {
          units: 'imperial',
          profile: {
            bio: 'Old bio',
          },
        },
      },
      formData: {
        firstName: 'Grant',
        lastName: 'Ustin',
        age: '30',
        weight: '180',
        bio: 'New bio',
        workoutsPerWeek: '5 times',
        notifications: {
          workoutReminders: false,
        },
      },
    });

    expect(payload).toMatchObject({
      id: 'user_123',
      display_name: 'Grant Ustin',
      email: 'grant@example.com',
      age: 30,
      bodyweight_kg: 81.6,
      training_frequency: 5,
    });
    expect(payload).not.toHaveProperty('bio');
    expect(payload).not.toHaveProperty('full_name');
    expect(payload).not.toHaveProperty('target_weight');
    expect(payload.preferences.profile.bio).toBe('New bio');
    expect(payload.preferences.notifications.workoutReminders).toBe(false);
  });

  it('reads notifications from preferences', () => {
    expect(
      getProfileNotifications({
        preferences: {
          notifications: {
            aiRecommendations: false,
          },
        },
      })
    ).toMatchObject({
      workoutReminders: true,
      progressUpdates: true,
      achievements: true,
      aiRecommendations: false,
    });
  });

  it('keeps notification settings nested under preferences', () => {
    const payload = buildProfileUpdatePayload({
      currentUser: {
        uid: 'user_123',
        email: 'grant@example.com',
      },
      profile: {
        display_name: 'Grant Ustin',
        preferences: {
          units: 'imperial',
          notifications: {
            workoutReminders: true,
            progressUpdates: true,
            achievements: true,
            aiRecommendations: true,
          },
        },
      },
      formData: {
        notifications: {
          progressUpdates: false,
        },
      },
    });

    expect(payload).not.toHaveProperty('notifications');
    expect(payload.preferences.notifications).toMatchObject({
      workoutReminders: true,
      progressUpdates: false,
      achievements: true,
      aiRecommendations: true,
    });
  });
});
