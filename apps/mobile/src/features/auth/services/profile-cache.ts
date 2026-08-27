import * as SecureStore from 'expo-secure-store';
import type { MobileProfile } from './profile-repository';

const key = (userId: string) => `fitforge.profile.${userId}`;
type Storage = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync'>;

export function createProfileCache(storage: Storage = SecureStore) {
  return {
    async get(userId: string): Promise<MobileProfile | null> {
      if (!userId.trim()) return null;
      const encoded = await storage.getItemAsync(key(userId));
      if (!encoded) return null;
      try {
        const profile = JSON.parse(encoded) as MobileProfile;
        return profile.id === userId ? profile : null;
      } catch {
        return null;
      }
    },
    async set(userId: string, profile: MobileProfile): Promise<void> {
      if (!userId.trim() || profile.id !== userId) throw new Error('Profile cache owner mismatch');
      await storage.setItemAsync(key(userId), JSON.stringify(profile));
    },
  };
}

export const profileCache = createProfileCache();
