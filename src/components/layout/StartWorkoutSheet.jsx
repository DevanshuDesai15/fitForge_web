import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dumbbell, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileStartSheet } from '../mobile';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useWorkoutTemplates } from '../../pages/Workout/hooks/useWorkoutTemplates';
import { useWorkoutState } from '../../pages/Workout/hooks/useWorkoutState';
import { buildWorkoutStartState, flattenTemplatesToDayWorkouts } from '../../pages/Workout/components/workoutRecommendationEngine';
import { buildFocusStartState, deriveHomeFocus } from '../../pages/Home/utils/homeFocus';

// Data side of the bottom bar's Start action. Mounted only while open, so nothing fetches until used.
export default function StartWorkoutSheet({ onClose }) {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const { workoutStarted, exercises, currentTemplate, selectedDay } = useWorkoutState();

  const dayWorkouts = useMemo(() => flattenTemplatesToDayWorkouts(templates || []), [templates]);
  const { mode, workout } = deriveHomeFocus({ nextWorkout: stats?.nextWorkout, lastRepeatableWorkout: stats?.lastRepeatableWorkout });

  const start = (state) => {
    onClose();
    navigate('/workout/start', state ? { state } : undefined);
  };

  const exerciseCount = workout?.exercises?.length || 0;
  const focus = workout ? {
    eyebrow: mode === 'repeat-last' ? 'Repeat last workout' : `${stats?.isTomorrowFocus ? 'Tomorrow' : 'Today'} · ${workout.programName}`,
    name: workout.name || 'Workout',
    detail: mode === 'program' ? workout.focus : undefined,
    chips: [
      { icon: Timer, label: `${exerciseCount * 5 + 10} min` },
      { icon: Dumbbell, label: `${exerciseCount} exercises` },
    ],
    onStart: () => start(buildFocusStartState(mode, workout)),
  } : null;

  const others = dayWorkouts
    .filter((item) => !(mode === 'program' && workout && (item.day.id === workout.id || item.templateId === workout.id)))
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: `${item.exerciseCount} exercises · ${item.durationMinutes ? `${item.durationMinutes} min` : item.durationLabel || ''}`.replace(/ · $/, ''),
      onStart: () => start(buildWorkoutStartState(item.program, item.day)),
    }));

  const hasOngoing = workoutStarted && exercises.length > 0;
  const ongoing = hasOngoing ? {
    name: selectedDay?.name || currentTemplate?.name || 'Workout',
    setsLogged: exercises.reduce((total, ex) => total + (ex.sets?.filter((set) => set.completed).length || 0), 0),
  } : null;

  return (
    <MobileStartSheet
      open
      onClose={onClose}
      focus={focus}
      ongoing={ongoing}
      others={others}
      loading={statsLoading || templatesLoading}
      onResume={() => start()}
      onEmpty={() => start()}
    />
  );
}

StartWorkoutSheet.propTypes = { onClose: PropTypes.func.isRequired };
