import { describe, expect, it } from 'vitest';

describe('browser-like test environment', () => {
  it('provides functional isolated localStorage through jsdom', () => {
    window.localStorage.clear();

    window.localStorage.setItem('fitforge-test-key', 'stored-value');

    expect(window.localStorage.getItem('fitforge-test-key')).toBe('stored-value');
    expect(window.localStorage.length).toBe(1);

    window.localStorage.removeItem('fitforge-test-key');

    expect(window.localStorage.getItem('fitforge-test-key')).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});
