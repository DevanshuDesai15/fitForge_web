export type ClerkUserId = string;
export type EntityId = string;
export type IsoTimestamp = string;

export type WeightUnit = 'kg' | 'lbs';
export type WorkoutSet = { id: EntityId; weight: number; reps: number; completed: boolean };
export type WorkoutExercise = { id: EntityId; name: string; sets: WorkoutSet[] };
export type WorkoutRecord = {
  id: EntityId;
  userId: ClerkUserId;
  name: string;
  timestamp: IsoTimestamp;
  durationSeconds: number | null;
  totalVolumeKg: number | null;
  notes: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  completedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type OutboxAction = 'upsert' | 'delete';
export type OutboxStatus = 'pending' | 'blocked-auth' | 'permanent-failure';
export type OutboxOperation = {
  id: EntityId;
  partition: string;
  entity: 'workout';
  entityId: EntityId;
  action: OutboxAction;
  payload: WorkoutRecord | null;
  attempts: number;
  nextAttemptAt: IsoTimestamp;
  status: OutboxStatus;
  lastError: string | null;
  createdAt: IsoTimestamp;
};
export type SyncCheckpoint = { partition: string; entity: 'workout'; updatedAt: IsoTimestamp; entityId: EntityId };

export interface WorkoutRepository {
  list(partition: string): Promise<WorkoutRecord[]>;
  get(partition: string, id: EntityId): Promise<WorkoutRecord | null>;
  save(partition: string, workout: WorkoutRecord): Promise<void>;
  remove(partition: string, id: EntityId): Promise<void>;
}
