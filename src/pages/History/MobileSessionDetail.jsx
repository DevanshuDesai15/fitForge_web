import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Box, Typography } from '@mui/material';
import { MobileScreen } from '../../components/mobile';
import {
  formatDuration,
  getSetWeight,
  getWorkoutDate,
  getWorkoutFallbackUnit,
  getWorkoutSeconds,
  getWorkoutSetCount,
  getWorkoutVolume,
} from './historyActivity';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

// Read-only session view. The kit's in-place set correction needs update/delete mutations
// and PR recalculation, which are not built yet.
export default function MobileSessionDetail({ workout, weightUnit, onBack }) {
  const date = getWorkoutDate(workout);
  const fallbackUnit = getWorkoutFallbackUnit(workout);
  const volume = Math.round(getWorkoutVolume(workout, weightUnit)).toLocaleString();
  const subtitle = `${formatDuration(getWorkoutSeconds(workout))} · ${getWorkoutSetCount(workout)} sets · ${volume} ${weightUnit}`;

  return (
    <MobileScreen title={date ? format(date, 'MMM d, yyyy') : 'Workout'} subtitle={subtitle} backAction={onBack}>
      <Box sx={{ display: 'grid', gap: 1.75 }}>
        {(workout.exercises || []).map((exercise, ei) => (
          <Box key={ei} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 700 }}>{exercise.name || exercise.exerciseName}</Typography>
              <Typography sx={{ ...mono, color: 'text.secondary', fontSize: '0.85rem' }}>{(exercise.sets || []).length} sets</Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {(exercise.sets || []).map((set, si) => {
                const weight = getSetWeight(set, fallbackUnit, weightUnit);
                return (
                  <Box key={si} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 44, px: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'border.main', backgroundColor: '#2a2a2a' }}>
                    <Typography sx={{ ...mono, width: 46, color: 'text.secondary', fontSize: '0.85rem' }}>SET {si + 1}</Typography>
                    <Typography sx={{ ...mono, fontSize: '1.05rem', fontWeight: 700 }}>
                      {weight === null ? 'Bodyweight' : `${weight} ${weightUnit}`}
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> × {set.reps}</Box>
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            {exercise.notes ? (
              <Typography sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'border.main', color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {exercise.notes}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </MobileScreen>
  );
}

MobileSessionDetail.propTypes = {
  workout: PropTypes.shape({ exercises: PropTypes.array }).isRequired,
  weightUnit: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};
