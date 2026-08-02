import { getMaxReps, getMaxWeight } from './progressionEngine';

export function calculateTotalVolume(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  return sets.reduce((total, set) => total + (set.weight || 0) * (set.reps || 0), 0);
}

export function getAverageWeight(sets) {
  if (!Array.isArray(sets) || sets.length === 0) return 0;
  return sets.reduce((sum, set) => sum + (set.weight || 0), 0) / sets.length;
}

export function checkWeightStagnation(metrics) {
  if (metrics.length < 3) return false;
  const weights = metrics.map((metric) => metric.maxWeight);
  return Math.max(...weights) - Math.min(...weights) < 1;
}

export function checkRepStagnation(metrics) {
  if (metrics.length < 3) return false;
  const reps = metrics.map((metric) => metric.maxReps);
  return Math.max(...reps) - Math.min(...reps) < 2;
}

export function checkVolumeStagnation(metrics) {
  if (metrics.length < 3) return false;
  const volumes = metrics.map((metric) => metric.totalVolume);
  const average = volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
  if (average === 0) return true;
  return (Math.max(...volumes) - Math.min(...volumes)) / average < 0.05;
}

export function analyzeSessionsForPlateau(sessions) {
  const sessionMetrics = sessions.map((session) => {
    const sets = session.sets || [];
    return {
      date: session.date,
      maxWeight: getMaxWeight(sets),
      maxReps: getMaxReps(sets),
      totalVolume: calculateTotalVolume(sets),
      averageWeight: getAverageWeight(sets),
      totalSets: sets.length,
    };
  });
  const weight = checkWeightStagnation(sessionMetrics);
  const reps = checkRepStagnation(sessionMetrics);
  const volume = checkVolumeStagnation(sessionMetrics);
  const stagnationCount = [weight, reps, volume].filter(Boolean).length;
  return {
    isPlateaued: stagnationCount >= 2,
    metrics: { weight, reps, volume, stagnationCount },
    sessionMetrics,
  };
}

export function calculatePlateauDuration(sessions) {
  let duration = 0;
  for (let index = 0; index < sessions.length - 1; index += 1) {
    if (getMaxWeight(sessions[index].sets || []) > getMaxWeight(sessions[index + 1].sets || [])) break;
    duration += 1;
  }
  return Math.max(duration, 3);
}

export function assessPlateauSeverity(duration, analysis) {
  if (duration >= 6 || analysis.metrics.stagnationCount === 3) return 'severe';
  if (duration >= 4 || (analysis.metrics.stagnationCount === 2 && duration >= 3)) return 'moderate';
  return 'mild';
}

export function classifyPlateauType(sessions) {
  const weight = checkWeightStagnation(sessions.map((session) => ({ maxWeight: getMaxWeight(session.sets || []) })));
  const reps = checkRepStagnation(sessions.map((session) => ({ maxReps: getMaxReps(session.sets || []) })));
  const volume = checkVolumeStagnation(sessions.map((session) => ({ totalVolume: calculateTotalVolume(session.sets || []) })));
  if (weight) return 'weight';
  if (volume) return 'volume';
  if (reps) return 'reps';
  return 'weight';
}

export function getCurrentPerformanceMetrics(session) {
  const sets = session.sets || [];
  return {
    weight: getMaxWeight(sets),
    reps: getMaxReps(sets),
    volume: calculateTotalVolume(sets),
    sets: sets.length,
  };
}

export function calculatePlateauConfidence(analysis, duration) {
  let confidence = 0.5 + analysis.metrics.stagnationCount * 0.15;
  if (duration >= 6) confidence += 0.2;
  else if (duration >= 4) confidence += 0.1;
  return Math.min(0.95, confidence);
}
