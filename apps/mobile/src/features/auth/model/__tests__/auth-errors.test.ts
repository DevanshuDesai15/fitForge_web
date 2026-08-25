import { describe, expect, it } from 'vitest';
import { clerkError, normalizeEmail } from '../auth-errors';

describe('Clerk error presentation', () => {
  it('preserves Clerk field errors and messages', () => {
    expect(clerkError({ errors: [{ code: 'form_password_incorrect', longMessage: 'Password is incorrect.', meta: { paramName: 'password' } }] })).toEqual({
      code: 'form_password_incorrect', field: 'password', message: 'Password is incorrect.', rateLimited: false,
    });
  });

  it('reports Clerk throttling without inventing an attempt budget', () => {
    expect(clerkError({ errors: [{ code: 'too_many_requests', message: 'Try again later.' }] })).toMatchObject({ message: 'Try again later.', rateLimited: true });
  });

  it('normalizes email casing and surrounding whitespace', () => {
    expect(normalizeEmail('  Devanshu@Example.COM ')).toBe('devanshu@example.com');
  });
});
