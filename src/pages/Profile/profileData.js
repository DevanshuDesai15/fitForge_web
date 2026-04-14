import { parseHeight } from '../../utils/unitConversion';

const DEFAULT_PREFERENCES = {
  units: 'imperial',
  theme: 'dark',
  language: 'english',
  autoSync: true,
};

const DEFAULT_NOTIFICATIONS = {
  workoutReminders: true,
  progressUpdates: true,
  achievements: true,
  aiRecommendations: true,
};

const toNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toKg = (weight, unitPreference) => {
  const parsedWeight = toNullableNumber(weight);
  if (parsedWeight === null) {
    return null;
  }

  if (unitPreference === 'metric') {
    return parsedWeight;
  }

  return Number((parsedWeight / 2.20462).toFixed(1));
};

const parseTrainingFrequency = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
};

export const getProfilePreferences = (profile) => ({
  ...DEFAULT_PREFERENCES,
  ...(profile?.preferences || {}),
});

export const getProfileNotifications = (profile) => ({
  ...DEFAULT_NOTIFICATIONS,
  ...(profile?.preferences?.notifications || {}),
});

export const mapProfileToUserData = ({ profile, currentUser }) => {
  const preferences = getProfilePreferences(profile);
  const profileDetails = preferences.profile || {};
  const displayName = profile?.display_name || '';

  return {
    username: displayName,
    fullName: displayName,
    email: currentUser?.email || profile?.email || '',
    age: profile?.age ?? '',
    weight: profile?.bodyweight_kg ?? '',
    weightUnit: 'kg',
    height: profileDetails.height || '',
    heightUnit: profileDetails.heightUnit || 'ft',
    gender: profileDetails.gender || 'male',
    bio: profileDetails.bio || '',
    fitnessGoal: profileDetails.fitnessGoal || '',
    preferredWorkoutTime: profileDetails.preferredWorkoutTime || '',
    experienceLevel: profileDetails.experienceLevel || '',
    workoutFrequency: profileDetails.workoutFrequency || '',
    targetWeight: profileDetails.targetWeight || '',
    createdAt: profile?.created_at || null,
  };
};

export const buildProfileUpdatePayload = ({
  formData,
  currentUser,
  profile,
}) => {
  const existingPreferences = getProfilePreferences(profile);
  const existingProfileDetails = existingPreferences.profile || {};
  const nextDisplayName = formData.fullName
    || `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
    || profile?.display_name
    || currentUser?.email?.split('@')[0]
    || 'User';
  const unitPreference = existingPreferences.units || 'imperial';
  const nextNotifications = {
    ...getProfileNotifications(profile),
    ...(formData.notifications || {}),
  };

  return {
    id: currentUser.uid,
    display_name: nextDisplayName,
    email: currentUser.email || profile?.email || null,
    age: toNullableNumber(formData.age ?? profile?.age),
    bodyweight_kg: toKg(formData.weight ?? profile?.bodyweight_kg, unitPreference),
    training_frequency: parseTrainingFrequency(
      formData.workoutsPerWeek
      ?? existingProfileDetails.workoutFrequency
      ?? profile?.training_frequency
    ),
    preferences: {
      ...existingPreferences,
      profile: {
        ...existingProfileDetails,
        height: parseHeight(formData.height, formData.heightUnit || existingProfileDetails.heightUnit || 'ft') ?? existingProfileDetails.height ?? '',
        heightUnit: formData.heightUnit ?? existingProfileDetails.heightUnit ?? 'ft',
        bio: formData.bio ?? existingProfileDetails.bio ?? '',
        fitnessGoal: formData.primaryGoal ?? formData.fitnessGoal ?? existingProfileDetails.fitnessGoal ?? '',
        preferredWorkoutTime: formData.preferredWorkoutTime ?? existingProfileDetails.preferredWorkoutTime ?? '',
        experienceLevel: formData.experienceLevel ?? existingProfileDetails.experienceLevel ?? '',
        workoutFrequency: formData.workoutsPerWeek ?? existingProfileDetails.workoutFrequency ?? '',
        targetWeight: formData.targetWeight ?? existingProfileDetails.targetWeight ?? '',
      },
      notifications: nextNotifications,
    },
  };
};
