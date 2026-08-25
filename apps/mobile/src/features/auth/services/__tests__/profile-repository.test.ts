import { describe, expect, it, vi } from 'vitest';
import { profileIsOnboarded, resolveProfile } from '../profile-repository';

const user = { id: 'user_existing', email: 'devanshu@example.com', displayName: 'Devanshu Desai' };

describe('canonical profile resolution', () => {
  it('looks up the profile using the existing Clerk user ID', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: user.id, display_name: 'Coach D', preferences: { onboarding_completed: true } }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const result = await resolveProfile({ from } as never, user);
    expect(from).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user_existing');
    expect(result.display_name).toBe('Coach D');
  });

  it('inserts a missing profile without changing the Clerk identity', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const single = vi.fn().mockResolvedValue({ data: { id: user.id, display_name: user.displayName, preferences: {} }, error: null });
    const upsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }), upsert });
    const result = await resolveProfile({ from } as never, user);
    expect(upsert).toHaveBeenCalledWith({ id: user.id, email: user.email, display_name: user.displayName }, { onConflict: 'id' });
    expect(result.id).toBe(user.id);
  });

  it('recognizes only an explicitly completed onboarding profile', () => {
    expect(profileIsOnboarded({ preferences: { onboarding_completed: true } })).toBe(true);
    expect(profileIsOnboarded({ preferences: {} })).toBe(false);
  });
});
