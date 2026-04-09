const DEFAULT_STARTER_SETS = [
  { weight: '', reps: '', completed: false },
  { weight: '', reps: '', completed: false },
  { weight: '', reps: '', completed: false },
];

const starterWorkoutCatalog = [
  {
    id: 'starter-full-body-foundation',
    title: 'Full Body Foundation',
    category: 'Full Body',
    description: 'A beginner-friendly full body session focused on movement basics.',
    duration: '60 min',
    difficulty: 'Beginner',
    exercises: [
      { name: 'Goblet Squat', targetSets: 3, muscleGroup: 'legs', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Push-Up', targetSets: 3, muscleGroup: 'chest', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Dumbbell Row', targetSets: 3, muscleGroup: 'back', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Romanian Deadlift', targetSets: 3, muscleGroup: 'hamstrings', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Plank', targetSets: 3, muscleGroup: 'core', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
    ],
  },
  {
    id: 'starter-upper-body-basics',
    title: 'Upper Body Basics',
    category: 'Upper Body',
    description: 'A simple upper-body workout to build pressing and pulling confidence.',
    duration: '60 min',
    difficulty: 'Beginner',
    exercises: [
      { name: 'Incline Push-Up', targetSets: 3, muscleGroup: 'chest', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Lat Pulldown', targetSets: 3, muscleGroup: 'back', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Seated Dumbbell Shoulder Press', targetSets: 3, muscleGroup: 'shoulders', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Cable Row', targetSets: 3, muscleGroup: 'back', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Dumbbell Biceps Curl', targetSets: 3, muscleGroup: 'biceps', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
    ],
  },
  {
    id: 'starter-lower-body-core-basics',
    title: 'Lower Body & Core Basics',
    category: 'Lower Body',
    description: 'A low-complexity lower-body and core session designed for beginners.',
    duration: '60 min',
    difficulty: 'Beginner',
    exercises: [
      { name: 'Bodyweight Squat', targetSets: 3, muscleGroup: 'legs', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Reverse Lunge', targetSets: 3, muscleGroup: 'glutes', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Glute Bridge', targetSets: 3, muscleGroup: 'glutes', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Dead Bug', targetSets: 3, muscleGroup: 'core', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
      { name: 'Bird Dog', targetSets: 3, muscleGroup: 'core', sets: DEFAULT_STARTER_SETS.map(set => ({ ...set })) },
    ],
  },
];

export function buildStarterWorkoutRecommendations() {
  return starterWorkoutCatalog.map((workout) => ({
    id: workout.id,
    title: workout.title,
    category: workout.category,
    description: workout.description,
    duration: workout.duration,
    exercises: workout.exercises.length,
    difficulty: workout.difficulty,
    progress: 0,
    isAIPick: true,
    type: 'starter',
    dayData: {
      id: workout.id,
      templateId: workout.id,
      name: workout.title,
      exercises: workout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set })),
      })),
    },
  }));
}

export function buildStarterWorkoutStartState(workout, options = {}) {
  const exercises = (workout.dayData?.exercises || []).map((exercise) => ({
    ...exercise,
    sets: (exercise.sets || []).map((set) => ({ ...set })),
  }));

  return {
    templateId: workout.id,
    dayId: workout.id,
    editBeforeStart: options.editBeforeStart ?? false,
    workout: {
      name: workout.title,
      programName: workout.title,
      dayName: workout.title,
      exercises,
    },
  };
}
