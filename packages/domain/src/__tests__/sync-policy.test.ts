import { describe, expect, it } from 'vitest';
import { classifySyncFailure } from '..';

describe('classifySyncFailure', () => {
  it.each([
    [{ status: 401 }, 'blocked-auth'],
    [{ message: 'JWT expired' }, 'blocked-auth'],
    [{ status: 429 }, 'retryable'],
    [{ status: 503 }, 'retryable'],
    [{ message: 'Network request failed' }, 'retryable'],
    [{ status: 422 }, 'permanent'],
  ] as const)('classifies %o as %s', (failure, expected) => {
    expect(classifySyncFailure(failure)).toBe(expected);
  });
});
