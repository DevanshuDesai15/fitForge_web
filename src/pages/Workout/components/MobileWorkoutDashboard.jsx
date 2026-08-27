import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';
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
    <MobileScreen>
      <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <Typography component="h1" sx={{ fontSize: { xs: '2rem', sm: '2.35rem' }, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Workout
        </Typography>
        {showCreateAction ? (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={isPrograms ? onNewProgram : onNewWorkout}
            sx={{ flexShrink: 0, borderRadius: '10px', color: 'primary.contrastText', fontWeight: 800 }}
          >
            {isPrograms ? 'New Program' : 'New Workout'}
          </Button>
        ) : null}
      </Box>

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
