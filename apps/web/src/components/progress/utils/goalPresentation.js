import { format } from 'date-fns';

export function createEmptyGoal(weightUnit) {
  return {
    title: '',
    category: 'exercise',
    type: 'personal_record',
    targetValue: '',
    unit: weightUnit,
    description: '',
    exerciseName: '',
    priority: 'medium',
    deadline: '',
  };
}

export function buildGoalPayload(goal, editingGoal) {
  return {
    title: goal.title,
    exerciseName: goal.exerciseName || goal.title,
    targetValue: goal.targetValue,
    currentValue: editingGoal?.currentValue ?? editingGoal?.current_value ?? 0,
    unit: goal.unit,
    category: goal.category,
    type: goal.type,
    description: goal.description,
    priority: goal.priority,
    deadline: goal.deadline,
    completed: editingGoal?.completed ?? false,
    targetWeight: ['lbs', 'kg'].includes(goal.unit) ? goal.targetValue : '',
    targetReps: '',
    targetSets: '',
  };
}

export function summarizeGoals(goals, exercises, calculateProgress) {
  const activeGoals = goals.filter((goal) => !goal.completed);
  const completedGoals = goals.filter((goal) => goal.completed);
  const goalsWithDeadlines = goals.filter((goal) => goal.deadline);
  const almostDone = activeGoals.filter((goal) => {
    const progress = calculateProgress(goal, exercises);
    return progress >= 70 && progress < 100;
  });
  return {
    activeGoals,
    completedGoals,
    goalsWithDeadlines,
    almostDone,
    completedPct: goals.length > 0
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0,
  };
}

export function isGoalOverdue(goal, now = new Date()) {
  if (!goal.deadline || goal.completed) return false;
  return new Date(goal.deadline) < now;
}

export function describeGoal(goal, weightUnit) {
  if (goal.description) return goal.description;
  const parts = [];
  if (goal.targetValue) parts.push(`${goal.targetValue} ${goal.unit || ''} target`.trim());
  else if (goal.targetWeight) parts.push(`${goal.targetWeight}${weightUnit} target weight`);
  if (goal.targetReps) parts.push(`${goal.targetReps} reps`);
  if (goal.targetSets) parts.push(`${goal.targetSets} sets`);
  if (goal.deadline) parts.push(`by ${format(new Date(goal.deadline), 'MMM d, yyyy')}`);
  return parts.length > 0 ? parts.join(' · ') : 'No specific target set';
}

export function getPriorityStyle(priority) {
  switch (priority) {
    case 'high':
      return { bg: 'rgba(244, 67, 54, 0.15)', text: '#f44336' };
    case 'low':
      return { bg: 'rgba(76, 175, 80, 0.15)', text: '#4caf50' };
    default:
      return { bg: 'rgba(255, 193, 7, 0.15)', text: '#ffc107' };
  }
}
