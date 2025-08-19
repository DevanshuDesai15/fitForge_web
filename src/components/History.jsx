import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Tab,
    Tabs,
    List,
    Chip,
    Divider,
    CircularProgress,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    MdCalendarMonth,
    MdHistory,
    MdFitnessCenter,
    MdTimer,
    MdTrendingUp,
    MdBarChart,
    MdToday,
    MdAdd,
    MdClose,
} from 'react-icons/md';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWeightUnit } from '../utils/weightUnit';
// Date utils no longer needed for new calendar
import WorkoutCalendar from './WorkoutCalendar';
import {
    format,
    isSameDay
} from 'date-fns';

const StyledCard = styled(Card)(({ theme }) => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: `0 4px 30px ${theme.palette.surface.secondary}`,
    border: `1px solid ${theme.palette.border.main}`,
}));

// Old CalendarDay styled component removed - now using WorkoutCalendar component

const StatCard = styled(Card)(({ theme }) => ({
    background: theme.palette.surface.primary,
    borderRadius: '12px',
    border: `1px solid ${theme.palette.surface.secondary}`,
}));

export default function History() {
    const [activeTab, setActiveTab] = useState(0);
    const [workouts, setWorkouts] = useState([]);
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const [workoutDates, setWorkoutDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnitState] = useState('kg');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateWorkouts, setSelectedDateWorkouts] = useState([]);
    // Old calendar state variables removed - now using WorkoutCalendar component
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    // Define functions first
    const loadWorkoutDates = useCallback(async () => {
        if (!currentUser) {
            console.warn('No current user found');
            return;
        }

        try {
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc')
            );
            const workoutDocs = await getDocs(workoutsQuery);
            const workoutData = workoutDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Extract unique dates
            const dates = workoutData.map(workout => new Date(workout.timestamp).toDateString());
            setWorkoutDates([...new Set(dates)]);
            setWorkouts(workoutData); // Store workouts for calendar details
        } catch (err) {
            console.error('Error loading workout dates:', err);
            setError('Error loading workout dates: ' + err.message);
        }
    }, [currentUser]);

    const loadData = useCallback(async () => {
        if (!currentUser) {
            console.warn('No current user found in loadData');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (activeTab === 0) { // Calendar - load workout dates
                await loadWorkoutDates();
            } else if (activeTab === 1) { // Past Workouts
                const workoutsQuery = query(
                    collection(db, 'workouts'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const workoutDocs = await getDocs(workoutsQuery);
                const workoutData = workoutDocs.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setWorkouts(workoutData);
            } else if (activeTab === 2) { // Exercise History
                const exercisesQuery = query(
                    collection(db, 'exercises'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const exerciseDocs = await getDocs(exercisesQuery);
                setExerciseHistory(exerciseDocs.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            }
        } catch (err) {
            console.error('Error details:', err);
            if (err.code === 'failed-precondition') {
                setError('Please wait while we set up the database indexes...');
            } else if (err.code === 'permission-denied') {
                setError('Permission denied. Please try logging out and back in.');
            } else {
                setError('Error loading history: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeTab, loadWorkoutDates]);

    // useEffects after function definitions
    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser, loadData]);

    useEffect(() => {
        // Load weight unit preference
        setWeightUnitState(getWeightUnit());

        // Listen for weight unit changes (for multi-tab sync)
        const handleStorageChange = (e) => {
            if (e.key === 'weightUnit') {
                setWeightUnitState(e.newValue || 'kg');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Duplicate loadWorkoutDates function removed

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Old calendar functions removed - now using WorkoutCalendar component

    const getWorkoutStats = () => {
        if (workouts.length === 0) return null;

        const totalWorkouts = workouts.length;
        const totalDuration = workouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);
        const avgDuration = totalDuration / totalWorkouts;
        const totalExercises = workouts.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0);

        return {
            totalWorkouts,
            totalDuration,
            avgDuration,
            totalExercises
        };
    };

    const getExerciseStats = () => {
        if (exerciseHistory.length === 0) return null;

        const totalExercises = exerciseHistory.length;
        const uniqueExercises = [...new Set(exerciseHistory.map(ex => ex.exerciseName))].length;
        const totalWeight = exerciseHistory.reduce((sum, ex) => {
            if (Array.isArray(ex.sets)) {
                return sum + ex.sets.reduce((setSum, set) => {
                    const weight = set.weightType === 'bodyweight' ? 0 : (parseFloat(set.weight) || 0);
                    const reps = parseInt(set.reps) || 0;
                    return setSum + (weight * reps);
                }, 0);
            }
            return sum + ((parseFloat(ex.weight) || 0) * (parseInt(ex.reps) || 0));
        }, 0);
        const totalReps = exerciseHistory.reduce((sum, ex) => {
            if (Array.isArray(ex.sets)) {
                return sum + ex.sets.reduce((setSum, set) => setSum + (parseInt(set.reps) || 0), 0);
            }
            return sum + (parseInt(ex.reps) || 0);
        }, 0);

        return {
            totalExercises,
            uniqueExercises,
            totalWeight,
            totalReps
        };
    };

    // Old calendar function removed - now using GitHub-style WorkoutCalendar component

    const renderPastWorkouts = () => {
        const stats = getWorkoutStats();

        return (
            <Box>
                {/* Workout Statistics */}
                {stats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdFitnessCenter style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.totalWorkouts}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Workouts
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTimer style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {formatTime(Math.round(stats.avgDuration))}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Avg Duration
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {formatTime(stats.totalDuration)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Time
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdBarChart style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.totalExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Exercises
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                    </Grid>
                )}

                {/* Empty State for No Workouts */}
                {workouts.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        background: theme.palette.surface.transparent,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.surface.secondary}`
                    }}>
                        <MdFitnessCenter
                            style={{
                                fontSize: '4rem',
                                color: theme.palette.surface.hover,
                                marginBottom: '1rem'
                            }}
                        />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            No workouts yet. Start your first workout!
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                            Track your fitness journey by logging your first workout session.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<MdPlayArrow />}
                            onClick={() => navigate('/workout/start')}
                            sx={{
                                background: theme.palette.background.gradient.button,
                                color: theme.palette.primary.contrastText,
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    background: theme.palette.background.gradient.buttonHover,
                                },
                            }}
                        >
                            Start New Workout Session
                        </Button>
                    </Box>
                ) : (
                    /* Workout List */
                    <List>
                        {workouts.map((workout) => (
                            <StyledCard key={workout.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MdToday /> {format(new Date(workout.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                        <Chip
                                            icon={<MdTimer />}
                                            label={formatTime(workout.duration)}
                                            sx={{
                                                backgroundColor: theme.palette.surface.secondary,
                                                color: theme.palette.primary.main,
                                                '& .MuiChip-icon': { color: theme.palette.primary.main }
                                            }}
                                        />
                                    </Box>
                                    <Divider sx={{ mb: 2, bgcolor: theme.palette.border.main }} />
                                    {workout.exercises?.map((exercise, index) => (
                                        <Box key={index} sx={{ mb: 1 }}>
                                            <Typography sx={{ color: theme.palette.text.primary }}>
                                                {exercise.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {Array.isArray(exercise.sets)
                                                    ? `${exercise.sets.length} sets completed`
                                                    : `${exercise.weight || 0}${weightUnit} × ${exercise.reps || 0} reps × ${exercise.sets || 0} sets`
                                                }
                                            </Typography>
                                            {/* Show individual sets if available */}
                                            {Array.isArray(exercise.sets) && exercise.sets.length > 0 && (
                                                <Box sx={{ ml: 2, mt: 0.5 }}>
                                                    {exercise.sets.map((set, setIndex) => (
                                                        <Typography key={setIndex} variant="caption" sx={{ color: theme.palette.text.muted, display: 'block' }}>
                                                            Set {setIndex + 1}: {set.reps || 0} reps
                                                            {set.weightType === 'bodyweight'
                                                                ? ' (Bodyweight)'
                                                                : ` @ ${set.weight || 0}${set.weightUnit || weightUnit}`
                                                            }
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                            {exercise.notes && (
                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                                                    Note: {exercise.notes}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </CardContent>
                            </StyledCard>
                        ))}
                    </List>
                )}
            </Box>
        );
    };

    const renderExerciseHistory = () => {
        const stats = getExerciseStats();

        return (
            <Box>
                {/* Exercise Statistics */}
                {stats && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdFitnessCenter style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.totalExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Exercises
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdBarChart style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.uniqueExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Unique Exercises
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.totalWeight.toFixed(0)}{weightUnit}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Weight
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTimer style={{ color: theme.palette.primary.main }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {stats.totalReps}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Total Reps
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                    </Grid>
                )}

                {/* Empty State for No Exercise History */}
                {exerciseHistory.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center',
                        py: 6,
                        background: theme.palette.surface.transparent,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.surface.secondary}`
                    }}>
                        <MdAdd
                            style={{
                                fontSize: '4rem',
                                color: theme.palette.surface.hover,
                                marginBottom: '1rem'
                            }}
                        />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            No exercises logged yet. Start tracking your progress!
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                            Log your first exercise to begin building your fitness history.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<MdAdd />}
                            onClick={() => navigate('/workout/quick-add')}
                            sx={{
                                background: theme.palette.background.gradient.button,
                                color: theme.palette.primary.contrastText,
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    background: theme.palette.background.gradient.buttonHover,
                                },
                            }}
                        >
                            Quick Add Exercise
                        </Button>
                    </Box>
                ) : (
                    /* Exercise List */
                    <List>
                        {exerciseHistory.map((exercise) => (
                            <StyledCard key={exercise.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {exercise.exerciseName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                            {format(new Date(exercise.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                                        {Array.isArray(exercise.sets)
                                            ? `${exercise.sets.length} sets × ${exercise.sets[0].reps} reps × ${exercise.sets[0].weight}${weightUnit}`
                                            : `${exercise.weight}${weightUnit} × ${exercise.reps} reps × ${exercise.sets} sets`
                                        }
                                    </Typography>
                                    {exercise.notes && (
                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, fontStyle: 'italic' }}>
                                            Note: {exercise.notes}
                                        </Typography>
                                    )}
                                </CardContent>
                            </StyledCard>
                        ))}
                    </List>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Workout History
                </Typography>

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: theme.palette.text.muted },
                            '& .Mui-selected': { color: `${theme.palette.primary.main} !important` },
                            '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main },
                        }}
                    >
                        <Tab icon={<MdCalendarMonth />} label="Calendar" />
                        <Tab icon={<MdHistory />} label="Past Workouts" />
                        <Tab icon={<MdFitnessCenter />} label="Exercise History" />
                    </Tabs>
                </StyledCard>

                <StyledCard>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress sx={{ color: theme.palette.primary.main }} />
                            </Box>
                        ) : error ? (
                            <Typography variant="body1" sx={{ color: theme.palette.status.error }}>
                                {error}
                            </Typography>
                        ) : (
                            <>
                                {activeTab === 0 && <WorkoutCalendar workouts={workouts} />}
                                {activeTab === 1 && renderPastWorkouts()}
                                {activeTab === 2 && renderExerciseHistory()}
                            </>
                        )}
                    </CardContent>
                </StyledCard>

                {/* Workout Details Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: '#282828',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${theme.palette.surface.secondary}`,
                        }
                    }}
                >
                    <DialogTitle sx={{ color: theme.palette.primary.main, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Workouts for {selectedDate && format(selectedDate, 'MMM dd, yyyy')}
                        </Typography>
                        <IconButton
                            onClick={() => setDialogOpen(false)}
                            sx={{
                                color: theme.palette.primary.main,
                            }}
                        >
                            <MdClose />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {selectedDateWorkouts.map((workout) => (
                            <Box key={workout.id} sx={{ mb: 3, p: 2, backgroundColor: theme.palette.surface.transparent, borderRadius: 2 }}>
                                <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                                    {workout.templateInfo?.templateName || 'Custom Workout'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                    Duration: {formatTime(workout.duration || 0)}
                                </Typography>
                                {workout.exercises?.map((exercise, index) => (
                                    <Box key={index} sx={{ ml: 2, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                                            • {exercise.name}
                                        </Typography>
                                        {Array.isArray(exercise.sets) ? (
                                            <Box sx={{ ml: 2 }}>
                                                {exercise.sets.map((set, setIndex) => (
                                                    <Typography key={setIndex} variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                                                        Set {setIndex + 1}: {set.reps || 0} reps
                                                        {set.weightType === 'bodyweight'
                                                            ? ' (Bodyweight)'
                                                            : ` @ ${set.weight || 0}${set.weightUnit || weightUnit}`
                                                        }
                                                    </Typography>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 2 }}>
                                                {exercise.weight || 0}{weightUnit} × {exercise.reps || 0} reps × {exercise.sets || 0} sets
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </DialogContent>
                </Dialog>
            </div>
        </Box>
    );
}