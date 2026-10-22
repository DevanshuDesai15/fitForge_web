import { useMemo } from 'react';
import { Box, Button, ButtonBase, Card, Chip, IconButton, Typography } from '@mui/material';
import { ChevronRight, Dumbbell, Pause, Play, Timer, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useWorkoutMutations } from '../hooks/useWorkoutMutations';
import { useWorkoutState } from '../hooks/useWorkoutState';
import { MobileState } from '../../../components/mobile';
import {
  buildWorkoutStartState,
  estimateTemplateDuration,
  getPersistedTemplateId,
  getTotalExercises,
} from './workoutRecommendationEngine';

const outlineChipSx = {
  height: 26,
  borderColor: 'border.main',
  color: 'text.secondary',
  fontWeight: 700,
  '& .MuiChip-icon': { color: 'text.secondary' },
};

function flattenTemplatesToDayWorkouts(templates) {
  return templates.flatMap((template) => {
    if (template.workoutDays && template.workoutDays.length > 0) {
      return template.workoutDays.map((day, dayIndex) => ({
        id: `${template.id}-${day.id || dayIndex}`,
        title: `${template.name} - ${day.name}`,
        category: day.category || template.category || 'Strength Training',
        difficulty: day.difficulty || template.difficulty || 'Intermediate',
        durationMinutes: Math.ceil((day.exercises?.length || 0) * 8),
        exerciseCount: day.exercises?.length || 0,
        templateId: getPersistedTemplateId(day, template.id),
        program: { id: template.id, name: template.name },
        day: {
          id: day.templateId || day.id || getPersistedTemplateId(day, template.id) || `day-${dayIndex}`,
          templateId: day.templateId,
          name: day.name,
          exercises: day.exercises || [],
        },
      }));
    }

    return [{
      id: template.id,
      title: template.name,
      category: 'Single Day',
      difficulty: 'Intermediate',
      durationMinutes: null,
      durationLabel: estimateTemplateDuration(template),
      exerciseCount: getTotalExercises(template),
      templateId: template.id,
      program: { id: template.id, name: template.name },
      day: { id: template.id, name: template.name, exercises: template.exercises || [] },
    }];
  });
}

export default function MobileWorkoutsList() {
  const navigate = useNavigate();
  const { templates, loading, loadTemplates } = useWorkoutTemplates();
  const { deleteTemplate } = useWorkoutMutations();
  const { workoutStarted, exercises, currentTemplate, selectedDay, clearWorkoutState } = useWorkoutState();

  const dayWorkouts = useMemo(() => flattenTemplatesToDayWorkouts(templates), [templates]);

  const hasOngoingWorkout = workoutStarted && exercises.length > 0;
  const ongoingSetsLogged = hasOngoingWorkout
    ? exercises.reduce((total, exercise) => total + (exercise.sets?.filter((set) => set.completed).length || 0), 0)
    : 0;
  const ongoingName = selectedDay?.name || currentTemplate?.name || 'Workout';

  const handleStartDayWorkout = (workout) => {
    navigate('/workout/start', {
      state: buildWorkoutStartState(workout.program, workout.day),
    });
  };

  const handleDeleteWorkout = async (event, workout) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${workout.title}"? This action cannot be undone.`)) return;
    await deleteTemplate(workout.templateId);
    loadTemplates();
  };

  if (loading) {
    return <MobileState kind="loading" title="Loading workouts" />;
  }

  if (!hasOngoingWorkout && dayWorkouts.length === 0) {
    return (
      <MobileState
        kind="empty"
        title="No workouts yet"
        message="Create your first workout to see it here."
      />
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.25 }}>
      {hasOngoingWorkout ? (
        <Card
          sx={{
            p: 2,
            borderRadius: '18px',
            borderColor: 'rgba(221,237,0,0.22)',
            bgcolor: 'rgba(221,237,0,0.06)',
            backgroundImage: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Pause size={15} color="var(--mui-palette-primary-main, #dded00)" />
            <Typography sx={{ color: 'primary.main', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Unfinished session
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1 }}>{ongoingName}</Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>{ongoingSetsLogged} sets logged</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.75 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Play size={17} />}
              onClick={() => navigate('/workout/start')}
              sx={{ color: 'primary.contrastText', fontWeight: 800 }}
            >
              Resume
            </Button>
            <Button
              variant="outlined"
              startIcon={<X size={17} />}
              onClick={() => {
                if (window.confirm('Discard this unfinished session? Logged sets will be lost.')) {
                  clearWorkoutState();
                }
              }}
              sx={{ borderColor: 'border.main', color: 'text.secondary' }}
            >
              Discard
            </Button>
          </Box>
        </Card>
      ) : null}

      {dayWorkouts.map((workout) => (
        <Card key={workout.id} sx={{ bgcolor: 'background.paper', backgroundImage: 'none', borderRadius: '16px', display: 'flex', alignItems: 'flex-start' }}>
          <ButtonBase
            aria-label={`Start ${workout.title}`}
            onClick={() => handleStartDayWorkout(workout)}
            sx={{ display: 'block', flex: 1, minWidth: 0, textAlign: 'left', p: 1.75, pr: 1 }}
          >
            <Typography component="h3" sx={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.2 }}>
              {workout.title}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, my: 1 }}>
              <Chip label={workout.category} size="small" variant="outlined" sx={outlineChipSx} />
              <Chip label={workout.difficulty} size="small" variant="outlined" sx={outlineChipSx} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.85rem' }}>
                <Dumbbell size={14} />{workout.exerciseCount} exercises
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.85rem' }}>
                <Timer size={14} />{workout.durationLabel || `${workout.durationMinutes} min`}
              </Typography>
            </Box>
          </ButtonBase>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, p: 1.75, pl: 0 }}>
            <IconButton
              aria-label={`Delete ${workout.title}`}
              size="small"
              onClick={(event) => handleDeleteWorkout(event, workout)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <Trash2 size={16} />
            </IconButton>
            <ChevronRight size={19} color="var(--text-secondary)" aria-hidden="true" />
          </Box>
        </Card>
      ))}
    </Box>
  );
}
