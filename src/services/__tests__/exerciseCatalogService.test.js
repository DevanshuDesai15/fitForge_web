import { describe, expect, it } from 'vitest';
import { normalizeExerciseCatalogRow } from '../exerciseCatalogService';

describe('normalizeExerciseCatalogRow', () => {
  it('maps Supabase exercise rows into the Exercise Library shape', () => {
    const row = {
      id: 'uuid-1',
      slug: 'kettlebell-single-arm-row',
      name: 'Kettlebell Single Arm Row',
      description: 'Updated description',
      steps: ['Hinge', 'Row'],
      primary_muscle: 'Back',
      secondary_muscles: ['Rhomboids'],
      equipment_needed: ['Kettlebell'],
      exercise_types: ['Strength'],
      difficulty: 'Beginner',
      video_urls: { '720p': 'https://example.com/video.mp4' },
      pro_tips: ['Drive the elbow back'],
      common_mistakes: ['Twisting the torso'],
      variations: ['Single Arm Dumbbell Row'],
      safety_considerations: ['Brace your core'],
      tags: ['Beginner', 'Back'],
    };

    expect(normalizeExerciseCatalogRow(row)).toEqual({
      id: 'uuid-1',
      slug: 'kettlebell-single-arm-row',
      name: 'Kettlebell Single Arm Row',
      description: 'Updated description',
      steps: ['Hinge', 'Row'],
      primaryMuscle: 'Back',
      secondaryMuscles: ['Rhomboids'],
      equipmentNeeded: ['Kettlebell'],
      exerciseTypes: ['Strength'],
      difficulty: 'Beginner',
      videoUrls: { '720p': 'https://example.com/video.mp4' },
      proTips: ['Drive the elbow back'],
      commonMistakes: ['Twisting the torso'],
      variations: ['Single Arm Dumbbell Row'],
      safetyConsiderations: ['Brace your core'],
      tags: ['Beginner', 'Back'],
    });
  });
});
