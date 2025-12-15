import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Divider,
    Grid
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    MdFitnessCenter,
    MdSave,
    MdCancel,
    MdHistory,
    MdAdd
} from 'react-icons/md';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useUnits } from '../../contexts/UnitsContext';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';

const StyledCard = styled(Card)(({ theme }) => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${theme.palette.surface.secondary}`,
    },
}));

const FormCard = styled(Card)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.surface.primary} 0%, ${theme.palette.surface.transparent} 100%)`,
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: `1px solid ${theme.palette.border.primary}`,
    boxShadow: `0 10px 40px ${theme.palette.surface.secondary}`,
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 12,
    fontWeight: 'bold',
    padding: '12px 32px',
    ...(variant === 'primary' && {
        background: theme.palette.background.gradient.button,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            background: theme.palette.background.gradient.buttonHover,
        },
    }),
}));

export default function QuickAdd() {
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fillSuccess, setFillSuccess] = useState('');
    const [recentExercises, setRecentExercises] = useState([]);

    const { currentUser } = useAuth();
    const { weightUnit } = useUnits();
    const navigate = useNavigate();
    const theme = useTheme();

    // Weight unit is now automatically provided by UnitsContext
    useEffect(() => {
        loadRecentExercises();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadRecentExercises = async () => {
        if (!currentUser) return;

        try {
            const exercisesQuery = query(
                collection(db, 'exercises'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(exercisesQuery);
            const exercisesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentExercises(exercisesData);
        } catch (error) {
            console.error('Error loading recent exercises:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!exerciseName.trim() || !sets || !reps || !weight) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const setsArray = Array.from({ length: parseInt(sets) }, () => ({
                reps: parseInt(reps),
                weight: parseFloat(weight),
                weightUnit: weightUnit, // Store unit for each set
                completed: false
            }));

            const exerciseData = {
                exerciseName,
                weightUnit: weightUnit, // Store unit used
                sets: setsArray,
                weight: parseFloat(weight), // Store max weight
                reps: parseInt(reps), // Store max reps
                notes: notes.trim(),
                timestamp: new Date().toISOString(),
                userId: currentUser.uid,
                type: 'quickAdd'
            };

            await addDoc(collection(db, 'exercises'), exerciseData);

            setSuccess('Exercise logged successfully!');

            // Reset form
            setExerciseName('');
            setSets('');
            setReps('');
            setWeight('');
            setNotes('');

            // Reload recent exercises
            loadRecentExercises();

        } catch (error) {
            console.error('Error saving exercise:', error);
            setError('Failed to save exercise. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/workout');
    };

    const handleExerciseSelect = (exercise) => {
        if (exercise && exercise.name) {
            setExerciseName(exercise.name);
        } else if (typeof exercise === 'string') {
            setExerciseName(exercise);
        }
    };

    const fillFromRecent = (exercise) => {
        setExerciseName(exercise.exerciseName);
        if (Array.isArray(exercise.sets)) {
            setSets(exercise.sets.length.toString());
            setReps(exercise.sets[0].reps.toString());
            setWeight(exercise.sets[0].weight.toString());
        } else {
            setSets(exercise.sets.toString());
            setReps(exercise.reps.toString());
            setWeight(exercise.weight.toString());
        }
        setNotes(exercise.notes || '');
        setFillSuccess(`Filled form with details for ${exercise.exerciseName}.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            setFillSuccess('');
        }, 3000);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
            paddingBottom: '100px',
        }}>
            <div className="max-w-2xl mx-auto">
                {error && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: `${theme.palette.status.error}20`, color: theme.palette.status.error }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3, backgroundColor: `${theme.palette.status.success}20`, color: theme.palette.status.success }}>
                        {success}
                    </Alert>
                )}

                {fillSuccess && (
                    <Alert severity="info" sx={{ mb: 3, backgroundColor: `${theme.palette.status.info}20`, color: theme.palette.status.info }}>
                        {fillSuccess}
                    </Alert>
                )}

                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                        <MdFitnessCenter size={24} color={theme.palette.primary.main} />
                        <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: '600' }}>
                            Quick Add Exercise
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Log a single exercise quickly and easily
                    </Typography>
                </Box>

                {/* Main Form */}
                <FormCard sx={{ mb: 4 }}>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Exercise Selection */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, mb: 2, fontWeight: 'bold' }}>
                                        Exercise
                                    </Typography>
                                    <ExerciseSelector
                                        onExerciseSelect={handleExerciseSelect}
                                        placeholder="Search or type exercise name..."
                                        includeHistory={true}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: theme.palette.text.primary,
                                                backgroundColor: theme.palette.surface.transparent,
                                                '& fieldset': { borderColor: theme.palette.border.main },
                                                '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                            },
                                        }}
                                    />
                                </Grid>

                                {/* Exercise Details */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Sets"
                                        type="number"
                                        value={sets}
                                        onChange={(e) => setSets(e.target.value)}
                                        fullWidth
                                        required
                                        inputProps={{ min: 1 }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: theme.palette.text.primary,
                                                '& fieldset': { borderColor: theme.palette.border.main },
                                                '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                            },
                                            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                                            '&.Mui-focused .MuiInputLabel-root': { color: theme.palette.primary.main },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Reps"
                                        type="number"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        fullWidth
                                        required
                                        inputProps={{ min: 1 }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: theme.palette.text.primary,
                                                '& fieldset': { borderColor: theme.palette.border.main },
                                                '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                            },
                                            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                                            '&.Mui-focused .MuiInputLabel-root': { color: theme.palette.primary.main },
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label={`Weight (${weightUnit})`}
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        fullWidth
                                        required
                                        inputProps={{ min: 0, step: 0.5 }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: theme.palette.text.primary,
                                                '& fieldset': { borderColor: theme.palette.border.main },
                                                '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                            },
                                            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                                            '&.Mui-focused .MuiInputLabel-root': { color: theme.palette.primary.main },
                                        }}
                                    />
                                </Grid>

                                {/* Notes */}
                                <Grid item xs={12}>
                                    <TextField
                                        label="Notes (optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Add any notes about your exercise..."
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: theme.palette.text.primary,
                                                '& fieldset': { borderColor: theme.palette.border.main },
                                                '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                                            },
                                            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                                            '&.Mui-focused .MuiInputLabel-root': { color: theme.palette.primary.main },
                                        }}
                                    />
                                </Grid>

                                {/* Action Buttons */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                                        <ActionButton
                                            variant="outlined"
                                            onClick={handleCancel}
                                            startIcon={<MdCancel />}
                                            sx={{
                                                borderColor: theme.palette.border.primary,
                                                color: theme.palette.text.secondary,
                                                '&:hover': {
                                                    borderColor: theme.palette.primary.main,
                                                    backgroundColor: theme.palette.surface.primary,
                                                },
                                            }}
                                        >
                                            Cancel
                                        </ActionButton>
                                        <ActionButton
                                            variant="primary"
                                            type="submit"
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
                                        >
                                            {loading ? 'Saving...' : 'Save Exercise'}
                                        </ActionButton>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </FormCard>

                {/* Recent Exercises */}
                {recentExercises.length > 0 && (
                    <StyledCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <MdHistory style={{ color: theme.palette.primary.main }} />
                                <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                                    Recent Exercises
                                </Typography>
                            </Box>

                            {recentExercises.map((exercise, index) => (
                                <Box key={exercise.id}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            py: 2
                                        }}
                                    >
                                        <Box>
                                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                                                {exercise.exerciseName}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {Array.isArray(exercise.sets)
                                                    ? `${exercise.sets.length} sets × ${exercise.sets[0].reps} reps × ${exercise.sets[0].weight}${weightUnit}`
                                                    : `${exercise.sets} sets × ${exercise.reps} reps × ${exercise.weight}${weightUnit}`
                                                }
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            onClick={() => fillFromRecent(exercise)}
                                            sx={{
                                                color: theme.palette.primary.main,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.surface.primary,
                                                }
                                            }}
                                        >
                                            <MdAdd />
                                        </IconButton>
                                    </Box>
                                    {index < recentExercises.length - 1 && (
                                        <Divider sx={{ bgcolor: theme.palette.border.main }} />
                                    )}
                                </Box>
                            ))}
                        </CardContent>
                    </StyledCard>
                )}
            </div>
        </Box>
    );
}