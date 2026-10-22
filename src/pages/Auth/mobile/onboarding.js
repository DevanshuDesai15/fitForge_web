import { buildProfileUpdatePayload, getProfilePreferences } from '../../Profile/profileData';
import { buildStarterWorkoutRecommendations } from '../../Workout/components/starterWorkoutRecommendations';

// Only accounts made in the last day see the setup wizard, so existing users are never interrupted by it
// and a skipped or finished wizard (onboarding.completed) never returns.
export const SETUP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function shouldShowSetup({ profile, user, now = Date.now() }) {
  if (profile?.preferences?.onboarding?.completed) return false;
  const created = user?.createdAt ? new Date(user.createdAt).getTime() : NaN;
  return Number.isFinite(created) && now - created < SETUP_WINDOW_MS;
}

export const EXPERIENCE_LEVELS = { new: 'Beginner', returning: 'Intermediate', advanced: 'Advanced' };

// The one program the wizard can create with real exercises in it: the three beginner starter sessions,
// in order. (The generic program templates have empty days, which cannot be started.)
export function buildStarterProgram() {
  const days = buildStarterWorkoutRecommendations().map(({ dayData, description }) => ({
    name: dayData.name,
    focus: description,
    exercises: dayData.exercises,
  }));
  return {
    program: {
      name: 'Beginner Foundations',
      description: 'Three simple sessions that teach the main movement patterns.',
      duration: '4 weeks',
      frequency: '3x/week',
      category: 'Strength Training',
      difficulty: 'Beginner',
    },
    days,
    defaults: { category: 'Strength Training', difficulty: 'Beginner', isCustom: true },
  };
}

// `answers` holds only the steps the user actually answered; anything missing is left as it was.
//   { units, weight, height, level, target, days, alerts, firstProgram }
// With no answers (skipped) only the onboarding flag is written.
export function buildOnboardingPayload({ answers = {}, profile, currentUser, now = new Date() }) {
  const existing = getProfilePreferences(profile);
  const units = answers.units || existing.units;
  const onboarding = { completed: true, skipped: Object.keys(answers).length === 0, completedAt: now.toISOString() };
  const displayName = profile?.display_name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  if (!Object.keys(answers).length) {
    return { id: currentUser.uid, display_name: displayName, email: currentUser.email || profile?.email || null, preferences: { ...existing, onboarding } };
  }

  const payload = buildProfileUpdatePayload({
    formData: {
      weight: answers.weight,
      height: answers.height,
      heightUnit: units === 'metric' ? 'cm' : 'ft',
      experienceLevel: answers.level ? EXPERIENCE_LEVELS[answers.level] : undefined,
      workoutsPerWeek: answers.target,
    },
    currentUser,
    profile: { ...profile, preferences: { ...existing, units } },
  });

  // buildProfileUpdatePayload reads a missing weight as the stored kilograms in the display unit.
  if (answers.weight === undefined || answers.weight === '') payload.bodyweight_kg = profile?.bodyweight_kg ?? null;

  payload.preferences = {
    ...payload.preferences,
    units,
    ...(answers.target ? { weeklyGoal: answers.target } : {}),
    ...(answers.alerts !== undefined ? { restTimerAlerts: answers.alerts } : {}),
    ...(answers.days ? { trainingDays: answers.days } : {}),
    ...(answers.firstProgram ? { firstProgram: answers.firstProgram } : {}),
    onboarding,
  };
  return payload;
}
