import { useProfile } from './useProfile';
import { getWorkoutPreferences } from '../pages/Profile/profileData';

// keepScreenAwake / restTimerAlerts / weeklyGoal from the profile, with defaults while it loads.
export function useWorkoutPreferences() {
  const { profile } = useProfile();
  return getWorkoutPreferences(profile);
}
