import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { CalendarDays, CalendarRange, ChevronRight, Dumbbell, History as HistoryIcon, Timer } from 'lucide-react';
import { Box, Button, ButtonBase, Chip, IconButton, Typography } from '@mui/material';
import { MobileHeatmap, MobileHeroStat, MobileScreen, MobileState } from '../../components/mobile';
import { flattenExercisesFromWorkouts } from '../../utils/workoutExerciseHistory';
import {
  buildActivity,
  formatDuration,
  getExerciseStats,
  getSetWeight,
  getWorkoutDate,
  getWorkoutFallbackUnit,
  getWorkoutSeconds,
  summarizeExercise,
} from './historyActivity';

const PAGE_SIZE = 20;
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const cardSx = { borderRadius: '16px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' };

const TABS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarRange },
  { id: 'past', label: 'Past', Icon: HistoryIcon },
  { id: 'exercises', label: 'Exercises', Icon: Dumbbell },
];

function IconTabs({ value, onChange }) {
  return (
    <Box role="tablist" aria-label="History sections" sx={{ ...cardSx, display: 'flex', overflow: 'hidden', mb: 3 }}>
      {TABS.map(({ id, label, Icon }) => {
        const on = id === value;
        return (
          <ButtonBase
            key={id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            sx={{
              flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'column', gap: 0.75, pt: 1.5, pb: 1.25,
              color: on ? 'primary.main' : 'text.secondary',
              borderBottom: '2px solid', borderColor: on ? 'primary.main' : 'transparent',
              fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
            }}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

function StreakStrip({ activity }) {
  const items = [
    { value: activity.currentStreak, label: 'Week streak' },
    { value: activity.longestStreak, label: 'Longest' },
    { value: activity.monthCount, label: `${activity.monthLabel} workouts` },
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, py: 1.75, px: 1, mb: 2, borderRadius: '16px', backgroundColor: '#2a2a2a' }}>
      {items.map((item) => (
        <Box key={item.label} sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '2rem', lineHeight: 1 }}>{item.value}</Typography>
          <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: '0.68rem' }}>{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function DayDetail({ day }) {
  if (!day) {
    return <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', textAlign: 'center', pt: 2.25 }}>Tap a day to see that session</Typography>;
  }
  return (
    <Box sx={{ mt: 2, p: 1.75, borderRadius: '16px', backgroundColor: '#2a2a2a' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.25, mb: day.count ? 1.5 : 0 }}>
        <Typography sx={{ color: 'primary.main', fontSize: '1.1rem', fontWeight: 500 }}>{day.label}</Typography>
        {day.count
          ? <Chip size="small" icon={<Timer size={14} />} label={day.duration} sx={{ color: 'primary.main', backgroundColor: 'rgba(221,237,0,0.1)', '& .MuiChip-icon': { color: 'primary.main' } }} />
          : <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Rest day</Typography>}
      </Box>
      {day.count ? (
        <>
          <Typography sx={{ fontSize: '1.25rem' }}>{day.name}</Typography>
          <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.9rem' }}>{day.focus}</Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
            {[
              { value: day.exercises, label: 'exercises' },
              { value: day.volume, label: 'volume' },
              { value: day.count, label: day.count > 1 ? 'sessions' : 'session' },
            ].map((stat) => (
              <Box key={stat.label}>
                <Typography sx={{ ...mono, fontSize: '1rem' }}>{stat.value}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{stat.label}</Typography>
              </Box>
            ))}
          </Box>
        </>
      ) : null}
    </Box>
  );
}

function CalendarTab({ activity }) {
  const [selected, setSelected] = useState(null);
  return (
    <Box>
      <StreakStrip activity={activity} />
      <MobileHeatmap
        values={activity.values}
        months={activity.months}
        year={activity.year}
        todayIndex={activity.todayIndex}
        selectedIndex={selected ?? undefined}
        onSelectDay={setSelected}
        dayLabel={(i) => activity.days[i].label}
        caption={`${activity.totalWorkouts} workout${activity.totalWorkouts === 1 ? '' : 's'} in ${activity.workoutDays} days`}
      />
      <DayDetail day={selected === null ? null : activity.days[selected]} />
    </Box>
  );
}

const ShowMore = ({ shown, total, onClick }) => (shown < total ? (
  <Button fullWidth variant="text" onClick={onClick} sx={{ mt: 2 }}>Show more</Button>
) : null);

function PastTab({ workouts, weightUnit, onOpenSession }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  return (
    <Box>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {workouts.slice(0, visible).map((workout) => {
          const date = getWorkoutDate(workout);
          const dateLabel = date ? format(date, 'MMM d, yyyy') : 'Workout';
          const fallbackUnit = getWorkoutFallbackUnit(workout);
          return (
            <Box key={workout.id} sx={{ ...cardSx, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.25, pb: 1.75, mb: 1.75, borderBottom: '1px solid', borderColor: 'border.main' }}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: '1.15rem', fontWeight: 500 }}>
                  <CalendarDays size={18} aria-hidden="true" />{dateLabel}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip size="small" icon={<Timer size={14} />} label={formatDuration(getWorkoutSeconds(workout))} sx={{ color: 'primary.main', backgroundColor: 'rgba(221,237,0,0.1)', '& .MuiChip-icon': { color: 'primary.main' } }} />
                  <IconButton size="small" aria-label={`View ${dateLabel}`} onClick={() => onOpenSession(workout.id)} sx={{ width: 36, height: 36 }}>
                    <ChevronRight size={18} />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {(workout.exercises || []).map((exercise, i) => (
                  <Box key={i}>
                    <Typography sx={{ fontSize: '1.05rem' }}>{exercise.name || exercise.exerciseName}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{(exercise.sets || []).length} sets completed</Typography>
                    <Box sx={{ ml: 2, mt: 0.5 }}>
                      {(exercise.sets || []).map((set, j) => {
                        const weight = getSetWeight(set, fallbackUnit, weightUnit);
                        return (
                          <Typography key={j} sx={{ ...mono, color: 'text.secondary', fontSize: '0.85rem' }}>
                            Set {j + 1}: {set.reps} reps{weight === null ? ' (Bodyweight)' : ` @ ${weight}${weightUnit}`}
                          </Typography>
                        );
                      })}
                    </Box>
                    {exercise.notes ? (
                      <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.95rem', fontStyle: 'italic' }}>Note: {exercise.notes}</Typography>
                    ) : null}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      <ShowMore shown={visible} total={workouts.length} onClick={() => setVisible((n) => n + PAGE_SIZE)} />
    </Box>
  );
}

function ExercisesTab({ workouts, weightUnit }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const stats = useMemo(() => getExerciseStats(workouts, weightUnit), [workouts, weightUnit]);
  const exercises = useMemo(() => flattenExercisesFromWorkouts(workouts), [workouts]);
  const totalWeight = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(stats.totalWeight);
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <MobileHeroStat
          value={stats.totalExercises}
          caption="Exercises logged, all time"
          stats={[
            { value: stats.uniqueExercises, label: 'unique exercises' },
            { value: `${totalWeight} ${weightUnit}`, label: 'total weight' },
            { value: stats.totalReps.toLocaleString(), label: 'total reps' },
          ]}
        />
      </Box>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {exercises.slice(0, visible).map((exercise) => {
          const date = exercise.timestamp ? new Date(exercise.timestamp) : null;
          return (
            <Box key={exercise.id} sx={{ ...cardSx, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
                <Typography sx={{ color: 'primary.main', fontSize: '1.15rem', fontWeight: 500 }}>{exercise.exerciseName}</Typography>
                {date && !Number.isNaN(date.getTime())
                  ? <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{format(date, 'MMM d, yyyy')}</Typography>
                  : null}
              </Box>
              <Typography sx={{ ...mono, fontSize: '1.05rem' }}>{summarizeExercise(exercise, weightUnit)}</Typography>
              {exercise.notes ? (
                <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.95rem', fontStyle: 'italic' }}>Note: {exercise.notes}</Typography>
              ) : null}
            </Box>
          );
        })}
      </Box>
      <ShowMore shown={visible} total={exercises.length} onClick={() => setVisible((n) => n + PAGE_SIZE)} />
    </Box>
  );
}

export default function MobileHistory({ data, state, actions }) {
  const { workouts, weightUnit } = data;
  const [tab, setTab] = useState('calendar');
  const activity = useMemo(() => buildActivity(workouts, weightUnit), [workouts, weightUnit]);

  if (state.error) {
    return (
      <MobileScreen title="Workout History">
        <MobileState kind="failure" title="Could not load your history" message={String(state.error.message || state.error)} onRetry={actions.onRetry} />
      </MobileScreen>
    );
  }
  if (state.loading) {
    return (
      <MobileScreen title="Workout History">
        <MobileState kind="loading" title="Loading your history" />
      </MobileScreen>
    );
  }
  if (!workouts.length) {
    // Same heat map as the loaded screen, just at zero, so the shape of the app is visible on day one.
    return (
      <MobileScreen title="History" subtitle="Every session you have logged">
        <Box sx={{ mb: 3 }}>
          <MobileHeatmap
            values={activity.values}
            months={activity.months}
            year={activity.year}
            todayIndex={activity.todayIndex}
            onSelectDay={() => {}}
            dayLabel={(i) => activity.days[i].label}
            caption="No sessions yet"
          />
        </Box>
        <MobileState kind="empty" title="Nothing to look back on yet." message="Your first session lights the first dot. After three, the calendar starts showing your pattern — and the AI starts making suggestions worth reading." />
        <Button fullWidth variant="contained" onClick={actions.onStartWorkout} sx={{ mt: 2 }}>Start a workout</Button>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen title="Workout History">
      <IconTabs value={tab} onChange={setTab} />
      <Box sx={{ ...cardSx, p: 2 }}>
        {tab === 'calendar' ? <CalendarTab activity={activity} />
          : tab === 'past' ? <PastTab workouts={workouts} weightUnit={weightUnit} onOpenSession={actions.onOpenSession} />
            : <ExercisesTab workouts={workouts} weightUnit={weightUnit} />}
      </Box>
    </MobileScreen>
  );
}

MobileHistory.propTypes = {
  data: PropTypes.shape({ workouts: PropTypes.array.isRequired, weightUnit: PropTypes.string.isRequired }).isRequired,
  state: PropTypes.shape({ loading: PropTypes.bool, error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]) }).isRequired,
  actions: PropTypes.shape({
    onRetry: PropTypes.func,
    onOpenSession: PropTypes.func.isRequired,
    onStartWorkout: PropTypes.func,
  }).isRequired,
};
