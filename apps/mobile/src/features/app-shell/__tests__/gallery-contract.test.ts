import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('development gallery contract', () => {
  it('documents every primitive category and representative state', () => {
    const source = readFileSync('app/(dev)/gallery.tsx', 'utf8');
    for (const heading of ['Core', 'Data', 'Feedback', 'Forms', 'Navigation', 'Workout', 'Disabled', 'Loading', 'Error', 'Empty', 'Dialog', 'Sheet']) {
      expect(source).toContain(heading);
    }
  });
});
