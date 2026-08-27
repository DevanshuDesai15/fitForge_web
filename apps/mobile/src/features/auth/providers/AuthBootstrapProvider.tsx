import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMobileEnv } from '@/config/env';
import type { ProfileResolution } from '../model/auth-policy';
import { partitionStore } from '../services/partition-store';
import { createMobileSupabaseClient } from '../services/supabase';
import { profileIsOnboarded, resolveProfile, type MobileProfile } from '../services/profile-repository';
import { profileCache } from '../services/profile-cache';

type BootstrapValue = {
  clerkLoaded: boolean;
  signedIn: boolean;
  userId: string | null;
  profile: MobileProfile | null;
  profileStatus: ProfileResolution;
  profileError: string | null;
  supabase: SupabaseClient;
  refreshProfile: () => void;
};

const AuthBootstrapContext = createContext<BootstrapValue | null>(null);

export function AuthBootstrapProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const env = getMobileEnv();
  const supabase = useMemo(() => createMobileSupabaseClient({ url: env.EXPO_PUBLIC_SUPABASE_URL, publishableKey: env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, getToken }), [env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, env.EXPO_PUBLIC_SUPABASE_URL, getToken]);
  const [resolution, setResolution] = useState<{ userId: string; profile: MobileProfile | null; status: ProfileResolution; error: string | null }>({ userId: '', profile: null, status: 'unknown', error: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    if (!isLoaded || !isSignedIn || !userId || !user) return () => { active = false; };
    void (async () => {
      try {
        await partitionStore.select(userId);
        const resolved = await resolveProfile(supabase as never, {
          id: userId,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          displayName: user.fullName ?? user.firstName ?? null,
        });
        await profileCache.set(userId, resolved).catch(() => undefined);
        if (!active) return;
        setResolution({ userId, profile: resolved, error: null, status: profileIsOnboarded(resolved) ? 'complete' : 'incomplete' });
      } catch (error) {
        if (!active) return;
        const cached = await profileCache.get(userId).catch(() => null);
        if (!active) return;
        if (cached) {
          setResolution({ userId, profile: cached, error: null, status: profileIsOnboarded(cached) ? 'complete' : 'incomplete' });
        } else {
          setResolution({ userId, profile: null, error: error instanceof Error ? error.message : 'Unable to resolve your FitForge profile.', status: 'error' });
        }
      }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, revision, supabase, user, userId]);

  const currentResolution = isSignedIn && userId && resolution.userId === userId ? resolution : { profile: null, status: isSignedIn ? 'loading' as const : 'unknown' as const, error: null };
  const value = useMemo<BootstrapValue>(() => ({ clerkLoaded: isLoaded, signedIn: Boolean(isSignedIn), userId: userId ?? null, profile: currentResolution.profile, profileStatus: currentResolution.status, profileError: currentResolution.error, supabase, refreshProfile: () => setRevision((value) => value + 1) }), [currentResolution.error, currentResolution.profile, currentResolution.status, isLoaded, isSignedIn, supabase, userId]);
  return <AuthBootstrapContext.Provider value={value}>{children}</AuthBootstrapContext.Provider>;
}

export function useAuthBootstrap() {
  const value = useContext(AuthBootstrapContext);
  if (!value) throw new Error('useAuthBootstrap must be used inside AuthBootstrapProvider');
  return value;
}
