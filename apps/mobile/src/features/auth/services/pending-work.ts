export interface PendingWorkInspector { countForActiveUser(): Promise<number> }

let activeInspector: PendingWorkInspector = { async countForActiveUser() { return 0; } };

export function configurePendingWorkInspector(inspector: PendingWorkInspector) {
  activeInspector = inspector;
  return () => { if (activeInspector === inspector) activeInspector = { async countForActiveUser() { return 0; } }; };
}

export function createPendingWorkInspector(outbox: { count(partition: string): Promise<number> }, activePartition: () => string | null): PendingWorkInspector {
  return { async countForActiveUser() { const partition = activePartition(); return partition ? outbox.count(partition) : 0; } };
}

export const pendingWorkInspector: PendingWorkInspector = { countForActiveUser: () => activeInspector.countForActiveUser() };
