export type ProfileResolution = 'unknown' | 'loading' | 'incomplete' | 'complete' | 'error';
export type AuthState = { clerkLoaded: boolean; signedIn: boolean; profile: ProfileResolution };

export function authDestination(state: AuthState): '/welcome' | '/setup' | '/home' | null {
  if (!state.clerkLoaded) return null;
  if (!state.signedIn) return '/welcome';
  if (state.profile === 'unknown' || state.profile === 'loading') return null;
  if (state.profile === 'complete') return '/home';
  return '/setup';
}

export type GateArea = 'auth' | 'app';
export function gateDestination(area: GateArea, state: AuthState): '/welcome' | '/setup' | '/home' | null {
  if (!state.clerkLoaded || (state.signedIn && (state.profile === 'unknown' || state.profile === 'loading'))) return null;
  if (area === 'app') {
    if (!state.signedIn) return '/welcome';
    return state.profile === 'complete' ? null : '/setup';
  }
  if (!state.signedIn) return null;
  return state.profile === 'complete' ? '/home' : null;
}
