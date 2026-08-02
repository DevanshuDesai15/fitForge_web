export function getMaxWeight(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  return Math.max(...sets.map((set) => set.weight || 0));
}

export function getMaxReps(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  return Math.max(...sets.map((set) => set.reps || 0));
}

export function calculateProgressionTrend(sessions) {
  if (sessions.length < 2) return 'maintaining';
  const weights = sessions.slice(0, 3).map((session) => getMaxWeight(session.sets || []));
  if (weights[0] > weights[weights.length - 1]) return 'improving';
  if (weights[0] < weights[weights.length - 1]) return 'declining';
  return 'maintaining';
}

export function calculateProgressionRate(sessions) {
  if (sessions.length < 2) return 0;
  const first = sessions[sessions.length - 1];
  const last = sessions[0];
  const difference = getMaxWeight(last.sets || []) - getMaxWeight(first.sets || []);
  const weeks = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24 * 7);
  return weeks > 0 ? difference / weeks : 0;
}

export function findLastProgressDate(sessions) {
  if (sessions.length < 2) return null;
  for (let index = 0; index < sessions.length - 1; index += 1) {
    if (getMaxWeight(sessions[index].sets || []) > getMaxWeight(sessions[index + 1].sets || [])) {
      return new Date(sessions[index].date);
    }
  }
  return null;
}

export function calculateConfidenceLevel(sessions) {
  if (sessions.length === 0) return 0;
  if (sessions.length < 3) return 0.3;
  if (sessions.length < 5) return 0.6;
  return Math.min(0.95, 0.6 + (sessions.length - 5) * 0.05);
}

export function calculateProgressionAnalysis(exerciseId, sessions) {
  if (sessions.length === 0) {
    return {
      exerciseId,
      exerciseName: exerciseId ? exerciseId.replace('-', ' ') : 'Unknown Exercise',
      currentWeight: 0,
      currentReps: 0,
      currentSets: 0,
      progressionTrend: 'maintaining',
      progressionRate: 0,
      confidenceLevel: 0,
      lastProgressDate: null,
      totalSessions: 0,
    };
  }
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest = sessions[0];
  return {
    exerciseId,
    exerciseName: exerciseId ? exerciseId.replace('-', ' ') : 'Unknown Exercise',
    currentWeight: getMaxWeight(latest.sets || []),
    currentReps: getMaxReps(latest.sets || []),
    currentSets: Array.isArray(latest.sets) ? latest.sets.length : 0,
    progressionTrend: calculateProgressionTrend(sessions),
    progressionRate: calculateProgressionRate(sessions),
    confidenceLevel: calculateConfidenceLevel(sessions),
    lastProgressDate: findLastProgressDate(sessions),
    totalSessions: sessions.length,
  };
}

export function generateAlternativeOptions(analysis, baseIncrease) {
  const options = [
    { weight: analysis.currentWeight + baseIncrease * 0.5, reps: analysis.currentReps, reasoning: 'Conservative progression - smaller weight increase' },
    { weight: analysis.currentWeight, reps: Math.min(analysis.currentReps + 2, 15), reasoning: 'Rep progression - increase volume before weight' },
  ];
  if (analysis.confidenceLevel > 0.8) {
    options.push({
      weight: analysis.currentWeight + baseIncrease * 1.5,
      reps: Math.max(analysis.currentReps - 1, 5),
      reasoning: 'Aggressive progression - larger weight increase with fewer reps',
    });
  }
  return options;
}

export function generateProgressionSuggestion(analysis, config, compoundExercises) {
  const isCompound = compoundExercises.includes(analysis.exerciseId);
  const baseIncrease = isCompound ? config.compoundWeightIncrease : config.isolationWeightIncrease;
  let suggestedWeight = analysis.currentWeight;
  let suggestedReps = analysis.currentReps;
  const suggestedSets = analysis.currentSets;
  let progressionType = 'weight';
  let reasoning = '';
  if (analysis.progressionTrend === 'improving' && analysis.confidenceLevel > config.confidenceThreshold) {
    suggestedWeight += baseIncrease;
    reasoning = `Progressive overload: increase weight by ${baseIncrease}kg based on recent improvements`;
  } else if (analysis.progressionTrend === 'maintaining') {
    if (analysis.currentReps < (isCompound ? 8 : 12)) {
      suggestedReps = Math.min(analysis.currentReps + 2, isCompound ? 10 : 15);
      progressionType = 'reps';
      reasoning = `Increase reps to ${suggestedReps} before adding weight`;
    } else {
      suggestedWeight += baseIncrease;
      suggestedReps = isCompound ? 6 : 8;
      reasoning = `Ready for weight progression: increase to ${suggestedWeight}kg`;
    }
  } else {
    suggestedWeight = Math.max(analysis.currentWeight * (1 - config.deloadPercentage), baseIncrease);
    progressionType = 'deload';
    reasoning = `Deload recommended: reduce weight by ${Math.round(config.deloadPercentage * 100)}% to break plateau`;
  }
  return {
    exerciseId: analysis.exerciseId,
    exerciseName: analysis.exerciseName,
    currentWeight: analysis.currentWeight,
    suggestedWeight,
    suggestedReps,
    suggestedSets,
    progressionType,
    reasoning,
    confidenceLevel: analysis.confidenceLevel,
    alternativeOptions: generateAlternativeOptions(analysis, baseIncrease),
  };
}
