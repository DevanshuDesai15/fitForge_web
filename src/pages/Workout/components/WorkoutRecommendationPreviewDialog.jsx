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
  IconButton
} from '@mui/material';
import { Sparkles as MdAutoAwesome, Play as MdPlayArrow, Pencil as MdEdit, X as MdClose } from 'lucide-react';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        background: '#1a1a1a',
        border: '1px solid rgba(221, 237, 0, 0.2)',
        borderRadius: '16px',
        color: '#fff',
    },
}));
const WorkoutRecommendationPreviewDialog = ({ open, workout, onClose, onStart, onEdit }) => {
  if (!workout) return null;

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{workout.title}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {workout.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {workout.isAIPick && (
                <Chip 
                  icon={<MdAutoAwesome style={{ color: '#000' }} />} 
                  label="AI Pick" 
                  size="small" 
                  sx={{
                    backgroundColor: '#dded00',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: '24px'
                  }}
                />
              )}
              <IconButton onClick={onClose} sx={{ color: 'inherit' }} size="small">
                  <MdClose />
              </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={workout.duration} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          <Chip label={`${workout.exercises} exercises`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          <Chip label={workout.difficulty} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
          <Chip label={workout.category} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        {workout.dayData?.exercises?.map((exercise) => (
          <Box key={exercise.name} sx={{ py: 1 }}>
            <Typography variant="body1">{exercise.name}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {exercise.targetSets || 3} sets
            </Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
        <Button onClick={onEdit} startIcon={<MdEdit />} sx={{ color: '#dded00' }}>
          Edit Workout
        </Button>
        <Button 
          variant="contained" 
          onClick={onStart} 
          startIcon={<MdPlayArrow />}
          sx={{
            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
             color: '#000',
             fontWeight: 'bold',
             '&:hover': {
                 background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
             },
          }}
        >
          Start Workout
        </Button>
      </DialogActions>
    </StyledDialog>
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
