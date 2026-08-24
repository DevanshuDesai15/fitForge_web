import { describe, expect, it, vi } from 'vitest';

import {
  safeCapture,
  identifyUser,
  resetAnalytics,
} from '../analyticsService';

describe('analyticsService', () => {
  it('swallows analytics capture failures so product flows stay successful', () => {
    const posthog = {
      capture: vi.fn(() => {
        throw new Error('capture failed');
      }),
    };

    expect(() => {
      safeCapture(posthog, 'goal_created', { goal_id: 'goal_1' });
    }).not.toThrow();
  });

  it('identifies a signed-in user when a client is available', () => {
    const posthog = { identify: vi.fn() };

    identifyUser(posthog, {
      id: 'user_123',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      fullName: 'Test User',
      firstName: 'Test',
    });

    expect(posthog.identify).toHaveBeenCalledWith('user_123', {
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('resets analytics without throwing when the client errors', () => {
    const posthog = {
      reset: vi.fn(() => {
        throw new Error('reset failed');
      }),
    };

    expect(() => {
      resetAnalytics(posthog);
    }).not.toThrow();
  });
});
