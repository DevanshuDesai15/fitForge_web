const EFFECTIVENESS = {
  deload: 0.85,
  rep_range: 0.75,
  strength_focus: 0.7,
  volume_increase: 0.65,
  variation: 0.8,
  technique_refinement: 0.6,
  frequency_modification: 0.75,
  periodization_change: 0.9,
};

const VARIATIONS = {
  'bench-press': [
    { exerciseId: 'incline-bench-press', name: 'Incline Bench Press', description: 'Switch to incline angle to target upper chest', difficulty: 0.9, reasoning: 'Different angle provides novel stimulus', expectedOutcome: 'Upper chest development and renewed progress' },
    { exerciseId: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', description: 'Use dumbbells for greater range of motion', difficulty: 0.8, reasoning: 'Unilateral loading and stability challenge', expectedOutcome: 'Improved stability and muscle balance' },
  ],
  'shoulder-press': [
    { exerciseId: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', description: 'Switch to dumbbells for unilateral training', difficulty: 0.8, reasoning: 'Independent arm movement and stability challenge', expectedOutcome: 'Better shoulder stability and balance' },
    { exerciseId: 'seated-shoulder-press', name: 'Seated Shoulder Press', description: 'Remove leg drive by sitting', difficulty: 0.85, reasoning: 'Isolates shoulders by removing lower body assistance', expectedOutcome: 'Pure shoulder strength development' },
  ],
  squat: [
    { exerciseId: 'front-squat', name: 'Front Squat', description: 'Move bar to front position', difficulty: 0.75, reasoning: 'Different loading pattern emphasizes quads and core', expectedOutcome: 'Improved quad strength and posture' },
    { exerciseId: 'goblet-squat', name: 'Goblet Squat', description: 'Hold weight at chest level', difficulty: 0.6, reasoning: 'Teaches proper squat mechanics with front loading', expectedOutcome: 'Better squat form and core engagement' },
  ],
};

const REPLACEMENTS = {
  'bench-press': ['Push-ups', 'Dips', 'Chest Fly'],
  'shoulder-press': ['Lateral Raises', 'Pike Push-ups', 'Handstand Push-ups'],
  squat: ['Lunges', 'Step-ups', 'Bulgarian Split Squats'],
  deadlift: ['Romanian Deadlifts', 'Hip Thrusts', 'Good Mornings'],
};

export function calculateDeloadPercentage(plateau) {
  let percentage = plateau.severity === 'severe' ? 0.2 : plateau.severity === 'moderate' ? 0.15 : 0.1;
  if (plateau.plateauDuration >= 6) percentage += 0.05;
  return Math.min(percentage, 0.25);
}

export function calculateDeloadDuration(plateau) {
  return plateau.severity === 'severe' ? 2 : 1;
}

export function getMinimumWeight(exerciseId, compoundExercises) {
  return compoundExercises.includes(exerciseId) ? 20 : 5;
}

export function calculateInterventionEffectiveness(type, plateau) {
  let value = EFFECTIVENESS[type] || 0.7;
  if (plateau.severity === 'severe') value *= 1.1;
  else if (plateau.severity === 'mild') value *= 0.9;
  return Math.min(value, 0.95);
}

export function getExerciseVariations(exerciseId) {
  return VARIATIONS[exerciseId] || [{
    exerciseId: `${exerciseId}-variation`,
    name: `${exerciseId ? exerciseId.replace('-', ' ') : 'Unknown Exercise'} Variation`,
    description: 'Try a similar exercise with different equipment or angle',
    difficulty: 0.85,
    reasoning: 'Novel stimulus can break plateau',
    expectedOutcome: 'Renewed progress and motivation',
  }];
}

export function calculateTransferWeight(currentWeight, difficulty) {
  return Math.round(currentWeight * difficulty * 2) / 2;
}

export function getReplacementExercises(exerciseId) {
  return REPLACEMENTS[exerciseId] || ['Similar movement patterns', 'Bodyweight alternatives'];
}

export function prioritizeInterventions(interventions) {
  const priority = { high: 3, medium: 2, low: 1 };
  return interventions.sort((a, b) =>
    priority[b.priority] - priority[a.priority] || b.estimatedEffectiveness - a.estimatedEffectiveness
  );
}
