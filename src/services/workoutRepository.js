import {
  mapWorkoutFromDb,
  mapWorkoutToDb,
  mapWorkoutUpdateToDb,
} from './workoutDataService';

function requireUserId(userId) {
  if (!userId) {
    throw new Error('Workout operations require an authenticated user');
  }
}

function mapRows(rows) {
  return (rows || []).map(mapWorkoutFromDb);
}

export async function listWorkouts({
  supabase,
  userId,
  columns = '*',
  completed,
  orderBy = 'timestamp',
  ascending = false,
  limit,
} = {}) {
  if (!userId) return [];

  let query = supabase
    .from('workouts')
    .select(columns)
    .eq('user_id', userId);

  if (typeof completed === 'boolean') {
    query = query.eq('completed', completed);
  }
  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }
  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return mapRows(data);
}

export async function createWorkoutRecord({ supabase, userId, workout }) {
  requireUserId(userId);
  const now = new Date().toISOString();
  const payload = mapWorkoutToDb(workout, userId, {
    createdAt: workout?.createdAt ?? workout?.created_at ?? now,
    updatedAt: workout?.updatedAt ?? workout?.updated_at ?? now,
  });
  const { data, error } = await supabase
    .from('workouts')
    .insert([payload])
    .select('*')
    .single();

  if (error) throw error;
  return mapWorkoutFromDb(data);
}

export async function updateWorkoutRecord({ supabase, userId, id, workout }) {
  requireUserId(userId);
  const payload = {
    ...mapWorkoutUpdateToDb(workout),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('workouts')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return mapWorkoutFromDb(data);
}

export async function deleteWorkoutRecord({ supabase, userId, id }) {
  requireUserId(userId);
  const { data, error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { deleted: Boolean(row), id: row?.id ?? id };
}
