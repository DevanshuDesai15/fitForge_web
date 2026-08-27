import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { WorkoutRepository } from '@fitforge/types';
import { useAuthBootstrap } from '@/features/auth/providers/AuthBootstrapProvider';
import { configurePendingWorkInspector, createPendingWorkInspector } from '@/features/auth/services/pending-work';
import { createSyncCoordinator, type SyncCoordinator } from '@/sync/sync-coordinator';
import { useSyncTriggers } from '@/sync/useSyncTriggers';
import { createSqliteCheckpointRepository } from '../repositories/sqlite-checkpoint-repository';
import { createSqliteOutboxRepository } from '../repositories/sqlite-outbox-repository';
import { createSqliteWorkoutRepository } from '../repositories/sqlite-workout-repository';
import { createSupabaseWorkoutRepository } from '../repositories/supabase-workout-repository';
import { getFitForgeDatabase } from '../sqlite/database';

export type SyncStatus = 'idle' | 'syncing' | 'synchronized' | 'retryable';
type Services = { workouts: WorkoutRepository; coordinator: SyncCoordinator; outbox: ReturnType<typeof createSqliteOutboxRepository> };
type DataValue = { ready: boolean; partition: string | null; workouts: WorkoutRepository | null; syncStatus: SyncStatus; syncNow(): Promise<void> };

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { signedIn, userId, supabase } = useAuthBootstrap();
  const [services, setServices] = useState<Services | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const activePartition = signedIn && userId ? `clerk:${userId}` : null;

  useEffect(() => {
    let active = true;
    void getFitForgeDatabase().then((database) => {
      if (!active) return;
      const workouts = createSqliteWorkoutRepository(database);
      const outbox = createSqliteOutboxRepository(database);
      const checkpoints = createSqliteCheckpointRepository(database);
      const cloud = createSupabaseWorkoutRepository(supabase);
      setServices({ workouts, outbox, coordinator: createSyncCoordinator({ local: workouts, outbox, checkpoints, cloud }) });
    }).catch(() => { if (active) setSyncStatus('retryable'); });
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    if (!services) return undefined;
    return configurePendingWorkInspector(createPendingWorkInspector(services.outbox, () => activePartition));
  }, [activePartition, services]);

  const syncNow = useCallback(async () => {
    if (!services || !signedIn || !userId) return;
    setSyncStatus('syncing');
    try {
      await services.coordinator.sync(userId);
      setSyncStatus('synchronized');
    } catch {
      setSyncStatus('retryable');
    }
  }, [services, signedIn, userId]);
  const triggerSync = useCallback(() => { void syncNow(); }, [syncNow]);
  useSyncTriggers(Boolean(services && signedIn && userId), triggerSync);

  const visibleSyncStatus = signedIn ? syncStatus : 'idle';
  const value = useMemo<DataValue>(() => ({ ready: Boolean(services), partition: activePartition, workouts: services?.workouts ?? null, syncStatus: visibleSyncStatus, syncNow }), [activePartition, services, syncNow, visibleSyncStatus]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
