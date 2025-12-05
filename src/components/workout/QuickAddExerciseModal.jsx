import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { X, Plus } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '500px',
    width: '100%',
    margin: '16px',
    overflowX: 'hidden',
    [theme.breakpoints.down('sm')]: {
      margin: '8px',
      borderRadius: '12px',
      maxHeight: 'calc(100vh - 16px)',
    },
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '20px 24px',
  gap: '12px',
  [theme.breakpoints.down('sm')]: {
    padding: '16px 12px',
    gap: '8px',
  },
}));

const TitleSection = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: '#dded00',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#dded00',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#dded00',
  },
}));

const StyledSelect = styled(Select)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dded00',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dded00',
  },
}));

const AddButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #dded00 0%, #c4d600 100%)',
  color: '#000',
  fontWeight: 600,
  textTransform: 'none',
  padding: '10px 24px',
  borderRadius: '8px',
  '&:hover': {
    background: 'linear-gradient(135deg, #f0f040 0%, #dded00 100%)',
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
}));

const CancelButton = styled(Button)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const Label = styled(Typography)({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '8px',
});

const exerciseTypes = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance',
  'Endurance',
  'HIIT',
  'Yoga',
  'Pilates',
  'Other'
];

const QuickAddExerciseModal = ({ open, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    exerciseName: '',
    exerciseType: '',
    sets: '',
    reps: '',
    weight: '',
    duration: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        exerciseName: '',
        exerciseType: '',
        sets: '',
        reps: '',
        weight: '',
        duration: ''
      });
      setError('');
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.exerciseName.trim()) {
      setError('Exercise name is required');
      return false;
    }
    if (!formData.exerciseType) {
      setError('Exercise type is required');
      return false;
    }

    // Validate that at least one of sets/reps or duration is filled
    const hasSetsReps = formData.sets || formData.reps;
    const hasDuration = formData.duration;

    if (!hasSetsReps && !hasDuration) {
      setError('Please enter either sets/reps or duration');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!currentUser) {
      setError('You must be logged in to add exercises');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const timestamp = Date.now();

      // Prepare sets data
      const setsCount = parseInt(formData.sets) || 1;
      const repsCount = parseInt(formData.reps) || 0;
      const weightValue = formData.weight || '0';

      const sets = [];
      for (let i = 0; i < setsCount; i++) {
        sets.push({
          weight: weightValue,
          reps: repsCount,
          completed: true
        });
      }

      // Save to workouts collection (full workout session)
      const workoutData = {
        userId: currentUser.uid,
        templateId: null,
        templateName: 'Quick Add Workout',
        dayName: 'Quick Add Session',
        exercises: [{
          name: formData.exerciseName,
          type: formData.exerciseType,
          sets: sets,
          duration: formData.duration ? parseInt(formData.duration) : null,
          notes: ''
        }],
        duration: formData.duration ? parseInt(formData.duration) : null,
        completed: true,
        completedAt: now,
        createdAt: now,
        timestamp: timestamp
      };

      const workoutDocRef = await addDoc(collection(db, 'workouts'), workoutData);
      console.log('✅ Workout saved with ID:', workoutDocRef.id);

      // Save to exercises collection (individual exercise record)
      const exerciseRecord = {
        userId: currentUser.uid,
        exerciseName: formData.exerciseName,
        exerciseType: formData.exerciseType,
        sets: sets,
        weight: parseFloat(weightValue) || 0,
        reps: repsCount,
        duration: formData.duration ? parseInt(formData.duration) : null,
        timestamp: now,
        createdAt: now,
        workoutId: workoutDocRef.id
      };

      await addDoc(collection(db, 'exercises'), exerciseRecord);
      console.log('✅ Exercise record saved');

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('❌ Error saving exercise:', err);
      setError(`Failed to save exercise: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <TitleSection>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Plus size={20} style={{ color: '#dded00' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: '#fff'
              }}
            >
              Quick Add Exercise
            </Typography>
          </Box>
        </TitleSection>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            flexShrink: 0,
            padding: { xs: '6px', sm: '8px' },
          }}
        >
          <X size={20} />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3, fontSize: '0.875rem' }}>
          Log a new exercise to track your workout progress and maintain your fitness streak.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Exercise Name */}
          <Box>
            <Label>Exercise Name</Label>
            <StyledTextField
              fullWidth
              size="small"
              value={formData.exerciseName}
              onChange={(e) => handleChange('exerciseName', e.target.value)}
              placeholder="e.g., Push-ups, Running, Squats"
            />
          </Box>

          {/* Exercise Type */}
          <Box>
            <Label>Exercise Type</Label>
            <FormControl fullWidth size="small">
              <StyledSelect
                value={formData.exerciseType}
                onChange={(e) => handleChange('exerciseType', e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Select exercise type</span>
                </MenuItem>
                {exerciseTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </Box>

          {/* Sets and Reps Row */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Label># Sets</Label>
              <StyledTextField
                fullWidth
                size="small"
                type="number"
                value={formData.sets}
                onChange={(e) => handleChange('sets', e.target.value)}
                placeholder="3"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <Label># Reps</Label>
              <StyledTextField
                fullWidth
                size="small"
                type="number"
                value={formData.reps}
                onChange={(e) => handleChange('reps', e.target.value)}
                placeholder="12"
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          {/* Weight and Duration Row */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Label>Weight (lbs)</Label>
              <StyledTextField
                fullWidth
                size="small"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="135"
                inputProps={{ min: 0, step: 5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <Label>Duration (min)</Label>
              <StyledTextField
                fullWidth
                size="small"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="30"
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          {/* Error message */}
          {error && (
            <Typography variant="body2" sx={{ color: '#ff4444', fontSize: '0.875rem' }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, borderTop: '1px solid rgba(255, 255, 255, 0.1)', gap: 1 }}>
        <CancelButton onClick={onClose} disabled={loading}>
          Cancel
        </CancelButton>
        <AddButton
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : <Plus size={18} />}
        >
          {loading ? 'Adding...' : 'Add Exercise'}
        </AddButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default QuickAddExerciseModal;
