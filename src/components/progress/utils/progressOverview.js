// Week-to-date numbers for the Progress overview, ported from Progress.jsx's renderOverview
// (same estimates: 8 active minutes per logged exercise, weekly goal from the profile, default 4 training days).
export const DEFAULT_WEEKLY_GOAL = 4;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDate = (ts) => (ts?.toDate ? ts.toDate() : new Date(ts));
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const uniqueDays = (list) => new Set(list.map((ex) => dayKey(toDate(ex.timestamp)))).size;
const percentChange = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 100) : 0);

const volumeOf = (list) => list.reduce((sum, ex) => {
  const sets = Array.isArray(ex.sets) ? ex.sets : [];
  return sum + sets.reduce((s, set) => s + (parseFloat(set.weight || 0) * parseInt(set.reps || 0, 10) || 0), 0);
}, 0);

export function buildOverview(exercises = [], personalRecords = [], now = new Date(), weeklyGoal = DEFAULT_WEEKLY_GOAL) {
  const year = now.getFullYear();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfWeek.getDate() - 7);

  const thisWeek = exercises.filter((ex) => toDate(ex.timestamp) >= startOfWeek);
  const prevWeek = exercises.filter((ex) => {
    const d = toDate(ex.timestamp);
    return d >= startOfPrevWeek && d < startOfWeek;
  });

  const weekDays = uniqueDays(thisWeek);
  const weekVolume = volumeOf(thisWeek);
  const activeMinutes = thisWeek.length * 8;

  // Streak: consecutive training days ending today (an empty today doesn't break it yet).
  const trained = new Set(exercises.map((ex) => dayKey(toDate(ex.timestamp))));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    if (trained.has(dayKey(cursor))) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedThisYear = [...trained].filter((d) => d.startsWith(String(year))).sort();
  let longestStreak = sortedThisYear.length ? 1 : 0;
  let run = 1;
  for (let i = 1; i < sortedThisYear.length; i += 1) {
    const gap = Math.round((new Date(sortedThisYear[i]) - new Date(sortedThisYear[i - 1])) / 86400000);
    run = gap === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  const thisYear = exercises.filter((ex) => toDate(ex.timestamp).getFullYear() === year);
  const monthCounts = Array(12).fill(0);
  thisYear.forEach((ex) => { monthCounts[toDate(ex.timestamp).getMonth()] += 1; });
  const busiest = monthCounts.indexOf(Math.max(...monthCounts));
  const weeksElapsed = Math.max(1, Math.ceil((now - new Date(year, 0, 1)) / (7 * 86400000)));

  const topRecord = personalRecords[0];
  return {
    weekDays,
    weeklyGoal,
    weekDaysChange: weekDays - uniqueDays(prevWeek),
    weekVolume,
    volumeChange: percentChange(weekVolume, volumeOf(prevWeek)),
    activeMinutes,
    streak,
    weeklyChart: DAY_NAMES.map((day, i) => ({
      day,
      volume: Math.round(volumeOf(thisWeek.filter((ex) => toDate(ex.timestamp).getDay() === (i === 6 ? 0 : i + 1)))),
    })),
    achievements: [
      weekDays >= weeklyGoal ? { kind: 'weekly', title: 'Weekly Goal Achieved!', sub: `Completed ${weekDays} workouts this week` } : null,
      topRecord ? { kind: 'record', title: 'Personal Best!', exerciseName: topRecord.exerciseName, weight: topRecord.weight } : null,
    ].filter(Boolean),
    consistency: [
      { label: 'Longest streak this year', value: `${longestStreak} days`, highlight: true },
      { label: 'Most active month', value: monthCounts[busiest] > 0 ? MONTHS[busiest] : '—' },
      { label: 'Average workouts/week', value: (uniqueDays(thisYear) / weeksElapsed).toFixed(1) },
    ],
  };
}
