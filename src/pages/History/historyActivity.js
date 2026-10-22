import { addDays, differenceInCalendarDays, format, startOfWeek, startOfYear, subWeeks } from 'date-fns';
import { convertWeight } from '../../utils/unitConversions';

const toArray = (value) => (Array.isArray(value) ? value : []);
const completedSets = (exercise) => toArray(exercise?.sets).filter((set) => set?.completed !== false);

export function getWorkoutDate(workout) {
  const raw = workout?.timestamp || workout?.createdAt || workout?.created_at;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export const getWorkoutSeconds = (workout) =>
  Number(workout?.durationSeconds ?? workout?.duration_seconds ?? workout?.duration) || 0;

export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export const getWorkoutFallbackUnit = (workout) => workout?.weight_unit || workout?.weightUnit || 'lbs';

// Weight of one set in the display unit; null for bodyweight or non-numeric sets.
export function getSetWeight(set, fallbackUnit, displayUnit) {
  if (set?.weightType === 'bodyweight') return null;
  const weight = parseFloat(set?.weight);
  if (!Number.isFinite(weight)) return null;
  const from = (set?.weightUnit || fallbackUnit) === 'kg' ? 'kg' : 'lbs';
  return Number(convertWeight(weight, from, displayUnit));
}

function sumVolume(exercises, fallbackUnit, displayUnit) {
  return exercises.reduce((total, exercise) => total + completedSets(exercise).reduce((sum, set) => {
    const weight = getSetWeight(set, fallbackUnit, displayUnit);
    return weight === null ? sum : sum + weight * (parseInt(set.reps, 10) || 0);
  }, 0), 0);
}

export const getWorkoutVolume = (workout, displayUnit) =>
  sumVolume(toArray(workout?.exercises), getWorkoutFallbackUnit(workout), displayUnit);

export const getWorkoutSetCount = (workout) =>
  toArray(workout?.exercises).reduce((n, exercise) => n + completedSets(exercise).length, 0);

export function summarizeExercise(exercise, displayUnit) {
  const first = toArray(exercise.sets)[0] || {};
  const weight = getSetWeight(first, exercise.weightUnit, displayUnit);
  const load = first.weightType === 'bodyweight' ? 'Bodyweight' : weight === null ? null : `${weight}${displayUnit}`;
  return [`${exercise.setCount} sets`, first.reps != null ? `${first.reps} reps` : null, load].filter(Boolean).join(' × ');
}

export function getExerciseStats(workouts, displayUnit) {
  const names = new Set();
  let totalExercises = 0;
  let totalReps = 0;
  let totalWeight = 0;
  for (const workout of toArray(workouts)) {
    const fallback = getWorkoutFallbackUnit(workout);
    for (const exercise of toArray(workout?.exercises)) {
      totalExercises += 1;
      names.add(exercise?.name || exercise?.exerciseName);
      totalReps += completedSets(exercise).reduce((sum, set) => sum + (parseInt(set.reps, 10) || 0), 0);
      totalWeight += sumVolume([exercise], fallback, displayUnit);
    }
  }
  return { totalExercises, uniqueExercises: names.size, totalReps, totalWeight };
}

const weekKey = (date) => format(startOfWeek(date), 'yyyy-MM-dd');

// Streaks count weeks, not days: rest days are part of a program.
function getWeekStreaks(workouts, now) {
  const weeks = new Set(workouts.map((w) => getWorkoutDate(w)).filter(Boolean).map(weekKey));
  let cursor = startOfWeek(now);
  if (!weeks.has(weekKey(cursor))) cursor = subWeeks(cursor, 1); // an empty current week doesn't break the streak yet
  let currentStreak = 0;
  while (weeks.has(weekKey(cursor))) {
    currentStreak += 1;
    cursor = subWeeks(cursor, 1);
  }

  const sorted = [...weeks].sort();
  let longestStreak = 0;
  let run = 0;
  sorted.forEach((key, i) => {
    run = i > 0 && differenceInCalendarDays(new Date(`${key}T00:00`), new Date(`${sorted[i - 1]}T00:00`)) === 7 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  });
  return { currentStreak, longestStreak };
}

function buildDay(date, list, displayUnit) {
  const names = [...new Set(list.flatMap((w) => toArray(w.exercises).map((e) => e?.name || e?.exerciseName)))];
  return {
    label: format(date, 'EEE, MMM d'),
    count: list.length,
    duration: formatDuration(list.reduce((sum, w) => sum + getWorkoutSeconds(w), 0)),
    name: list[0]?.name || list[0]?.workoutName || 'Workout',
    focus: names.slice(0, 3).join(', '),
    exercises: names.length,
    volume: `${Math.round(list.reduce((sum, w) => sum + getWorkoutVolume(w, displayUnit), 0)).toLocaleString()} ${displayUnit}`,
    workoutIds: list.map((w) => w.id),
  };
}

// Calendar model for the current year, Jan 1 → today. `values`/`days` are indexed by
// grid cell (week columns of Sun→Sat); null pads the first and last week.
export function buildActivity(workouts, displayUnit, now = new Date()) {
  const year = now.getFullYear();
  const start = startOfYear(now);
  const lead = start.getDay();
  const dayCount = differenceInCalendarDays(now, start) + 1;

  const byDay = new Map();
  for (const workout of toArray(workouts)) {
    const date = getWorkoutDate(workout);
    if (!date || date.getFullYear() !== year) continue;
    const key = format(date, 'yyyy-MM-dd');
    byDay.set(key, [...(byDay.get(key) || []), workout]);
  }

  const values = Array(lead).fill(null);
  const days = Array(lead).fill(null);
  for (let i = 0; i < dayCount; i += 1) {
    const date = addDays(start, i);
    const list = byDay.get(format(date, 'yyyy-MM-dd')) || [];
    values.push(list.length);
    days.push(buildDay(date, list, displayUnit));
  }
  while (values.length % 7) {
    values.push(null);
    days.push(null);
  }

  const months = Array.from({ length: now.getMonth() + 1 }, (_, m) => {
    const first = new Date(year, m, 1);
    return { label: format(first, 'MMM'), weekIndex: Math.floor((lead + differenceInCalendarDays(first, start)) / 7) };
  });

  const thisYear = [...byDay.values()].flat();
  return {
    year,
    values,
    days,
    months,
    todayIndex: lead + dayCount - 1,
    totalWorkouts: thisYear.length,
    workoutDays: byDay.size,
    monthLabel: format(now, 'MMM'),
    monthCount: thisYear.filter((w) => getWorkoutDate(w).getMonth() === now.getMonth()).length,
    ...getWeekStreaks(toArray(workouts), now),
  };
}

const exerciseName = (exercise) => exercise?.name || exercise?.exerciseName;

export function getWorkoutVolumeKg(exercises, fallbackUnit) {
  return Math.round(sumVolume(toArray(exercises), fallbackUnit, 'kg') * 10) / 10;
}

// Returns a new exercises array with one set replaced (`patch`), or removed (`patch` null).
// Edited values are entered in the display unit, so the set is re-stamped with it.
export function editSet(exercises, exerciseIndex, setIndex, patch, displayUnit) {
  return exercises.map((exercise, ei) => {
    if (ei !== exerciseIndex) return exercise;
    const sets = toArray(exercise.sets);
    if (patch === null) return { ...exercise, sets: sets.filter((_, si) => si !== setIndex) };
    const { weight, reps } = patch;
    return {
      ...exercise,
      sets: sets.map((set, si) => (si !== setIndex ? set : {
        ...set,
        reps,
        ...(set.weightType === 'bodyweight' ? {} : { weight, weightUnit: displayUnit }),
      })),
    };
  });
}

function bestWeight(workouts, name, displayUnit) {
  let best = 0;
  for (const workout of toArray(workouts)) {
    const fallback = getWorkoutFallbackUnit(workout);
    for (const exercise of toArray(workout?.exercises)) {
      if (exerciseName(exercise) !== name) continue;
      for (const set of completedSets(exercise)) best = Math.max(best, getSetWeight(set, fallback, displayUnit) || 0);
    }
  }
  return best;
}

// Did replacing this workout's exercises knock down the heaviest weight ever logged for a lift?
// Returns { exercise, from, to } (the record that fell and what stands now) or null.
export function findFallenRecord(workouts, workoutId, nextExercises, displayUnit) {
  const current = toArray(workouts).find((w) => w.id === workoutId);
  if (!current) return null;
  const after = toArray(workouts).map((w) => (w.id === workoutId ? { ...w, exercises: nextExercises } : w));
  for (const exercise of toArray(current.exercises)) {
    const name = exerciseName(exercise);
    const from = bestWeight(workouts, name, displayUnit);
    const to = bestWeight(after, name, displayUnit);
    if (to < from) return { exercise: name, from, to };
  }
  return null;
}
