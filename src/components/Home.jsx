import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid2,
    Button,
    Chip,
    Avatar,
    LinearProgress,
    Alert,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    MdFitnessCenter,
    MdHistory,
    MdTrendingUp,
    MdPlayArrow,
    MdAdd,
    MdShowChart,
    MdCalendarToday,
    MdTimer,
    MdEmojiEvents,
    MdPerson
} from "react-icons/md";
import { getWeightUnit } from '../utils/weightUnit';
import { format, isToday, isThisWeek } from 'date-fns';

const StyledCard = styled(Card)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(221, 237, 0, 0.15)',
    border: '1px solid rgba(221, 237, 0, 0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 50px rgba(221, 237, 0, 0.25)',
    },
}));

const HeroCard = styled(Card)(() => ({
    background: '#282828',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(221, 237, 0, 0.3)',
    padding: '2rem',
    marginBottom: '2rem',
}));

const QuickActionCard = styled(Card)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1) 0%, rgba(221, 237, 0, 0.05) 100%)',
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

const StatCard = styled(Card)(() => ({
    background: '#282828',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
}));

export default function Home() {
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalExercises: 0,
        totalWeight: 0,
        thisWeekWorkouts: 0,
        currentStreak: 0
    });
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [recentExercises, setRecentExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnitState] = useState('kg');
    const [userData, setUserData] = useState({ username: '', fullName: '' });

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
            loadUserData();
        }
        setWeightUnitState(getWeightUnit());

        const handleStorageChange = (e) => {
            if (e.key === 'weightUnit') {
                setWeightUnitState(e.newValue || 'kg');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentUser]);

    const loadUserData = async () => {
        try {
            const userDoc = await getDocs(query(
                collection(db, 'users'),
                where('__name__', '==', currentUser.uid)
            ));

            if (!userDoc.empty) {
                const data = userDoc.docs[0].data();
                setUserData({
                    username: data.username || 'Fitness Enthusiast',
                    fullName: data.fullName || currentUser.email?.split('@')[0] || 'User'
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load workouts
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc')
            );
            const workoutDocs = await getDocs(workoutsQuery);
            const workouts = workoutDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load exercises
            const exercisesQuery = query(
                collection(db, 'exercises'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(10)
            );
            const exerciseDocs = await getDocs(exercisesQuery);
            const exercises = exerciseDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate stats
            const thisWeekWorkouts = workouts.filter(w =>
                isThisWeek(new Date(w.timestamp), { weekStartsOn: 1 })
            ).length;

            const totalWeight = exercises.reduce((sum, ex) => {
                if (ex.sets && Array.isArray(ex.sets)) {
                    return sum + ex.sets.reduce((setSum, set) => setSum + ((set.weight || 0) * (set.reps || 0)), 0);
                }
                return sum + ((ex.weight || 0) * (ex.reps || 0) * (ex.sets || 1));
            }, 0);

            // Calculate current streak (consecutive days with workouts)
            let streak = 0;
            const sortedWorkouts = workouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const uniqueDays = [...new Set(sortedWorkouts.map(w =>
                format(new Date(w.timestamp), 'yyyy-MM-dd')
            ))];

            for (let i = 0; i < uniqueDays.length; i++) {
                const dayDate = new Date(uniqueDays[i]);
                const expectedDate = new Date();
                expectedDate.setDate(expectedDate.getDate() - i);

                if (format(dayDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
                    streak++;
                } else {
                    break;
                }
            }

            setStats({
                totalWorkouts: workouts.length,
                totalExercises: exercises.length,
                totalWeight: totalWeight,
                thisWeekWorkouts: thisWeekWorkouts,
                currentStreak: streak
            });

            setRecentWorkouts(workouts.slice(0, 5));
            setRecentExercises(exercises.slice(0, 5));

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Start Workout',
            subtitle: 'Begin your training session',
            icon: MdPlayArrow,
            color: 'primary.main',
            gradient: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
            onClick: () => navigate('/workout/start')
        },
        {
            title: 'Quick Add Exercise',
            subtitle: 'Log a single exercise',
            icon: MdAdd,
            color: 'info.main',
            gradient: 'linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)',
            onClick: () => navigate('/workout/quick-add')
        },
        {
            title: 'View Progress',
            subtitle: 'Track your improvements',
            icon: MdShowChart,
            color: 'actions.quickAdd',
            gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            onClick: () => navigate('/progress')
        },
        {
            title: 'Workout Templates',
            subtitle: 'Manage your routines',
            icon: MdCalendarToday,
            color: 'actions.templates',
            gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            onClick: () => navigate('/workout/templates')
        }
    ];

    const formatExerciseSummary = (exercise) => {
        if (exercise.sets && Array.isArray(exercise.sets)) {
            const totalSets = exercise.sets.length;
            const totalReps = exercise.sets.reduce((sum, set) => sum + (parseInt(set.reps) || 0), 0);
            const avgWeight = exercise.sets.reduce((sum, set) => sum + (parseFloat(set.weight) || 0), 0) / totalSets;
            return `${avgWeight.toFixed(1)}${getWeightUnit()} × ${totalReps / totalSets} reps × ${totalSets} sets`;
        }
        return `${exercise.weight}${getWeightUnit()} × ${exercise.reps} reps × ${exercise.sets} sets`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const displayName = userData.fullName || userData.username || currentUser?.email?.split('@')[0] || 'Athlete';

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-6xl mx-auto">
                {error && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: (theme) => theme.palette.status.error }}>
                        {error}
                    </Alert>
                )}

                {/* Hero Welcome Section */}
                <HeroCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Avatar
                                sx={{
                                    width: 64,
                                    height: 64,
                                    background: 'linear-gradient(135deg, #dded00 0%, #e8f15d 100%)',
                                    color: '#000',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {userData.fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" sx={{
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #dded00 0%, #e8f15d 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {getGreeting()}, {displayName}!
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'text.muted' }}>
                                    Ready to crush your fitness goals today?
                                </Typography>
                            </Box>
                        </Box>

                        {stats.currentStreak > 0 && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                    {stats.currentStreak}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Day Streak 🔥
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </HeroCard>

                {/* Quick Actions Grid */}
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}>
                    Quick Actions
                </Typography>
                <Grid2 container spacing={3} sx={{ mb: 4, width: '100%' }}>
                    {quickActions.map((action, index) => (
                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                            <QuickActionCard onClick={action.onClick}>
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            background: action.gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem',
                                            color: '#000'
                                        }}
                                    >
                                        <action.icon size={28} />
                                    </Box>
                                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 0.5 }}>
                                        {action.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {action.subtitle}
                                    </Typography>
                                </CardContent>
                            </QuickActionCard>
                        </Grid2>
                    ))}
                </Grid2>

                {/* Stats Overview */}
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}>
                    Your Stats
                </Typography>
                <Grid2 container spacing={3} sx={{ mb: 4, width: '100%' }}>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MdFitnessCenter style={{ color: 'var(--mui-palette-primary-main)', fontSize: '2rem' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        {stats.totalWorkouts}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Total Workouts
                                    </Typography>
                                </Box>
                            </Box>
                        </StatCard>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MdTrendingUp style={{ color: '#ff9800', fontSize: '2rem' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                                        {stats.totalWeight.toFixed(0)}{weightUnit}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Total Weight Lifted
                                    </Typography>
                                </Box>
                            </Box>
                        </StatCard>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MdCalendarToday style={{ color: '#9c27b0', fontSize: '2rem' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                                        {stats.thisWeekWorkouts}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        This Week
                                    </Typography>
                                </Box>
                            </Box>
                        </StatCard>
                    </Grid2>
                    <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MdEmojiEvents style={{ color: '#ffc107', fontSize: '2rem' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
                                        {stats.totalExercises}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Total Exercises
                                    </Typography>
                                </Box>
                            </Box>
                        </StatCard>
                    </Grid2>
                </Grid2>

                {/* Recent Activity */}
                <Grid2 container spacing={3} sx={{ width: '100%' }}>
                    {/* Recent Workouts */}
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <StyledCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdHistory /> Recent Workouts
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={() => navigate('/history')}
                                        sx={{ color: 'primary.main' }}
                                    >
                                        View All
                                    </Button>
                                </Box>

                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress sx={{ color: 'primary.main' }} />
                                    </Box>
                                ) : recentWorkouts.length === 0 ? (
                                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                                        No workouts yet. Start your first workout!
                                    </Typography>
                                ) : (
                                    recentWorkouts.map((workout, index) => (
                                        <Box key={workout.id} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                        {workout.templateInfo?.templateName || 'Custom Workout'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {workout.exercises?.length || 0} exercises • {Math.floor(workout.duration / 60)}min
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {isToday(new Date(workout.timestamp)) ? 'Today' :
                                                        format(new Date(workout.timestamp), 'MMM dd')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid2>

                    {/* Recent Exercises */}
                    <Grid2 size={{ xs: 12, md: 6 }}>
                        <StyledCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdFitnessCenter /> Recent Exercises
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={() => navigate('/progress')}
                                        sx={{ color: 'primary.main' }}
                                    >
                                        View Progress
                                    </Button>
                                </Box>

                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress sx={{ color: 'primary.main' }} />
                                    </Box>
                                ) : recentExercises.length === 0 ? (
                                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                                        No exercises logged yet.
                                    </Typography>
                                ) : (
                                    recentExercises.map((exercise) => (
                                        <Box key={exercise.id} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                                        {exercise.exerciseName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {formatExerciseSummary(exercise)}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {isToday(new Date(exercise.timestamp)) ? 'Today' :
                                                        format(new Date(exercise.timestamp), 'MMM dd')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </CardContent>
                        </StyledCard>
                    </Grid2>
                </Grid2>
            </div>
        </Box>
    );
} 