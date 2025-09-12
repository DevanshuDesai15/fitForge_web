import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Chip,
    Divider
} from '@mui/material';
import { MdAdd, MdEdit, MdDelete, MdSave } from 'react-icons/md';
import { format } from 'date-fns';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { getWeightLabel } from '../../../utils/weightUnit';
import { StyledCard, ProgressChart } from './shared/StyledComponents';
import { calculateGoalProgress } from '../utils/progressUtils';

const GoalsSection = ({
    goals,
    exercises,
    availableExercises,
    weightUnit = 'kg',
    onGoalsUpdate,
    setError
}) => {
    const [goalDialog, setGoalDialog] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        exerciseName: '',
        targetWeight: '',
        targetReps: '',
        targetSets: '',
        deadline: ''
    });
    const [customExerciseName, setCustomExerciseName] = useState('');

    const { currentUser } = useAuth();

    const handleGoalSave = async () => {
        try {
            if (editingGoal) {
                await updateDoc(doc(db, 'goals', editingGoal.id), {
                    ...newGoal,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await addDoc(collection(db, 'goals'), {
                    ...newGoal,
                    userId: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    completed: false
                });
            }

            setGoalDialog(false);
            setEditingGoal(null);
            setNewGoal({
                exerciseName: '',
                targetWeight: '',
                targetReps: '',
                targetSets: '',
                deadline: ''
            });

            onGoalsUpdate();
        } catch (err) {
            setError('Error saving goal: ' + err.message);
        }
    };

    const handleGoalDelete = async (goalId) => {
        try {
            await deleteDoc(doc(db, 'goals', goalId));
            onGoalsUpdate();
        } catch (err) {
            setError('Error deleting goal: ' + err.message);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" sx={{ color: '#dded00', mb: 1 }}>
                        Fitness Goals
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Track your fitness journey, achievements, and goals
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={() => {
                        setGoalDialog(true);
                        setCustomExerciseName('');
                    }}
                    sx={{
                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                        color: '#000',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        px: 3,
                        py: 1,
                        '&:hover': {
                            background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                        },
                    }}
                >
                    New Goal
                </Button>
            </Box>

            <Grid container spacing={2}>
                {goals.map((goal) => {
                    const progress = calculateGoalProgress(goal, exercises);
                    const isCompleted = progress >= 100;

                    return (
                        <Grid item xs={12} md={6} key={goal.id}>
                            <StyledCard>
                                <Box sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#fff' }}>
                                            {goal.exerciseName}
                                        </Typography>
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingGoal(goal);
                                                    setNewGoal(goal);
                                                    setGoalDialog(true);
                                                }}
                                                sx={{ color: '#dded00', mr: 1 }}
                                            >
                                                <MdEdit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleGoalDelete(goal.id)}
                                                sx={{ color: '#ff4444' }}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        {goal.targetWeight && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Target Weight: {goal.targetWeight}{weightUnit}
                                            </Typography>
                                        )}
                                        {goal.targetReps && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Target Reps: {goal.targetReps}
                                            </Typography>
                                        )}
                                        {goal.targetSets && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Target Sets: {goal.targetSets}
                                            </Typography>
                                        )}
                                        {goal.deadline && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Progress
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: isCompleted ? '#dded00' : '#fff' }}>
                                                {progress.toFixed(1)}%
                                            </Typography>
                                        </Box>
                                        <ProgressChart progress={progress} />
                                    </Box>

                                    {isCompleted && (
                                        <Chip
                                            label="Goal Achieved!"
                                            sx={{
                                                backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                color: '#dded00',
                                                mt: 1
                                            }}
                                        />
                                    )}
                                </Box>
                            </StyledCard>
                        </Grid>
                    );
                })}
            </Grid>

            {goals.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                        No goals set yet. Start by adding your first fitness goal!
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<MdAdd />}
                        onClick={() => setGoalDialog(true)}
                        sx={{
                            borderColor: '#dded00',
                            color: '#dded00',
                            '&:hover': {
                                borderColor: '#e8f15d',
                                backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            },
                        }}
                    >
                        Add Your First Goal
                    </Button>
                </Box>
            )}

            {/* Goal Dialog */}
            <Dialog
                open={goalDialog}
                onClose={() => {
                    setGoalDialog(false);
                    setEditingGoal(null);
                    setNewGoal({
                        exerciseName: '',
                        targetWeight: '',
                        targetReps: '',
                        targetSets: '',
                        deadline: ''
                    });
                    setCustomExerciseName('');
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: '#282828',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(221, 237, 0, 0.2)',
                    }
                }}
            >
                <DialogTitle sx={{ color: '#dded00' }}>
                    {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Exercise Name
                                </InputLabel>
                                <Select
                                    value={newGoal.exerciseName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewGoal({ ...newGoal, exerciseName: value });
                                        if (value === 'custom') {
                                            setCustomExerciseName('');
                                        }
                                    }}
                                    sx={{
                                        color: '#fff',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#dded00',
                                        },
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Select an exercise</em>
                                    </MenuItem>
                                    {availableExercises.map(exerciseName => (
                                        <MenuItem key={exerciseName} value={exerciseName}>
                                            {exerciseName}
                                        </MenuItem>
                                    ))}
                                    <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                    <MenuItem value="custom">
                                        <em>Custom Exercise Name</em>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {/* Custom Exercise Name Field */}
                            {newGoal.exerciseName === 'custom' && (
                                <TextField
                                    fullWidth
                                    label="Custom Exercise Name"
                                    value={customExerciseName}
                                    onChange={(e) => {
                                        setCustomExerciseName(e.target.value);
                                        setNewGoal({ ...newGoal, exerciseName: e.target.value });
                                    }}
                                    sx={{
                                        mt: 2,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(221, 237, 0, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#dded00',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                    placeholder="Enter new exercise name"
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label={getWeightLabel(weightUnit).replace('Weight', 'Target Weight')}
                                type="number"
                                value={newGoal.targetWeight}
                                onChange={(e) => setNewGoal({ ...newGoal, targetWeight: e.target.value })}
                                helperText={weightUnit === 'kg' ? 'Enter target weight in kilograms' : 'Enter target weight in pounds'}
                                FormHelperTextProps={{
                                    sx: { color: 'text.secondary' }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#dded00',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Target Reps"
                                type="number"
                                value={newGoal.targetReps}
                                onChange={(e) => setNewGoal({ ...newGoal, targetReps: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#dded00',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Target Sets"
                                type="number"
                                value={newGoal.targetSets}
                                onChange={(e) => setNewGoal({ ...newGoal, targetSets: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#dded00',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Deadline"
                                type="date"
                                value={newGoal.deadline}
                                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#dded00',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setGoalDialog(false);
                            setEditingGoal(null);
                            setNewGoal({
                                exerciseName: '',
                                targetWeight: '',
                                targetReps: '',
                                targetSets: '',
                                deadline: ''
                            });
                            setCustomExerciseName('');
                        }}
                        sx={{ color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGoalSave}
                        variant="contained"
                        startIcon={<MdSave />}
                        disabled={!newGoal.exerciseName}
                        sx={{
                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                            color: '#000',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                            },
                        }}
                    >
                        {editingGoal ? 'Update Goal' : 'Save Goal'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GoalsSection;
