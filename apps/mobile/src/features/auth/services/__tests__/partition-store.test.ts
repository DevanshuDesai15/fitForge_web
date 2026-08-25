import { describe, expect, it, vi } from 'vitest';
import { createPartitionStore, partitionForUser } from '../partition-store';

describe('local user partitions', () => {
  it('uses the Clerk user ID as an opaque isolated namespace', () => {
    expect(partitionForUser('user_abc123')).toBe('clerk:user_abc123');
    expect(() => partitionForUser(' ')).toThrow('user ID');
  });

  it('selects and clears the active namespace', async () => {
    const storage = { getItemAsync: vi.fn(), setItemAsync: vi.fn(), deleteItemAsync: vi.fn() };
    const store = createPartitionStore(storage);
    await store.select('user_abc123');
    expect(storage.setItemAsync).toHaveBeenCalledWith('fitforge.activePartition', 'clerk:user_abc123');
    await store.clear();
    expect(storage.deleteItemAsync).toHaveBeenCalledWith('fitforge.activePartition');
  });
});
