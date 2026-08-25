import * as SecureStore from 'expo-secure-store';

const ACTIVE_PARTITION_KEY = 'fitforge.activePartition';
type Storage = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'>;

export function partitionForUser(userId: string) {
  const id = userId.trim();
  if (!id) throw new Error('A Clerk user ID is required for local partition selection');
  return `clerk:${id}`;
}

export function createPartitionStore(storage: Storage = SecureStore) {
  return {
    current: () => storage.getItemAsync(ACTIVE_PARTITION_KEY),
    select: (userId: string) => storage.setItemAsync(ACTIVE_PARTITION_KEY, partitionForUser(userId)),
    clear: () => storage.deleteItemAsync(ACTIVE_PARTITION_KEY),
  };
}

export const partitionStore = createPartitionStore();
