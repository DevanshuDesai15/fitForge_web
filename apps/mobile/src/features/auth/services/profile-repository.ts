export type MobileProfile = {
  id: string;
  display_name: string | null;
  email?: string | null;
  preferences: Record<string, unknown> | null;
  bodyweight_kg?: number | null;
  training_frequency?: number | null;
};

type ClerkIdentity = { id: string; email: string | null; displayName: string | null };
type QueryResult<T> = Promise<{ data: T; error: { message?: string } | null }>;
type ProfilesClient = {
  from(table: 'profiles'): {
    select(columns: string): { eq(column: 'id', id: string): { maybeSingle(): QueryResult<MobileProfile | null> } };
    upsert(payload: Record<string, unknown>, options: { onConflict: 'id' }): { select(columns: string): { single(): QueryResult<MobileProfile> } };
  };
};

const PROFILE_COLUMNS = 'id, display_name, email, preferences, bodyweight_kg, training_frequency';

export function profileIsOnboarded(profile: Pick<MobileProfile, 'preferences'>) {
  return profile.preferences?.onboarding_completed === true;
}

export async function resolveProfile(client: ProfilesClient, identity: ClerkIdentity): Promise<MobileProfile> {
  const table = client.from('profiles');
  const lookup = await table.select(PROFILE_COLUMNS).eq('id', identity.id).maybeSingle();
  if (lookup.error) throw new Error(lookup.error.message ?? 'Unable to load profile');
  if (lookup.data) return lookup.data;

  const payload = { id: identity.id, email: identity.email, display_name: identity.displayName ?? 'New Lifter' };
  const created = await table.upsert(payload, { onConflict: 'id' }).select(PROFILE_COLUMNS).single();
  if (created.error) throw new Error(created.error.message ?? 'Unable to create profile');
  return created.data;
}
