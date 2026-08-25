import { describe, expect, it } from 'vitest';
import { authDestination } from '../auth-policy';

describe('authentication destination policy', () => {
  it.each([
    [{ clerkLoaded: false, signedIn: false, profile: 'unknown' }, null],
    [{ clerkLoaded: true, signedIn: false, profile: 'unknown' }, '/welcome'],
    [{ clerkLoaded: true, signedIn: true, profile: 'loading' }, null],
    [{ clerkLoaded: true, signedIn: true, profile: 'incomplete' }, '/setup'],
    [{ clerkLoaded: true, signedIn: true, profile: 'complete' }, '/home'],
  ] as const)('maps %o to %s', (state, destination) => {
    expect(authDestination(state)).toBe(destination);
  });
});
