const SUBSTITUTION_MAP = {
  'bench-press': ['incline-bench-press', 'dumbbell-press', 'push-ups', 'chest-fly'],
  squat: ['leg-press', 'goblet-squat', 'lunges', 'bulgarian-split-squat'],
  deadlift: ['romanian-deadlift', 'sumo-deadlift', 'trap-bar-deadlift', 'hip-thrust'],
  'shoulder-press': [
    'dumbbell-shoulder-press',
    'arnold-press',
    'pike-push-ups',
    'lateral-raises',
  ],
  'pull-up': ['lat-pulldown', 'assisted-pull-ups', 'inverted-rows', 'cable-rows'],
  'bicep-curls': ['hammer-curls', 'preacher-curls', 'cable-curls', 'chin-ups'],
  'tricep-extensions': [
    'close-grip-bench-press',
    'dips',
    'overhead-tricep-press',
    'diamond-push-ups',
  ],
};

const WEIGHT_CONVERSION_FACTORS = {
  'dumbbell-press': 0.4,
  'incline-bench-press': 0.85,
  'push-ups': 0,
  'leg-press': 1.5,
  'goblet-squat': 0.3,
  lunges: 0.6,
  'romanian-deadlift': 0.8,
  'sumo-deadlift': 1,
  'dumbbell-shoulder-press': 0.35,
  'lat-pulldown': 0.9,
  'hammer-curls': 0.8,
  'close-grip-bench-press': 0.9,
  dips: 0,
};

const HIGH_QUALITY_SUBSTITUTIONS = [
  'incline-bench-press',
  'dumbbell-press',
  'sumo-deadlift',
  'romanian-deadlift',
  'dumbbell-shoulder-press',
  'hammer-curls',
];

const BENEFITS = {
  'incline-bench-press': ['Upper chest focus', 'Shoulder-friendly angle', 'Strength variation'],
  'dumbbell-press': ['Unilateral training', 'Greater range of motion', 'Stabilizer activation'],
  'push-ups': ['Bodyweight convenience', 'Core engagement', 'Functional movement'],
  'leg-press': ['Reduced spinal load', 'Isolated leg strength', 'Safer for beginners'],
  'goblet-squat': ['Improved mobility', 'Core activation', 'Beginner-friendly'],
  'romanian-deadlift': ['Hamstring focus', 'Hip hinge pattern', 'Posterior chain'],
  'lat-pulldown': ['Controlled resistance', 'Beginner-friendly', 'Adjustable weight'],
  'hammer-curls': ['Forearm strength', 'Neutral grip', 'Reduced wrist stress'],
};

const DIFFICULTIES = {
  'push-ups': 'Beginner',
  'goblet-squat': 'Beginner',
  'lat-pulldown': 'Beginner',
  'dumbbell-press': 'Intermediate',
  'incline-bench-press': 'Intermediate',
  'romanian-deadlift': 'Intermediate',
  'pull-ups': 'Advanced',
  dips: 'Advanced',
};

const EQUIPMENT = {
  'push-ups': 'Bodyweight',
  'pull-ups': 'Pull-up bar',
  dips: 'Dip bars',
  'goblet-squat': 'Dumbbell',
  'dumbbell-press': 'Dumbbells',
  'hammer-curls': 'Dumbbells',
  'lat-pulldown': 'Cable machine',
  'leg-press': 'Leg press machine',
  'incline-bench-press': 'Barbell + Incline bench',
  'romanian-deadlift': 'Barbell',
};

export function calculateSubstitutionWeight(originalAnalysis, alternativeExercise) {
  const factor = WEIGHT_CONVERSION_FACTORS[alternativeExercise] || 0.8;
  return Math.round(originalAnalysis.currentWeight * factor);
}

export function calculateSubstitutionConfidence(originalAnalysis, alternativeExercise) {
  const baseConfidence = originalAnalysis.confidenceLevel * 0.8;
  return HIGH_QUALITY_SUBSTITUTIONS.includes(alternativeExercise)
    ? Math.min(baseConfidence + 0.1, 0.95)
    : baseConfidence;
}

export function getSubstitutionReason(reason, alternative) {
  const name = alternative.replace('-', ' ');
  switch (reason) {
    case 'plateau':
      return `Break through plateau with ${name} - different angle/grip`;
    case 'equipment':
      return `Equipment alternative: ${name} targets same muscles`;
    case 'preference':
      return `User preference: ${name} for variety`;
    case 'injury':
      return `Injury-friendly alternative: ${name} with reduced stress`;
    default:
      return `Alternative exercise: ${name}`;
  }
}

export function getSubstitutionBenefits(alternative) {
  return BENEFITS[alternative] || ['Muscle variation', 'Movement diversity', 'Progression option'];
}

export function getExerciseDifficulty(exercise) {
  return DIFFICULTIES[exercise] || 'Intermediate';
}

export function getExerciseEquipment(exercise) {
  return EQUIPMENT[exercise] || 'Standard gym equipment';
}

export function generateExerciseSubstitutions(originalAnalysis, reason) {
  const alternatives = SUBSTITUTION_MAP[originalAnalysis.exerciseId.toLowerCase()] || [];

  return alternatives
    .slice(0, 3)
    .map((alternative) => ({
      exerciseId: alternative,
      exerciseName: alternative.replace('-', ' '),
      originalExercise: originalAnalysis.exerciseId,
      originalExerciseName: originalAnalysis.exerciseName,
      reason: getSubstitutionReason(reason, alternative),
      suggestedWeight: calculateSubstitutionWeight(originalAnalysis, alternative),
      suggestedReps: originalAnalysis.currentReps,
      suggestedSets: originalAnalysis.currentSets,
      confidenceLevel: calculateSubstitutionConfidence(originalAnalysis, alternative),
      benefits: getSubstitutionBenefits(alternative),
      difficulty: getExerciseDifficulty(alternative),
      equipment: getExerciseEquipment(alternative),
    }))
    .sort((a, b) => b.confidenceLevel - a.confidenceLevel);
}
