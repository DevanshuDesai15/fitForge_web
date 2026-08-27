import { describe, expect, it, vi } from 'vitest';
import { createPendingWorkInspector } from '../pending-work';

describe('SQLite pending-work adapter', () => {
  it('counts only the active partition without deleting its rows', async () => {
    const count = vi.fn(async () => 3);
    const inspector = createPendingWorkInspector({ count }, () => 'clerk:user_1');
    await expect(inspector.countForActiveUser()).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith('clerk:user_1');
  });

  it('does not query another partition when there is no active user', async () => {
    const count = vi.fn(async () => 3);
    await expect(createPendingWorkInspector({ count }, () => null).countForActiveUser()).resolves.toBe(0);
    expect(count).not.toHaveBeenCalled();
  });
});
