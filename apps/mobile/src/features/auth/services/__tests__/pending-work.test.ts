import { describe, expect, it } from 'vitest';
import { pendingWorkInspector } from '../pending-work';

describe('Phase 2 pending-work adapter', () => {
  it('reports no outbox until the Phase 3 SQLite implementation replaces it', async () => {
    await expect(pendingWorkInspector.countForActiveUser()).resolves.toBe(0);
  });
});
