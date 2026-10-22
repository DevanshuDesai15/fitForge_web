import { format, startOfWeek } from 'date-fns';
import { bestWeight, getSetWeight, getWorkoutDate, getWorkoutSetCount, getWorkoutVolume } from '../../History/historyActivity';

const dayKey = (date) => format(date, 'yyyy-MM-dd');
const roundTo1 = (n) => Math.round(n * 10) / 10;

// Heaviest set of each lift in this session, beaten against everything logged before it.
// A lift with no earlier history is not a "record" — that would flag every exercise on day one.
function findRecords(exercises, priorWorkouts, weightUnit) {
  const records = [];
  for (const exercise of exercises) {
    if (exercise.exercise_type === 'cardio') continue;
    let best = 0;
    let reps = 0;
    for (const set of exercise.sets || []) {
      const weight = getSetWeight(set, weightUnit, weightUnit) || 0;
      const setReps = parseInt(set.reps, 10) || 0;
      if (weight > best || (weight === best && setReps > reps)) { best = weight; reps = setReps; }
    }
    const before = bestWeight(priorWorkouts, exercise.name, weightUnit);
    if (before > 0 && best > before) {
      records.push({ exercise: exercise.name, note: 'Heaviest weight yet', detail: `${roundTo1(best)}${weightUnit} × ${reps}`, delta: `+${roundTo1(best - before)}${weightUnit}` });
    }
  }
  return records;
}

// Which day of the program this session closed and what follows it. Needs 2+ days to be meaningful.
export function programContinuity(currentTemplate, selectedDay, templates = []) {
  const ids = currentTemplate?.template_ids ?? currentTemplate?.templateIds;
  if (!Array.isArray(ids) || ids.length < 2 || !selectedDay) return null;
  const index = ids.indexOf(selectedDay.templateId ?? selectedDay.id);
  if (index < 0) return null;
  const nextName = templates.find((t) => t.id === ids[(index + 1) % ids.length])?.name;
  if (!nextName) return null;
  return { name: currentTemplate.name, dayIndex: index + 1, dayCount: ids.length, nextDay: nextName };
}

// Everything the finish screen shows, derived from the exercises that were just saved and the
// workouts that existed before this one.
export function buildFinishSummary({ exercises, priorWorkouts = [], weightUnit, durationSeconds = 0, name, weeklyGoal, program = null, now = new Date() }) {
  const workout = { exercises, weightUnit };
  const weekStart = startOfWeek(now);
  const days = new Set([dayKey(now)]);
  for (const prior of priorWorkouts) {
    const date = getWorkoutDate(prior);
    if (date && date >= weekStart) days.add(dayKey(date));
  }
  return {
    name,
    minutes: Math.max(1, Math.round(durationSeconds / 60)),
    volume: Math.round(getWorkoutVolume(workout, weightUnit)),
    sets: getWorkoutSetCount(workout),
    exercises: exercises.length,
    records: findRecords(exercises, priorWorkouts, weightUnit),
    weekDone: days.size,
    weekTarget: weeklyGoal,
    program,
  };
}
