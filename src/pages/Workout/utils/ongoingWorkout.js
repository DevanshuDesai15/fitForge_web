import { clearPersistedWorkoutState } from './workoutTimerState';

// Mirrors useWorkoutState's restore window; a session older than this is dropped on restore anyway.
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

// Read-only peek at the persisted session so screens other than StartWorkout can offer "resume"
// without mounting useWorkoutState (which owns writing and clearing that storage).
export function readOngoingWorkout(userId, now = Date.now(), storage = localStorage) {
  if (!userId) return null;
  try {
    const state = JSON.parse(storage.getItem('workoutState'));
    if (!state || state.userId !== userId || !state.workoutStarted) return null;
    if (!Array.isArray(state.exercises) || !state.exercises.length) return null;
    const savedAt = Number(state.timestamp);
    if (!Number.isFinite(savedAt) || now - savedAt > MAX_AGE_MS) return null;
    return {
      name: state.selectedDay?.name || state.currentTemplate?.name || 'Workout',
      sets: state.exercises.reduce((total, ex) => total + (ex.sets?.filter((set) => set.completed).length || 0), 0),
      savedAt,
    };
  } catch {
    return null;
  }
}

export function formatAgo(timestamp, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export const discardOngoingWorkout = () => clearPersistedWorkoutState();
