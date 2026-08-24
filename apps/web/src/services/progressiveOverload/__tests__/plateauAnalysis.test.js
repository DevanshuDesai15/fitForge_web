import { describe, expect, it } from 'vitest';
import {
  analyzeSessionsForPlateau,
  assessPlateauSeverity,
  calculatePlateauDuration,
  classifyPlateauType,
  getCurrentPerformanceMetrics,
} from '../plateauAnalysis';

describe('plateau analysis', () => {
  const stagnantSessions = [
    { date: '2026-03-15', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] },
    { date: '2026-03-08', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] },
    { date: '2026-03-01', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] },
  ];

  it('detects stagnation across weight, reps, and volume', () => {
    const result = analyzeSessionsForPlateau(stagnantSessions);
    expect(result).toEqual(expect.objectContaining({
      isPlateaued: true,
      metrics: { weight: true, reps: true, volume: true, stagnationCount: 3 },
    }));
  });

  it('classifies duration, severity, type, and current metrics', () => {
    const analysis = analyzeSessionsForPlateau(stagnantSessions);
    expect(calculatePlateauDuration(stagnantSessions)).toBe(3);
    expect(assessPlateauSeverity(3, analysis)).toBe('severe');
    expect(classifyPlateauType(stagnantSessions)).toBe('weight');
    expect(getCurrentPerformanceMetrics(stagnantSessions[0])).toEqual({
      weight: 100, reps: 5, volume: 1000, sets: 2,
    });
  });
});
