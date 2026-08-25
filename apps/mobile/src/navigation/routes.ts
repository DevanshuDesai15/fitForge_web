import type { Href } from 'expo-router';

const segment = (value: string) => {
  const normalized = value.trim();
  if (!normalized) throw new Error('A route identifier cannot be empty');
  return encodeURIComponent(normalized);
};

export const routes = {
  welcome: '/welcome' as Href,
  signIn: '/sign-in' as Href,
  signUp: '/sign-up' as Href,
  verification: '/verification' as Href,
  oauthCallback: '/oauth-callback' as Href,
  setup: '/setup' as Href,
  home: '/home' as Href,
  workouts: '/workouts' as Href,
  activeWorkout: '/workout/active' as Href,
  history: '/history' as Href,
  progress: '/progress' as Href,
  profile: '/profile' as Href,
  program: (programId: string) => `/programs/${segment(programId)}` as Href,
  programDay: (programId: string, dayId: string) => `/programs/${segment(programId)}/day/${segment(dayId)}` as Href,
  exercise: (exerciseId: string) => `/exercise/${segment(exerciseId)}` as Href,
  session: (sessionId: string) => `/session/${segment(sessionId)}` as Href,
  gallery: (development = __DEV__) => (development ? '/gallery' : '/+not-found') as Href,
} as const;
