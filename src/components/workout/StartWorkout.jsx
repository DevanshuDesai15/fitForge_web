import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Chip,
    TextField,
    Alert,
    Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdPlayArrow,
    MdStop,
    MdTimer
} from 'react-icons/md';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
        },
        '&:hover fieldset': {
            borderColor: '#00ff9f',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00ff9f',
        },
    },
    '& label.Mui-focused': {
        color: '#00ff9f',
    },
});

export default function StartWorkout() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutTime, setWorkoutTime] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [newExercise, setNewExercise] = useState({
        name: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
    });

    useEffect(() => {
        let interval;
        if (workoutStarted) {
            interval = setInterval(() => {
                setWorkoutTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [workoutStarted]);

    const handleStartWorkout = () => {
        setWorkoutStarted(true);
        setWorkoutTime(0);
        setExercises([]);
        setError('');
        setSuccess('');
    };

    const handleFinishWorkout = async () => {
        if (exercises.length === 0) {
            setError('Please add at least one exercise before finishing the workout');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'workouts'), {
                userId: currentUser.uid,
                exercises: exercises,
                duration: workoutTime,
                timestamp: new Date().toISOString()
            });

            setSuccess('Workout saved successfully!');
            setWorkoutStarted(false);
            setExercises([]);
            setWorkoutTime(0);

            // Navigate to history page after short delay
            setTimeout(() => {
                navigate('/history');
            }, 2000);

        } catch (error) {
            setError('Error saving workout: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExercise = (indexToDelete) => {
        setExercises(exercises.filter((_, index) => index !== indexToDelete));
    };

    const handleAddExercise = () => {
        if (!newExercise.name || !newExercise.weight || !newExercise.reps || !newExercise.sets) {
            setError('Please fill in all required fields');
            return;
        }

        setExercises([...exercises, {
            ...newExercise,
            weight: parseFloat(newExercise.weight),
            reps: parseInt(newExercise.reps),
            sets: parseInt(newExercise.sets)
        }]);

        setNewExercise({
            name: '',
            weight: '',
            reps: '',
            sets: '',
            notes: ''
        });

        setOpenDialog(false);
    };

    const handleExerciseChange = (e) => {
        const { name, value } = e.target;
        setNewExercise(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444'
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                            color: '#00ff9f'
                        }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                        {workoutStarted ? 'Active Workout' : 'Start Workout'}
                    </Typography>
                    {workoutStarted && (
                        <Chip
                            icon={<MdTimer />}
                            label={formatTime(workoutTime)}
                            sx={{
                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                color: '#00ff9f',
                                '& .MuiChip-icon': { color: '#00ff9f' }
                            }}
                        />
                    )}
                </Box>

                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        {!workoutStarted ? (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdPlayArrow />}
                                onClick={handleStartWorkout}
                                sx={{
                                    background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                }}
                            >
                                Start Workout
                            </Button>
                        ) : (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdStop />}
                                onClick={handleFinishWorkout}
                                disabled={loading}
                                sx={{
                                    background: 'linear-gradient(45deg, #ff4444 30%, #ff1744 90%)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                }}
                            >
                                {loading ? 'Saving...' : 'Finish Workout'}
                            </Button>
                        )}
                    </CardContent>
                </StyledCard>

                {workoutStarted && (
                    <>
                        <List>
                            {exercises.map((exercise, index) => (
                                <StyledCard key={index} sx={{ mb: 2 }}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                sx={{ color: '#ff4444' }}
                                                onClick={() => handleDeleteExercise(index)}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ color: '#00ff9f' }}>
                                                    {exercise.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography sx={{ color: 'text.secondary' }}>
                                                    {`${exercise.weight}kg × ${exercise.reps} reps × ${exercise.sets} sets`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </StyledCard>
                            ))}
                        </List>

                        <Fab
                            color="primary"
                            sx={{
                                position: 'fixed',
                                bottom: 72,
                                right: 16,
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            }}
                            onClick={() => setOpenDialog(true)}
                        >
                            <MdAdd />
                        </Fab>
                    </>
                )}

                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{
                        style: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                            maxWidth: '600px',
                            width: '100%'
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>Add Exercise</DialogTitle>
                    <DialogContent>
                        <Box component="form" sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <StyledTextField
                                        autoFocus
                                        fullWidth
                                        label="Exercise Name"
                                        name="name"
                                        value={newExercise.name}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Weight (kg)"
                                        name="weight"
                                        type="number"
                                        value={newExercise.weight}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Reps"
                                        name="reps"
                                        type="number"
                                        value={newExercise.reps}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Sets"
                                        name="sets"
                                        type="number"
                                        value={newExercise.sets}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <StyledTextField
                                        fullWidth
                                        label="Notes (optional)"
                                        name="notes"
                                        multiline
                                        rows={2}
                                        value={newExercise.notes}
                                        onChange={handleExerciseChange}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            onClick={() => setOpenDialog(false)}
                            sx={{ color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddExercise}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                },
                            }}
                        >
                            Add Exercise
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}