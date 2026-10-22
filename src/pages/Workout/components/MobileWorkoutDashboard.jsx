import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { Plus } from 'lucide-react';
import { MobileScreen, MobileTabs } from '../../../components/mobile';

const tabs = [
  { id: 'workouts', label: 'Workouts' },
  { id: 'programs', label: 'Programs' },
  { id: 'library', label: 'Library' },
];

export default function MobileWorkoutDashboard({ activeTab, onTabChange, onNewWorkout, onNewProgram, panels }) {
  const isPrograms = activeTab === 'programs';
  const showCreateAction = activeTab !== 'library';

  return (
    <MobileScreen title="Workouts & Exercises" subtitle="Track routines and browse exercise library">
      {showCreateAction ? (
        <Button
          fullWidth
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={isPrograms ? onNewProgram : onNewWorkout}
          sx={{ mb: 3, borderRadius: '10px', color: 'primary.contrastText', fontWeight: 800 }}
        >
          {isPrograms ? 'New Program' : 'New Workout'}
        </Button>
      ) : null}

      <MobileTabs
        tabs={tabs}
        value={activeTab}
        onChange={onTabChange}
        ariaLabel="Workout sections"
        sx={{ mb: 3 }}
      />

      <Box role="tabpanel" aria-label={`${tabs.find((tab) => tab.id === activeTab)?.label} panel`}>
        {panels[activeTab]}
      </Box>
    </MobileScreen>
  );
}

MobileWorkoutDashboard.propTypes = {
  activeTab: PropTypes.oneOf(['workouts', 'programs', 'library']).isRequired,
  onTabChange: PropTypes.func.isRequired,
  onNewWorkout: PropTypes.func.isRequired,
  onNewProgram: PropTypes.func.isRequired,
  panels: PropTypes.shape({
    workouts: PropTypes.node.isRequired,
    programs: PropTypes.node.isRequired,
    library: PropTypes.node.isRequired,
  }).isRequired,
};
