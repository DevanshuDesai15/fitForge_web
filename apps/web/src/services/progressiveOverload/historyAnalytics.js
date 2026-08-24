export function analyzeExerciseFrequency(workouts) {
  const exerciseCount = new Map();
  const exerciseLastSeen = new Map();
  const totalExercises = new Set();

  workouts.forEach((workout, index) => {
    if (!Array.isArray(workout.exercises)) return;
    workout.exercises.forEach((exercise) => {
      const exerciseId = exercise.exerciseId;
      if (!exerciseId || typeof exerciseId !== 'string') return;

      totalExercises.add(exerciseId);
      exerciseCount.set(exerciseId, (exerciseCount.get(exerciseId) || 0) + 1);
      if (!exerciseLastSeen.has(exerciseId)) exerciseLastSeen.set(exerciseId, index);
    });
  });

  const frequencyData = Array.from(exerciseCount.entries())
    .map(([exerciseId, count]) => ({
      exerciseId,
      exerciseName: exerciseId.replace('-', ' '),
      frequency: count,
      frequencyPercentage: (count / workouts.length) * 100,
      lastSeenWorkoutsAgo: exerciseLastSeen.get(exerciseId),
      isRegular: count >= Math.ceil(workouts.length * 0.3),
      isRecent: exerciseLastSeen.get(exerciseId) <= 2,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  return {
    totalUniqueExercises: totalExercises.size,
    mostFrequent: frequencyData.slice(0, 5),
    regularExercises: frequencyData.filter((exercise) => exercise.isRegular),
    recentExercises: frequencyData.filter((exercise) => exercise.isRecent),
    averageExercisesPerWorkout:
      workouts.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0) /
      workouts.length,
  };
}

export function analyzeVolumeProgression(workouts) {
  const volumeData = [...workouts]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((workout) => ({
      date: workout.timestamp,
      totalVolume: workout.totalVolume || 0,
      exerciseCount: workout.exercises?.length || 0,
    }));
  const totalVolume = volumeData.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const averageVolume = totalVolume / volumeData.length;
  const midpoint = Math.floor(volumeData.length / 2);
  const firstHalf = volumeData.slice(0, midpoint);
  const secondHalf = volumeData.slice(midpoint);
  const firstHalfAverage =
    firstHalf.reduce((sum, workout) => sum + workout.totalVolume, 0) /
    firstHalf.length;
  const secondHalfAverage =
    secondHalf.reduce((sum, workout) => sum + workout.totalVolume, 0) /
    secondHalf.length;
  const progressionRate = secondHalfAverage - firstHalfAverage;

  return {
    totalVolume,
    averageVolume: Math.round(averageVolume),
    progressionRate: Math.round(progressionRate),
    progressionPercentage:
      firstHalfAverage > 0
        ? Math.round((progressionRate / firstHalfAverage) * 100)
        : 0,
    volumeDistribution: volumeData,
    highestVolume: Math.max(...volumeData.map((workout) => workout.totalVolume)),
    lowestVolume: Math.min(...volumeData.map((workout) => workout.totalVolume)),
  };
}

export function analyzePersonalRecords(workouts) {
  const records = new Map();
  const progression = new Map();
  workouts.forEach((workout) => {
    if (!Array.isArray(workout.exercises)) return;
    workout.exercises.forEach((exercise) => {
      const exerciseId = exercise.exerciseId;
      if (!exerciseId || typeof exerciseId !== 'string' || !Array.isArray(exercise.sets)) return;
      exercise.sets.forEach((set) => {
        const volume = (set.weight || 0) * (set.reps || 0);
        const weight = set.weight || 0;
        if (!records.has(exerciseId)) {
          records.set(exerciseId, {
            exerciseId,
            exerciseName: exerciseId.replace('-', ' '),
            maxWeight: 0,
            maxVolume: 0,
            maxReps: 0,
            firstSeen: workout.timestamp,
            lastImprovement: null,
          });
        }
        const current = records.get(exerciseId);
        let improved = false;
        if (weight > current.maxWeight) {
          current.maxWeight = weight;
          current.lastImprovement = workout.timestamp;
          improved = true;
        }
        if (volume > current.maxVolume) {
          current.maxVolume = volume;
          if (!improved) current.lastImprovement = workout.timestamp;
          improved = true;
        }
        if ((set.reps || 0) > current.maxReps) {
          current.maxReps = set.reps || 0;
          if (!improved) current.lastImprovement = workout.timestamp;
        }
        if (!progression.has(exerciseId)) progression.set(exerciseId, []);
        progression.get(exerciseId).push({
          date: workout.timestamp,
          weight,
          volume,
          reps: set.reps || 0,
        });
      });
    });
  });
  const recordList = Array.from(records.values());
  return {
    totalRecords: recordList.length,
    recentRecords: recordList.filter(
      (record) =>
        record.lastImprovement &&
        Date.now() - new Date(record.lastImprovement).getTime() < 30 * 24 * 60 * 60 * 1000
    ),
    topPerformers: recordList
      .filter((record) => record.maxWeight > 0)
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 5),
    progressionData: Object.fromEntries(progression),
  };
}

function getWorkoutIntervals(workouts) {
  const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dates = sorted.map((workout) => new Date(workout.date));
  const intervals = [];
  for (let index = 1; index < dates.length; index += 1) {
    intervals.push((dates[index] - dates[index - 1]) / (1000 * 60 * 60 * 24));
  }
  return { sorted, intervals };
}

export function analyzeTrends(workouts) {
  const { sorted, intervals } = getWorkoutIntervals(workouts);
  const averageDaysBetween = intervals.length
    ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length
    : 0;
  const volumeProgression = sorted.map((workout) => ({
    date: workout.timestamp,
    totalVolume: workout.totalVolume || 0,
    duration: workout.duration || 0,
    exerciseCount: workout.exercises?.length || 0,
  }));
  const recent = volumeProgression.slice(-5);
  const earlier = volumeProgression.slice(0, 5);
  const recentAverage = recent.reduce((sum, workout) => sum + workout.totalVolume, 0) / recent.length;
  const earlierAverage = earlier.reduce((sum, workout) => sum + workout.totalVolume, 0) / earlier.length;
  const change = recentAverage - earlierAverage;
  return {
    workoutFrequency: {
      averageDaysBetween: Math.round(averageDaysBetween * 10) / 10,
      weeklyFrequency: 7 / averageDaysBetween,
      consistency: calculateConsistencyScore(intervals),
    },
    volume: {
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      changeAmount: Math.round(change),
      changePercentage: earlierAverage > 0 ? Math.round((change / earlierAverage) * 100) : 0,
      currentAverage: Math.round(recentAverage),
      progression: volumeProgression,
    },
    duration: {
      average: Math.round(sorted.reduce((sum, workout) => sum + (workout.duration || 0), 0) / sorted.length),
      trend: calculateDurationTrend(sorted),
    },
  };
}

export function analyzeConsistency(workouts) {
  const { intervals } = getWorkoutIntervals(workouts);
  if (workouts.length < 2) return { score: 0, rating: 'insufficient_data' };
  const score = calculateConsistencyScore(intervals);
  const rating = score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : score >= 0.4 ? 'fair' : 'poor';
  return {
    score: Math.round(score * 100) / 100,
    rating,
    averageDaysBetween: Math.round((intervals.reduce((sum, days) => sum + days, 0) / intervals.length) * 10) / 10,
    longestGap: Math.max(...intervals),
    shortestGap: Math.min(...intervals),
  };
}

export function generateHistoryBasedRecommendations(workouts) {
  const recommendations = [];
  const { sorted, intervals } = getWorkoutIntervals(workouts);
  const averageDaysBetween = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;
  if (averageDaysBetween > 4) recommendations.push('Consider increasing workout frequency - aim for 3-4 sessions per week for optimal progress');
  if (averageDaysBetween < 1.5) recommendations.push('You might be overtraining - consider adding rest days between sessions');
  const uniqueExercises = new Set();
  workouts.forEach((workout) => workout.exercises?.forEach((exercise) => uniqueExercises.add(exercise.exerciseId)));
  if (uniqueExercises.size < 8) recommendations.push('Add more exercise variety to target different muscle groups and movement patterns');
  const recentVolume = sorted.slice(-3).reduce((sum, workout) => sum + (workout.totalVolume || 0), 0) / 3;
  const earlierVolume = sorted.slice(0, 3).reduce((sum, workout) => sum + (workout.totalVolume || 0), 0) / 3;
  if (recentVolume <= earlierVolume) recommendations.push('Your training volume has plateaued - consider progressive overload by increasing weights or reps');
  return recommendations;
}

export function calculateConsistencyScore(daysBetweenWorkouts) {
  if (daysBetweenWorkouts.length === 0) return 0;

  const mean =
    daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) /
    daysBetweenWorkouts.length;
  const variance =
    daysBetweenWorkouts.reduce(
      (sum, days) => sum + Math.pow(days - mean, 2),
      0
    ) / daysBetweenWorkouts.length;

  return Math.max(0, 1 - Math.sqrt(variance) / 7);
}

export function calculateDurationTrend(workouts) {
  if (workouts.length < 4) return 'stable';

  const recentDurations = workouts.slice(-3).map((workout) => workout.duration || 0);
  const earlierDurations = workouts.slice(0, 3).map((workout) => workout.duration || 0);
  const recentAverage =
    recentDurations.reduce((sum, duration) => sum + duration, 0) /
    recentDurations.length;
  const earlierAverage =
    earlierDurations.reduce((sum, duration) => sum + duration, 0) /
    earlierDurations.length;
  const difference = recentAverage - earlierAverage;

  if (difference > 5) return 'increasing';
  if (difference < -5) return 'decreasing';
  return 'stable';
}

export function getEmptyWorkoutAnalysis() {
  return {
    totalWorkouts: 0,
    dateRange: { start: null, end: null },
    exerciseFrequency: {
      totalUniqueExercises: 0,
      mostFrequent: [],
      regularExercises: [],
      recentExercises: [],
    },
    personalRecords: {
      totalRecords: 0,
      recentRecords: [],
      topPerformers: [],
    },
    trends: {
      workoutFrequency: { averageDaysBetween: 0, weeklyFrequency: 0 },
      volume: { trend: 'stable' },
    },
    consistency: { score: 0, rating: 'insufficient_data' },
    volume: { totalVolume: 0, averageVolume: 0, progressionRate: 0 },
    recommendations: [
      'Complete more workouts to get personalized insights and recommendations',
    ],
  };
}
