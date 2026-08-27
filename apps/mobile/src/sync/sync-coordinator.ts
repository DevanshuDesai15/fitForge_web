import { classifySyncFailure } from '@fitforge/domain';
import type { OutboxOperation, WorkoutRecord } from '@fitforge/types';
import { nextRetryAt } from './backoff';

type LocalWorkouts = {
  cache(partition: string, workout: WorkoutRecord): Promise<void>;
  deleteCached(partition: string, id: string): Promise<void>;
};
type Outbox = {
  count(partition: string): Promise<number>;
  ready(partition: string, at: string, limit: number): Promise<OutboxOperation[]>;
  acknowledge(partition: string, id: string): Promise<void>;
  retry(partition: string, id: string, attempts: number, nextAttemptAt: string, message: string): Promise<void>;
  fail(partition: string, id: string, status: 'blocked-auth' | 'permanent-failure', message: string): Promise<void>;
};
type Checkpoints = {
  get(partition: string): Promise<{ partition: string; entity: 'workout'; updatedAt: string; entityId: string } | null>;
  set(checkpoint: { partition: string; entity: 'workout'; updatedAt: string; entityId: string }): Promise<void>;
};
type Cloud = {
  upsert(userId: string, workout: WorkoutRecord): Promise<WorkoutRecord>;
  remove(userId: string, id: string): Promise<void>;
  pull(userId: string, checkpoint: Awaited<ReturnType<Checkpoints['get']>>, limit: number): Promise<WorkoutRecord[]>;
};
type Dependencies = { local: LocalWorkouts; outbox: Outbox; checkpoints: Checkpoints; cloud: Cloud; now?: () => Date; random?: () => number; batchSize?: number };

function errorDetails(error: unknown) {
  if (error && typeof error === 'object') return error as { status?: number; message?: string };
  return { message: String(error) };
}

export function createSyncCoordinator({ local, outbox, checkpoints, cloud, now = () => new Date(), random = Math.random, batchSize = 50 }: Dependencies) {
  let inFlight: Promise<void> | null = null;
  let inFlightUserId: string | null = null;

  const run = async (userId: string) => {
    if (!userId.trim()) throw new Error('An active user is required to sync');
    const partition = `clerk:${userId}`;
    let pushFailed = false;
    while (!pushFailed) {
      const operations = await outbox.ready(partition, now().toISOString(), batchSize);
      if (operations.length === 0) break;
      for (const operation of operations) {
        try {
          if (operation.action === 'upsert') {
            if (!operation.payload || operation.payload.userId !== userId) throw Object.assign(new Error('Outbox workout owner mismatch'), { status: 422 });
            const accepted = await cloud.upsert(userId, operation.payload);
            await local.cache(partition, accepted);
          } else {
            await cloud.remove(userId, operation.entityId);
            await local.deleteCached(partition, operation.entityId);
          }
          await outbox.acknowledge(partition, operation.id);
        } catch (error) {
          pushFailed = true;
          const failure = errorDetails(error);
          const message = failure.message ?? 'Unknown synchronization failure';
          const kind = classifySyncFailure(failure);
          if (kind === 'retryable') {
            const attempts = operation.attempts + 1;
            await outbox.retry(partition, operation.id, attempts, nextRetryAt(attempts, now().getTime(), random), message);
          } else {
            await outbox.fail(partition, operation.id, kind === 'permanent' ? 'permanent-failure' : 'blocked-auth', message);
          }
          break;
        }
      }
    }

    if (pushFailed || await outbox.count(partition) > 0) return;
    let checkpoint = await checkpoints.get(partition);
    while (true) {
      const page = await cloud.pull(userId, checkpoint, batchSize);
      for (const workout of page) await local.cache(partition, workout);
      if (page.length > 0) {
        const last = page[page.length - 1];
        checkpoint = { partition, entity: 'workout', updatedAt: last.updatedAt, entityId: last.id };
        await checkpoints.set(checkpoint);
      }
      if (page.length < batchSize) break;
    }
  };

  return {
    sync(userId: string): Promise<void> {
      if (inFlight) return inFlightUserId === userId ? inFlight : inFlight.then(() => this.sync(userId));
      inFlightUserId = userId;
      inFlight = run(userId).finally(() => { inFlight = null; inFlightUserId = null; });
      return inFlight;
    },
  };
}

export type SyncCoordinator = ReturnType<typeof createSyncCoordinator>;
