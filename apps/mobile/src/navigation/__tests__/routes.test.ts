import { describe, expect, it } from 'vitest';
import { routes } from '../routes';

describe('typed route builders', () => {
  it('encodes dynamic route identifiers', () => {
    expect(routes.program('strength / power')).toBe('/programs/strength%20%2F%20power');
    expect(routes.programDay('p1', 'day 1')).toBe('/programs/p1/day/day%201');
    expect(routes.exercise('bench/press')).toBe('/exercise/bench%2Fpress');
    expect(routes.session('session 1')).toBe('/session/session%201');
  });

  it('rejects empty identifiers', () => {
    expect(() => routes.exercise('  ')).toThrow('route identifier');
  });

  it('exposes the gallery only in development', () => {
    expect(routes.gallery(true)).toBe('/gallery');
    expect(routes.gallery(false)).toBe('/+not-found');
  });
});
