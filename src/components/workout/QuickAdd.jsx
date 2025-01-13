import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdAdd, MdSave } from 'react-icons/md';
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

const StyledTextField = styled('input')({
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    '&:focus': {
        outline: 'none',
        borderColor: '#00ff9f',
    },
    '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.5)',
    },
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
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: '#00ff9f',
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Quick Add Exercise
                </Typography>

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
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <StyledTextField
                                        type="text"
                                        name="exerciseName"
                                        placeholder="Exercise Name"
                                        value={exercise.exerciseName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="weight"
                                        placeholder="Weight (kg)"
                                        value={exercise.weight}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="reps"
                                        placeholder="Reps"
                                        value={exercise.reps}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="sets"
                                        placeholder="Sets"
                                        value={exercise.sets}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <StyledTextField
                                        as="textarea"
                                        name="notes"
                                        placeholder="Notes (optional)"
                                        value={exercise.notes}
                                        onChange={handleChange}
                                        style={{ minHeight: '100px' }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
                                        sx={{
                                            mt: 2,
                                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                            },
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Exercise'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </StyledCard>

                <Button
                    onClick={() => navigate('/workout')}
                    sx={{
                        mt: 3,
                        color: 'text.secondary',
                        '&:hover': {
                            color: '#00ff9f',
                        },
                    }}
                >
                    Back to Workout
                </Button>
            </div>
        </Box>
    );
}