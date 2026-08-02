import { listWorkouts } from '../../../services/workoutRepository';
import { buildStarterWorkoutRecommendations } from './starterWorkoutRecommendations';

export async function loadCompletedWorkouts({ supabase, userId, readWorkouts }) {
  if (!userId) return [];
  const options = { completed: true, limit: 50 };
  return readWorkouts
    ? readWorkouts(options)
    : listWorkouts({ supabase, userId, ...options });
}

export function getPersistedTemplateId(day, fallbackTemplateId) {
  return day?.templateId || day?.id || fallbackTemplateId || null;
}

export function buildWorkoutStartState(program, day) {
  const templateId = day?.templateId || day?.id || null;
  return {
    templateId,
    dayId: templateId,
    workout: {
      name: `${program?.name || 'Program'} - ${day?.name || 'Workout'}`,
      programName: program?.name || 'Program',
      dayName: day?.name || 'Workout',
      exercises: day?.exercises || [],
    },
  };
}

export function findNextDayInProgram(program, completedWorkouts) {
  const days = Array.isArray(program?.days) ? [...program.days] : [];
  if (days.length <= 1) return null;
  const completedTemplateIds = new Set(completedWorkouts.map((workout) => workout.templateId).filter(Boolean));
  const completedDayNames = new Set(completedWorkouts.map((workout) => workout.dayName).filter(Boolean));
  for (const day of days) {
    const templateId = day?.templateId || day?.id || null;
    if (templateId && !completedTemplateIds.has(templateId)) return day;
    if (!templateId && day?.name && !completedDayNames.has(day.name)) return day;
  }
  return days[0] || null;
}

export function getTemplateCategory(day) {
  if (!day.muscleGroups || day.muscleGroups.length === 0) return 'General';
  const names = day.muscleGroups.map((group) => group.name.toLowerCase());
  if (names.some((name) => ['chest', 'back', 'shoulders'].includes(name))) return 'Upper Body';
  if (names.some((name) => ['legs', 'glutes'].includes(name))) return 'Lower Body';
  if (names.includes('cardio')) return 'Cardio';
  return 'Strength Training';
}

export function estimateDuration(day) {
  return `${(day.exercises?.length || 0) * 5 + 10} min`;
}

export function estimateTemplateDuration(template) {
  if (!template.workoutDays || template.workoutDays.length === 0) return '30 min';
  const total = template.workoutDays.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
  return `${Math.round((total / template.workoutDays.length) * 5 + 10)} min`;
}

export function getTotalExercises(template) {
  if (!template.workoutDays || template.workoutDays.length === 0) return 0;
  const total = template.workoutDays.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
  return Math.round(total / template.workoutDays.length);
}

export function calculateWorkoutRecommendations(userPrograms, completedWorkouts, userTemplates = []) {
  const recommendations = [];
  for (const program of userPrograms) {
    if (!program.days || program.days.length <= 1) continue;
    const nextDay = findNextDayInProgram(program, completedWorkouts);
    if (!nextDay) continue;
    recommendations.push({
      id: `program-${program.id}-${nextDay.id}`,
      title: `${program.name} - ${nextDay.name}`,
      category: getTemplateCategory(nextDay),
      duration: estimateDuration(nextDay),
      exercises: nextDay.exercises?.length || 0,
      difficulty: nextDay.difficulty || program.difficulty || 'Intermediate',
      progress: 0,
      isAIPick: false,
      templateId: getPersistedTemplateId(nextDay, program.id),
      dayId: nextDay.id || getPersistedTemplateId(nextDay, program.id),
      dayData: nextDay,
      programId: program.id,
      programName: program.name,
      type: 'nextDay',
    });
  }
  const defaults = recommendations.length > 0
    ? recommendations.slice(0, 3)
    : buildStarterWorkoutRecommendations();
  return defaults.map((recommendation) => {
    if (recommendation.type !== 'starter' && !recommendation.isAIPick) return recommendation;
    const matching = userTemplates.find((template) => template.name.toLowerCase() === recommendation.title.toLowerCase());
    if (!matching) return recommendation;
    return {
      ...recommendation,
      id: matching.id,
      duration: estimateTemplateDuration(matching) || recommendation.duration,
      exercises: getTotalExercises(matching) || recommendation.exercises,
      difficulty: matching.difficulty || recommendation.difficulty,
      dayData: {
        ...recommendation.dayData,
        id: matching.id,
        templateId: matching.id,
        exercises: matching.workoutDays?.[0]?.exercises || matching.exercises || [],
      },
    };
  });
}
