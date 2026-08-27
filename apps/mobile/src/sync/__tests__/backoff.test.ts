import { describe, expect, it } from 'vitest';
import { nextRetryAt } from '../backoff';

describe('sync backoff', () => {
  it('uses deterministic bounded jitter and caps exponential delay', () => {
    expect(nextRetryAt(1, 0, () => 0.5)).toBe('1970-01-01T00:00:01.000Z');
    expect(nextRetryAt(2, 0, () => 0)).toBe('1970-01-01T00:00:01.500Z');
    expect(nextRetryAt(99, 0, () => 1)).toBe('1970-01-01T01:15:00.000Z');
  });
});
