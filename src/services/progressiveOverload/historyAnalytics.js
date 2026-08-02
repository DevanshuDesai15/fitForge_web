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
