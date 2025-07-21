import { useState, useEffect } from 'react';
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdCalendarMonth,
    MdHistory,
    MdFitnessCenter,
    MdTimer,
    MdToday,
    MdChevronLeft,
    MdChevronRight,
    MdTrendingUp,
    MdBarChart,
    MdClose,
    MdPlayArrow,
    MdAdd
} from 'react-icons/md';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getWeightUnit } from '../utils/weightUnit';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek
} from 'date-fns';

const StyledCard = styled(Card)(() => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const CalendarDay = styled(Box, {
    shouldForwardProp: (prop) => !['isWorkoutDay', 'isToday', 'isCurrentMonth'].includes(prop),
})(({ isWorkoutDay, isToday, isCurrentMonth }) => ({
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative',
    color: isCurrentMonth ? '#fff' : 'rgba(255, 255, 255, 0.3)',
    backgroundColor: isWorkoutDay ? 'rgba(0, 255, 159, 0.3)' : 'transparent',
    border: isToday ? '2px solid #00ff9f' : 'none',
    '&:hover': {
        backgroundColor: isWorkoutDay
            ? 'rgba(0, 255, 159, 0.5)'
            : 'rgba(255, 255, 255, 0.1)',
    },
}));

const StatCard = styled(Card)(() => ({
    background: 'rgba(0, 255, 159, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 255, 159, 0.1)',
}));

export default function History() {
    const [activeTab, setActiveTab] = useState(0);
    const [workouts, setWorkouts] = useState([]);
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const [workoutDates, setWorkoutDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnitState] = useState('kg');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateWorkouts, setSelectedDateWorkouts] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [activeTab]);

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

    const loadData = async () => {
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
    };

    const loadWorkoutDates = async () => {
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
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleDateClick = (date) => {
        const dayWorkouts = workouts.filter(workout =>
            isSameDay(new Date(workout.timestamp), date)
        );

        if (dayWorkouts.length > 0) {
            setSelectedDate(date);
            setSelectedDateWorkouts(dayWorkouts);
            setDialogOpen(true);
        }
    };

    const isWorkoutDay = (date) => {
        return workoutDates.some(workoutDate =>
            isSameDay(new Date(workoutDate), date)
        );
    };

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
        const totalWeight = exerciseHistory.reduce((sum, ex) => sum + (parseFloat(ex.weight) || 0), 0);
        const totalReps = exerciseHistory.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0);

        return {
            totalExercises,
            uniqueExercises,
            totalWeight,
            totalReps
        };
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <Box>
                {/* Calendar Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))} sx={{ color: '#00ff9f' }}>
                        <MdChevronLeft />
                    </IconButton>
                    <Typography variant="h5" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                        {format(currentDate, 'MMMM yyyy')}
                    </Typography>
                    <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))} sx={{ color: '#00ff9f' }}>
                        <MdChevronRight />
                    </IconButton>
                </Box>

                {/* Week Days Header */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                    {weekDays.map(day => (
                        <Box key={day} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                {day}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Calendar Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                    {dateRange.map(date => (
                        <Box key={date.toString()} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Tooltip
                                title={isWorkoutDay(date) ? 'Click to view workouts' : ''}
                                arrow
                            >
                                <CalendarDay
                                    isWorkoutDay={isWorkoutDay(date)}
                                    isToday={isToday(date)}
                                    isCurrentMonth={isSameMonth(date, currentDate)}
                                    onClick={() => handleDateClick(date)}
                                >
                                    {format(date, 'd')}
                                </CalendarDay>
                            </Tooltip>
                        </Box>
                    ))}
                </Box>

                {/* Calendar Legend */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 255, 159, 0.3)'
                        }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Workout Day
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: '2px solid #00ff9f'
                        }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Today
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

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
                                    <MdFitnessCenter style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.totalWorkouts}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Total Workouts
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTimer style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {formatTime(Math.round(stats.avgDuration))}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Avg Duration
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {formatTime(stats.totalDuration)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Total Time
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdBarChart style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.totalExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
                        background: 'rgba(0, 255, 159, 0.03)',
                        borderRadius: 2,
                        border: '1px solid rgba(0, 255, 159, 0.1)'
                    }}>
                        <MdFitnessCenter
                            style={{
                                fontSize: '4rem',
                                color: 'rgba(0, 255, 159, 0.5)',
                                marginBottom: '1rem'
                            }}
                        />
                        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                            No workouts yet. Start your first workout!
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Track your fitness journey by logging your first workout session.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<MdPlayArrow />}
                            onClick={() => navigate('/workout/start')}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
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
                                        <Typography variant="h6" sx={{ color: '#00ff9f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MdToday /> {format(new Date(workout.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                        <Chip
                                            icon={<MdTimer />}
                                            label={formatTime(workout.duration)}
                                            sx={{
                                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                color: '#00ff9f',
                                                '& .MuiChip-icon': { color: '#00ff9f' }
                                            }}
                                        />
                                    </Box>
                                    <Divider sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                    {workout.exercises?.map((exercise, index) => (
                                        <Box key={index} sx={{ mb: 1 }}>
                                            <Typography sx={{ color: '#fff' }}>
                                                {exercise.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {`${exercise.weight}${weightUnit} × ${exercise.reps} reps × ${exercise.sets} sets`}
                                            </Typography>
                                            {exercise.notes && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
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
                                    <MdFitnessCenter style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.totalExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Total Exercises
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdBarChart style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.uniqueExercises}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Unique Exercises
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.totalWeight.toFixed(0)}{weightUnit}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Total Weight
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTimer style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {stats.totalReps}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
                        background: 'rgba(0, 255, 159, 0.03)',
                        borderRadius: 2,
                        border: '1px solid rgba(0, 255, 159, 0.1)'
                    }}>
                        <MdAdd
                            style={{
                                fontSize: '4rem',
                                color: 'rgba(0, 255, 159, 0.5)',
                                marginBottom: '1rem'
                            }}
                        />
                        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                            No exercises logged yet. Start tracking your progress!
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Log your first exercise to begin building your fitness history.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<MdAdd />}
                            onClick={() => navigate('/workout/quick-add')}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
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
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {exercise.exerciseName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {format(new Date(exercise.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ color: '#fff' }}>
                                        {`${exercise.weight}${weightUnit} × ${exercise.reps} reps × ${exercise.sets} sets`}
                                    </Typography>
                                    {exercise.notes && (
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
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
                    Workout History
                </Typography>

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#00ff9f !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#00ff9f' },
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
                                <CircularProgress sx={{ color: '#00ff9f' }} />
                            </Box>
                        ) : error ? (
                            <Typography variant="body1" sx={{ color: '#ff4444' }}>
                                {error}
                            </Typography>
                        ) : (
                            <>
                                {activeTab === 0 && renderCalendar()}
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
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 255, 159, 0.2)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Workouts on {selectedDate && format(selectedDate, 'MMM dd, yyyy')}
                        <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#fff' }}>
                            <MdClose />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {selectedDateWorkouts.map((workout, index) => (
                            <Box key={workout.id} sx={{ mb: index < selectedDateWorkouts.length - 1 ? 3 : 0 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: '#fff' }}>
                                        Workout {index + 1}
                                    </Typography>
                                    <Chip
                                        icon={<MdTimer />}
                                        label={formatTime(workout.duration)}
                                        sx={{
                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                            color: '#00ff9f',
                                        }}
                                    />
                                </Box>
                                {workout.exercises?.map((exercise, exIndex) => (
                                    <Box key={exIndex} sx={{ mb: 1, pl: 2 }}>
                                        <Typography sx={{ color: '#fff' }}>
                                            {exercise.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {`${exercise.weight}${weightUnit} × ${exercise.reps} reps × ${exercise.sets} sets`}
                                        </Typography>
                                        {exercise.notes && (
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                Note: {exercise.notes}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                                {index < selectedDateWorkouts.length - 1 && (
                                    <Divider sx={{ mt: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                )}
                            </Box>
                        ))}
                    </DialogContent>
                </Dialog>
            </div>
        </Box>
    );
}