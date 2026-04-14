import { describe, expect, it } from 'vitest';
import { buildProfileSyncPayload } from '../profileSync';

describe('buildProfileSyncPayload', () => {
  it('preserves an existing app-managed display name', () => {
    const payload = buildProfileSyncPayload({
      user: {
        id: 'user_123',
        fullName: 'Devanshu Desai',
        primaryEmailAddress: { emailAddress: 'devanshu@example.com' },
      },
      existingProfile: {
        display_name: 'Custom Gym Alias',
      },
    });

    expect(payload).toEqual({
      id: 'user_123',
      email: 'devanshu@example.com',
    });
  });

  it('seeds display_name from Clerk only when the profile has no name yet', () => {
    const payload = buildProfileSyncPayload({
      user: {
        id: 'user_123',
        fullName: 'Devanshu Desai',
        primaryEmailAddress: { emailAddress: 'devanshu@example.com' },
      },
      existingProfile: null,
    });

    expect(payload).toEqual({
      id: 'user_123',
      email: 'devanshu@example.com',
      display_name: 'Devanshu Desai',
    });
  });
});
