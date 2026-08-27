import { describe, expect, it, vi } from 'vitest';
import type { OutboxOperation, WorkoutRecord } from '@fitforge/types';
import { createSyncCoordinator } from '../sync-coordinator';

const workout: WorkoutRecord = { id: 'workout-1', userId: 'user_1', name: 'Push', timestamp: '2026-08-25T10:00:00.000Z', durationSeconds: 10, totalVolumeKg: 20, notes: '', exercises: [], completed: true, completedAt: '2026-08-25T10:00:10.000Z', createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T10:00:10.000Z' };
const operation: OutboxOperation = { id: 'op-1', partition: 'clerk:user_1', entity: 'workout', entityId: workout.id, action: 'upsert', payload: workout, attempts: 0, nextAttemptAt: workout.updatedAt, status: 'pending', lastError: null, createdAt: workout.createdAt };

function setup(ready: OutboxOperation[] = [operation]) {
  const order: string[] = [];
  const local = { cache: vi.fn(async () => { order.push('cache'); }), deleteCached: vi.fn(async () => undefined) };
  let delivered = false;
  const outbox = { count: vi.fn(async () => 0), ready: vi.fn(async () => { if (delivered) return []; delivered = true; return ready; }), acknowledge: vi.fn(async () => { order.push('ack'); }), retry: vi.fn(async () => undefined), fail: vi.fn(async () => undefined) };
  const checkpoints = { get: vi.fn(async () => null), set: vi.fn(async () => undefined) };
  const cloud = { upsert: vi.fn(async (_userId: string, value: WorkoutRecord) => { order.push('push'); return value; }), remove: vi.fn(async () => undefined), pull: vi.fn(async (): Promise<WorkoutRecord[]> => { order.push('pull'); return []; }) };
  const coordinator = createSyncCoordinator({ local, outbox, checkpoints, cloud, now: () => new Date('2026-08-25T12:00:00.000Z'), random: () => 0.5 });
  return { coordinator, local, outbox, checkpoints, cloud, order };
}

describe('sync coordinator', () => {
  it('is single-flight and saves the accepted cloud row before acknowledging and pulling', async () => {
    const fixture = setup();
    const first = fixture.coordinator.sync('user_1');
    const second = fixture.coordinator.sync('user_1');
    expect(second).toBe(first);
    await first;
    expect(fixture.order).toEqual(['push', 'cache', 'ack', 'pull']);
    expect(fixture.outbox.ready).toHaveBeenCalledWith('clerk:user_1', expect.any(String), 50);
  });

  it('schedules retryable failures and does not pull over unsent local work', async () => {
    const fixture = setup();
    fixture.cloud.upsert.mockRejectedValueOnce(Object.assign(new Error('network offline'), { status: 503 }));
    await fixture.coordinator.sync('user_1');
    expect(fixture.outbox.retry).toHaveBeenCalledWith('clerk:user_1', 'op-1', 1, '2026-08-25T12:00:01.000Z', 'network offline');
    expect(fixture.cloud.pull).not.toHaveBeenCalled();
    expect(fixture.outbox.acknowledge).not.toHaveBeenCalled();
  });

  it('retains auth and permanent failures as inspectable operations', async () => {
    const auth = setup();
    auth.cloud.upsert.mockRejectedValueOnce(Object.assign(new Error('expired'), { status: 401 }));
    await auth.coordinator.sync('user_1');
    expect(auth.outbox.fail).toHaveBeenCalledWith('clerk:user_1', 'op-1', 'blocked-auth', 'expired');

    const invalid = setup();
    invalid.cloud.upsert.mockRejectedValueOnce(Object.assign(new Error('invalid'), { status: 422 }));
    await invalid.coordinator.sync('user_1');
    expect(invalid.outbox.fail).toHaveBeenCalledWith('clerk:user_1', 'op-1', 'permanent-failure', 'invalid');
  });

  it('advances the stable checkpoint only after caching a complete returned page', async () => {
    const fixture = setup([]);
    fixture.cloud.pull.mockResolvedValueOnce([workout]).mockResolvedValueOnce([]);
    const coordinator = createSyncCoordinator({ local: fixture.local, outbox: fixture.outbox, checkpoints: fixture.checkpoints, cloud: fixture.cloud, batchSize: 1 });
    await coordinator.sync('user_1');
    expect(fixture.checkpoints.set).toHaveBeenCalledWith({ partition: 'clerk:user_1', entity: 'workout', updatedAt: workout.updatedAt, entityId: workout.id });
    expect(fixture.local.cache.mock.invocationCallOrder[0]).toBeLessThan(fixture.checkpoints.set.mock.invocationCallOrder[0]);
  });

  it('derives every local query from the requested user instead of accepting a caller partition', async () => {
    const fixture = setup([]);
    await fixture.coordinator.sync('user_2');
    expect(fixture.outbox.ready).toHaveBeenCalledWith('clerk:user_2', expect.any(String), 50);
    expect(fixture.outbox.count).toHaveBeenCalledWith('clerk:user_2');
    expect(fixture.cloud.pull).toHaveBeenCalledWith('user_2', null, 50);
  });
});
