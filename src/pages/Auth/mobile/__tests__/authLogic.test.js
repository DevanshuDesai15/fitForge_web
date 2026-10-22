import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCKOUT_SECONDS, parseClerkError } from '../clerkErrors';
import { isEmail, passwordStrength } from '../passwordStrength';

describe('parseClerkError', () => {
  it('maps known Clerk codes to short copy', () => {
    expect(parseClerkError({ errors: [{ code: 'form_password_incorrect' }] }).message).toBe("That password doesn't match.");
    expect(parseClerkError({ errors: [{ code: 'form_identifier_exists' }] }).message).toMatch(/already has an account/);
  });

  it('reads the lockout countdown from a locked account', () => {
    expect(parseClerkError({ errors: [{ code: 'user_locked', meta: { lockout_expires_in_seconds: 1800 } }] })).toMatchObject({ code: 'user_locked', lockoutSeconds: 1800 });
    expect(parseClerkError({ errors: [{ code: 'user_locked' }] }).lockoutSeconds).toBe(DEFAULT_LOCKOUT_SECONDS);
  });

  it('falls back to Clerk\'s own text, then to a generic line', () => {
    expect(parseClerkError({ errors: [{ code: 'weird', longMessage: 'Clerk says hi.' }] }).message).toBe('Clerk says hi.');
    expect(parseClerkError(new Error('network')).message).toMatch(/Check your connection/);
    expect(parseClerkError(undefined).code).toBe('unknown');
  });
});

describe('passwordStrength / isEmail', () => {
  it('scores length, capital, number and symbol', () => {
    expect(passwordStrength('')).toEqual({ score: 0, word: 'Add more' });
    expect(passwordStrength('benchpress').score).toBe(1);
    expect(passwordStrength('benchpress25').score).toBe(2);
    expect(passwordStrength('Benchpress25!').score).toBe(4);
  });

  it('validates a plausible email', () => {
    expect(isEmail('you@example.com')).toBe(true);
    expect(isEmail(' you@example ')).toBe(false);
    expect(isEmail('nope')).toBe(false);
  });
});
