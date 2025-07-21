import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid2,
    Alert,
    CircularProgress,
    Paper,
    InputAdornment,
    TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdSave,
    MdFitnessCenter,
    MdFunctions,
    MdRepeat,
    MdViewColumn,
    MdNotes,
    MdTrendingUp
} from 'react-icons/md';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';

const StyledCard = styled(Card)(() => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0, 255, 159, 0.15)',
    border: '1px solid rgba(0, 255, 159, 0.2)',
    overflow: 'visible',
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(0, 255, 159, 0.5)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00ff9f',
            borderWidth: '2px',
        },
        '& input': {
            color: '#fff',
            fontSize: '16px',
        },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
            color: '#00ff9f',
        },
    },
    '& .MuiInputAdornment-root': {
        color: '#00ff9f',
    },
});

const FormSection = styled(Paper)({
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '24px',
});

export default function QuickAdd() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [exercise, setExercise] = useState({
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
    });
    const [selectedExercise, setSelectedExercise] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Debug effect to track exercise state changes
    useEffect(() => {
        console.log('🎯 QuickAdd: Exercise state updated:', exercise);
    }, [exercise]);

    // Handle exercise selection from the ExerciseSelector
    const handleExerciseSelect = (exerciseData) => {
        if (!exerciseData) {
            // Clear form when no exercise is selected
            setExercise({
                exerciseName: '',
                weight: '',
                reps: '',
                sets: '',
                notes: ''
            });
            setSelectedExercise('');
            return;
        }

        console.log('🔍 QuickAdd: Exercise selected:', exerciseData);
        console.log('🔍 QuickAdd: Exercise name:', exerciseData.name);
        console.log('🔍 QuickAdd: Exercise ID:', exerciseData.id);

        // Update exercise form with auto-populated data
        const newExercise = {
            exerciseName: exerciseData.name,
            weight: exerciseData.defaultWeight || '',
            reps: exerciseData.defaultReps || '',
            sets: exerciseData.defaultSets || '',
            notes: exerciseData.notes || ''
        };
        console.log('🔍 QuickAdd: Setting exercise state to:', newExercise);
        setExercise(newExercise);

        setSelectedExercise(exerciseData.id);
        console.log('🔍 QuickAdd: Setting selectedExercise to:', exerciseData.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await addDoc(collection(db, 'exercises'), {
                ...exercise,
                userId: currentUser.uid,
                timestamp: new Date().toISOString(),
            });

            setSuccess('Exercise added successfully!');
            setExercise({
                exerciseName: '',
                weight: '',
                reps: '',
                sets: '',
                notes: ''
            });
            setSelectedExercise('');

            // Automatically clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (error) {
            setError('Failed to add exercise: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExercise(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
            padding: '2rem 1rem',
        }}>
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 4,
                    textAlign: 'center',
                    justifyContent: 'center'
                }}>
                    <Box sx={{
                        background: 'linear-gradient(135deg, #00ff9f 0%, #00e676 100%)',
                        borderRadius: '16px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <MdTrendingUp size={32} color="#000" />
                    </Box>
                    <Typography
                        variant="h3"
                        sx={{
                            background: 'linear-gradient(135deg, #00ff9f 0%, #00e676 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                            letterSpacing: '-0.02em'
                        }}
                    >
                        Quick Add Exercise
                    </Typography>
                </Box>

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

                <StyledCard>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            {/* Exercise Selection Section */}
                            <FormSection>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <MdFitnessCenter size={24} color="#00ff9f" />
                                    <Typography variant="h6" sx={{ color: '#00ff9f', fontWeight: '600' }}>
                                        Select or Type Exercise Name
                                    </Typography>
                                </Box>
                                <ExerciseSelector
                                    onExerciseSelect={handleExerciseSelect}
                                    selectedExercise={selectedExercise}
                                    placeholder="Select or type exercise name..."
                                    includeHistory={true}
                                />
                            </FormSection>

                            <Grid2 container spacing={3}>
                                {/* Weight, Reps, Sets Row */}
                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Weight (kg)"
                                        name="weight"
                                        type="number"
                                        value={exercise.weight}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MdFunctions />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid2>

                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Reps"
                                        name="reps"
                                        type="number"
                                        value={exercise.reps}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MdRepeat />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid2>

                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Sets"
                                        name="sets"
                                        type="number"
                                        value={exercise.sets}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MdViewColumn />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid2>

                                {/* Notes */}
                                <Grid2 xs={12}>
                                    <StyledTextField
                                        fullWidth
                                        label="Notes (optional)"
                                        name="notes"
                                        multiline
                                        rows={3}
                                        value={exercise.notes}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                                    <MdNotes />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid2>

                                {/* Submit Button */}
                                <Grid2 xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
                                        sx={{
                                            mt: 3,
                                            py: 1.5,
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #00ff9f 0%, #00e676 100%)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            fontSize: '16px',
                                            textTransform: 'none',
                                            boxShadow: '0 4px 20px rgba(0, 255, 159, 0.3)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #00e676 0%, #00ff9f 100%)',
                                                boxShadow: '0 6px 30px rgba(0, 255, 159, 0.4)',
                                                transform: 'translateY(-2px)',
                                            },
                                            '&:disabled': {
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: 'rgba(255, 255, 255, 0.5)',
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {loading ? 'Saving Exercise...' : 'Save Exercise'}
                                    </Button>
                                </Grid2>
                            </Grid2>
                        </form>
                    </CardContent>
                </StyledCard>

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        onClick={() => navigate('/workout')}
                        variant="outlined"
                        sx={{
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '12px',
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: '500',
                            '&:hover': {
                                borderColor: '#00ff9f',
                                color: '#00ff9f',
                                backgroundColor: 'rgba(0, 255, 159, 0.05)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        ← Back to Workout
                    </Button>
                </Box>
            </div>
        </Box>
    );
}