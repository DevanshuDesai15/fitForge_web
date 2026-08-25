import { describe, expect, it } from 'vitest';
import { gateDestination } from '../../model/auth-policy';

describe('route-group authentication gate', () => {
  it('keeps signed-out users out of application routes', () => {
    expect(gateDestination('app', { clerkLoaded: true, signedIn: false, profile: 'unknown' })).toBe('/welcome');
  });

  it('sends incomplete profiles to setup from either route group', () => {
    expect(gateDestination('app', { clerkLoaded: true, signedIn: true, profile: 'incomplete' })).toBe('/setup');
    expect(gateDestination('auth', { clerkLoaded: true, signedIn: true, profile: 'incomplete' })).toBe(null);
  });

  it('keeps completed users out of authentication routes', () => {
    expect(gateDestination('auth', { clerkLoaded: true, signedIn: true, profile: 'complete' })).toBe('/home');
  });

  it('does not redirect while identity or profile state is loading', () => {
    expect(gateDestination('app', { clerkLoaded: false, signedIn: false, profile: 'loading' })).toBe(null);
    expect(gateDestination('app', { clerkLoaded: true, signedIn: true, profile: 'loading' })).toBe(null);
  });
});
