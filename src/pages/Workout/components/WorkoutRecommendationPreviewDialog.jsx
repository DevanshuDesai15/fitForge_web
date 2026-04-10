import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { MdAutoAwesome, MdPlayArrow, MdEdit } from 'react-icons/md';

const WorkoutRecommendationPreviewDialog = ({ open, workout, onClose, onStart, onEdit }) => {
  if (!workout) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6">{workout.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {workout.description}
            </Typography>
          </Box>
          {workout.isAIPick && (
            <Chip icon={<MdAutoAwesome />} label="AI Pick" size="small" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={workout.duration} size="small" />
          <Chip label={`${workout.exercises} exercises`} size="small" />
          <Chip label={workout.difficulty} size="small" />
          <Chip label={workout.category} size="small" />
        </Box>
        <Divider sx={{ mb: 2 }} />
        {workout.dayData?.exercises?.map((exercise) => (
          <Box key={exercise.name} sx={{ py: 1 }}>
            <Typography variant="body1">{exercise.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {exercise.targetSets || 3} sets
            </Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onEdit} startIcon={<MdEdit />}>
          Edit Workout
        </Button>
        <Button variant="contained" onClick={onStart} startIcon={<MdPlayArrow />}>
          Start Workout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WorkoutRecommendationPreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  workout: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    exercises: PropTypes.number.isRequired,
    difficulty: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    isAIPick: PropTypes.bool,
    dayData: PropTypes.shape({
      exercises: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          targetSets: PropTypes.number,
          sets: PropTypes.arrayOf(
            PropTypes.shape({
              weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              completed: PropTypes.bool,
            })
          ),
        })
      ),
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default WorkoutRecommendationPreviewDialog;
