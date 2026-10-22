import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useUnits } from '../../contexts/UnitsContext';
import { useWorkoutMutations } from '../Workout/hooks/useWorkoutMutations';
import { findFallenRecord, getWorkoutFallbackUnit, getWorkoutVolumeKg } from './historyActivity';
import ExerciseHistory from './ExerciseHistory';
import MobileHistory from './MobileHistory';
import MobileSessionDetail from './MobileSessionDetail';

function MobileHistoryContainer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { weightUnit } = useUnits();
  const { data, isLoading, error, refetch } = useWorkouts();
  const { updateWorkout, deleteWorkout } = useWorkoutMutations();
  const workouts = data || [];

  const sessionId = searchParams.get('session');
  const session = sessionId ? workouts.find((w) => String(w.id) === sessionId) : null;
  if (session) {
    const fallbackUnit = getWorkoutFallbackUnit(session);
    return (
      <MobileSessionDetail
        workout={session}
        weightUnit={weightUnit}
        onBack={() => setSearchParams({})}
        onSave={async (exercises) => {
          const fallenRecord = findFallenRecord(workouts, session.id, exercises, weightUnit);
          await updateWorkout(session.id, { exercises, totalVolumeKg: getWorkoutVolumeKg(exercises, fallbackUnit) });
          return { fallenRecord };
        }}
        onDelete={() => deleteWorkout(session.id)}
      />
    );
  }

  return (
    <MobileHistory
      data={{ workouts, weightUnit }}
      state={{ loading: isLoading, error }}
      actions={{
        onRetry: refetch,
        onOpenSession: (id) => setSearchParams({ session: String(id) }),
        onStartWorkout: () => navigate('/workout/start'),
      }}
    />
  );
}

export default function HistoryPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  return isDesktop ? <ExerciseHistory /> : <MobileHistoryContainer />;
}
