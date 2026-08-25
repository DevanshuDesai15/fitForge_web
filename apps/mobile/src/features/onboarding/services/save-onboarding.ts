import type { SupabaseClient } from '@supabase/supabase-js';
import type { MobileProfile } from '@/features/auth/services/profile-repository';
import type { OnboardingState } from '../model/onboarding';

const optionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export function buildOnboardingProfileUpdate({ state, existingPreferences }: { state: OnboardingState; existingPreferences: Record<string, unknown> }) {
  const weight = optionalNumber(state.bodyweight);
  const height = optionalNumber(state.height);
  const existingProfile = typeof existingPreferences.profile === 'object' && existingPreferences.profile !== null ? existingPreferences.profile as Record<string, unknown> : {};
  return {
    ...(weight === undefined ? {} : { bodyweight_kg: Number((state.units === 'metric' ? weight : weight / 2.20462).toFixed(1)) }),
    training_frequency: state.weeklyTarget,
    preferences: {
      ...existingPreferences,
      units: state.units,
      experience_level: state.experience,
      training_days: state.trainingDays,
      starter_program: state.starterProgram,
      rest_timer_notifications: state.restAlerts,
      onboarding_completed: true,
      profile: {
        ...existingProfile,
        ...(height === undefined ? {} : { height, heightUnit: state.units === 'metric' ? 'cm' : 'in' }),
        experienceLevel: state.experience,
        workoutFrequency: state.weeklyTarget,
      },
    },
  };
}

export async function saveOnboarding(client: SupabaseClient, userId: string, state: OnboardingState, existingPreferences: Record<string, unknown>) {
  const payload = buildOnboardingProfileUpdate({ state, existingPreferences });
  const { data, error } = await client.from('profiles').update(payload).eq('id', userId).select('id, display_name, email, preferences, bodyweight_kg, training_frequency').single();
  if (error) throw new Error(`Unable to save setup: ${error.message}`);
  return data as MobileProfile;
}
