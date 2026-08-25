export interface PendingWorkInspector { countForActiveUser(): Promise<number> }

// Phase 3 replaces this no-op adapter with the SQLite outbox inspector.
export const pendingWorkInspector: PendingWorkInspector = {
  async countForActiveUser() { return 0; },
};
