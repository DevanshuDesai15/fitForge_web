import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Brain, LineChart, Target, Trophy } from 'lucide-react';
import { Box, ButtonBase } from '@mui/material';
import { MobileScreen, MobileState } from '../mobile';
import GoalsSection from './components/GoalsSection';
import AchievementsSection from './components/AchievementsSection';
import MobileAIDashboard from './mobile/MobileAIDashboard';
import MobileProgressOverview from './mobile/MobileProgressOverview';
import { buildOverview } from './utils/progressOverview';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: LineChart },
  { id: 'goals', label: 'Goals', Icon: Target },
  { id: 'achievements', label: 'Achievements', Icon: Trophy },
  { id: 'ai', label: 'AI Dashboard', Icon: Brain },
];

// Mobile Kit shell: title, icon-only segmented tabs, one glowing card. Goals and Achievements keep
// their existing sections (already single-column cards that match the kit); Overview and the AI
// Dashboard are the mobile-specific layouts.
export default function MobileProgress({ data, state, actions }) {
  const [tab, setTab] = useState('overview');
  const { exercises, personalRecords, weightUnit } = data;
  const overview = useMemo(() => buildOverview(exercises, personalRecords), [exercises, personalRecords]);

  return (
    <MobileScreen title="Progress & Goals" subtitle="Track your fitness journey, achievements, and goals">
      <Box
        role="tablist"
        aria-label="Progress sections"
        sx={{ display: 'flex', gap: 0.5, p: '5px', mb: 3, borderRadius: '50px', backgroundColor: '#1e1e1e' }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const on = id === tab;
          return (
            <ButtonBase
              key={id}
              role="tab"
              aria-selected={on}
              aria-label={label}
              onClick={() => setTab(id)}
              sx={{ flex: 1, minWidth: 0, minHeight: 40, borderRadius: '50px', color: on ? '#fff' : 'rgba(255,255,255,0.45)', backgroundColor: on ? '#2e2e2e' : 'transparent' }}
            >
              <Icon size={18} aria-hidden="true" />
            </ButtonBase>
          );
        })}
      </Box>

      <Box sx={{ p: 2, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.16)', backgroundColor: 'background.paper', boxShadow: '0 4px 30px rgba(221,237,0,0.1)' }}>
        {state.error ? (
          <MobileState kind="failure" title="Could not load your progress" message={String(state.error)} onRetry={actions.onRetry} />
        ) : state.loading ? (
          <MobileState kind="loading" title="Loading your progress" />
        ) : tab === 'overview' ? (
          <MobileProgressOverview overview={overview} weightUnit={weightUnit} />
        ) : tab === 'goals' ? (
          <GoalsSection
            goals={data.goals}
            exercises={exercises}
            availableExercises={data.availableExercises}
            weightUnit={weightUnit}
            onGoalsUpdate={actions.onGoalsUpdate}
            setError={actions.setError}
          />
        ) : tab === 'achievements' ? (
          <AchievementsSection
            personalRecords={personalRecords}
            progressionAnalyses={data.progressionAnalyses}
            showOnlyRecent={data.showOnlyRecent}
            setShowOnlyRecent={actions.setShowOnlyRecent}
            weightUnit={weightUnit}
          />
        ) : (
          <MobileAIDashboard
            progressionAnalyses={data.progressionAnalyses}
            plateauAlerts={data.plateauAlerts}
            appliedInterventions={data.appliedInterventions}
            dismissedAlerts={data.dismissedAlerts}
            onInterventionApply={actions.onInterventionApply}
            onAlertDismiss={actions.onAlertDismiss}
            progressData={data.progressData}
            selectedExercise={data.selectedExercise}
            setSelectedExercise={actions.setSelectedExercise}
            timeRange={data.timeRange}
            setTimeRange={actions.setTimeRange}
            exercises={exercises}
            personalRecords={personalRecords}
            weightUnit={weightUnit}
          />
        )}
      </Box>
    </MobileScreen>
  );
}

MobileProgress.propTypes = {
  data: PropTypes.shape({
    exercises: PropTypes.array.isRequired,
    personalRecords: PropTypes.array.isRequired,
    weightUnit: PropTypes.string.isRequired,
    goals: PropTypes.array,
    availableExercises: PropTypes.array,
    progressionAnalyses: PropTypes.array,
    plateauAlerts: PropTypes.array,
    appliedInterventions: PropTypes.object,
    dismissedAlerts: PropTypes.instanceOf(Set),
    progressData: PropTypes.object,
    selectedExercise: PropTypes.string,
    timeRange: PropTypes.string,
    showOnlyRecent: PropTypes.bool,
  }).isRequired,
  state: PropTypes.shape({ loading: PropTypes.bool, error: PropTypes.string }).isRequired,
  actions: PropTypes.object.isRequired,
};
