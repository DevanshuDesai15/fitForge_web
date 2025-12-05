import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Tab,
    Tabs,
    IconButton,
    Collapse,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    Divider,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    TrendingDown,
    Award,
    Calendar,
    Dumbbell,
    Target,
    Clock,
    BarChart3,
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getWeightUnit } from '../../utils/weightUnit';
import { format } from 'date-fns';

const StyledCard = styled(Card)(({ theme }) => ({
    background: '#2a2a2a',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.border.primary,
    }
}));

const SummaryCard = styled(Box)(({ theme }) => ({
    background: '#2a2a2a',
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${theme.palette.border.main}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.border.primary,
    }
}));

const IconContainer = styled(Box)(({ theme }) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: `rgba(221, 237, 0, 0.15)`, // Primary color with 15% opacity
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

export default function ExerciseHistory() {
    const [activeTab, setActiveTab] = useState(0);
    const [workouts, setWorkouts] = useState([]);
    const [exerciseStats, setExerciseStats] = useState([]);
    const [expandedExercises, setExpandedExercises] = useState(new Set());
    const [expandedWorkouts, setExpandedWorkouts] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnitState] = useState('kg');
    const { currentUser } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        setWeightUnitState(getWeightUnit());

        const handleStorageChange = (e) => {
            if (e.key === 'weightUnit') {
                setWeightUnitState(e.newValue || 'kg');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const loadWorkouts = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        setError('');
        try {
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', currentUser.uid),
                where('completed', '==', true),
                orderBy('timestamp', 'desc')
            );
            const workoutDocs = await getDocs(workoutsQuery);
            const workoutData = workoutDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWorkouts(workoutData);

            // Process exercise statistics
            processExerciseStats(workoutData);
        } catch (err) {
            console.error('Error loading workouts:', err);
            setError('Error loading history: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            loadWorkouts();
        }
    }, [currentUser, loadWorkouts]);

    const processExerciseStats = (workoutData) => {
        const exerciseMap = new Map();

        workoutData.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                const name = exercise.name;
                if (!exerciseMap.has(name)) {
                    exerciseMap.set(name, {
                        name,
                        sessions: [],
                        maxWeight: 0,
                        maxReps: 0,
                        totalVolume: 0,
                        lastPerformed: workout.timestamp,
                    });
                }

                const stats = exerciseMap.get(name);
                stats.sessions.push({
                    date: workout.timestamp,
                    sets: exercise.sets || [],
                    workoutId: workout.id,
                });

                // Calculate max weight and reps
                if (Array.isArray(exercise.sets)) {
                    exercise.sets.forEach(set => {
                        const weight = set.weightType === 'bodyweight' ? 0 : (parseFloat(set.weight) || 0);
                        const reps = parseInt(set.reps) || 0;

                        if (weight > stats.maxWeight) stats.maxWeight = weight;
                        if (reps > stats.maxReps) stats.maxReps = reps;
                        stats.totalVolume += weight * reps;
                    });
                }
            });
        });

        const statsArray = Array.from(exerciseMap.values())
            .sort((a, b) => b.lastPerformed - a.lastPerformed);

        setExerciseStats(statsArray);
    };

    const getTrendDirection = (exerciseName) => {
        const sessions = exerciseStats.find(e => e.name === exerciseName)?.sessions || [];
        if (sessions.length < 2) return 'neutral';

        const latest = sessions[0].sets[0]?.weight || 0;
        const previous = sessions[1].sets[0]?.weight || 0;

        if (latest > previous) return 'up';
        if (latest < previous) return 'down';
        return 'neutral';
    };

    const toggleExerciseExpanded = (exerciseName) => {
        setExpandedExercises(prev => {
            const newSet = new Set(prev);
            if (newSet.has(exerciseName)) {
                newSet.delete(exerciseName);
            } else {
                newSet.add(exerciseName);
            }
            return newSet;
        });
    };

    const toggleWorkoutExpanded = (workoutId) => {
        setExpandedWorkouts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(workoutId)) {
                newSet.delete(workoutId);
            } else {
                newSet.add(workoutId);
            }
            return newSet;
        });
    };

    const getOverallStats = () => {
        const totalSessions = workouts.length;
        const maxWeight = Math.max(...exerciseStats.map(e => e.maxWeight), 0);
        const totalPRs = exerciseStats.filter(e => e.sessions.length > 0 &&
            e.sessions[0].sets[0]?.weight === e.maxWeight).length;
        const totalVolume = exerciseStats.reduce((sum, e) => sum + e.totalVolume, 0);

        return { totalSessions, maxWeight, totalPRs, totalVolume };
    };

    const getPersonalRecords = () => {
        return exerciseStats
            .filter(e => e.maxWeight > 0)
            .sort((a, b) => b.maxWeight - a.maxWeight)
            .slice(0, 5);
    };

    const getRecentAchievements = () => {
        const achievements = [];

        exerciseStats.forEach(exercise => {
            if (exercise.sessions.length < 2) return;

            const latest = exercise.sessions[0];
            const latestMax = Math.max(...latest.sets.map(s => parseFloat(s.weight) || 0));

            const previousMax = Math.max(
                ...exercise.sessions.slice(1).flatMap(s => s.sets.map(set => parseFloat(set.weight) || 0))
            );

            if (latestMax > previousMax) {
                achievements.push({
                    type: 'pr',
                    exercise: exercise.name,
                    weight: latestMax,
                    date: latest.date,
                    improvement: latestMax - previousMax,
                });
            }
        });

        return achievements.sort((a, b) => b.date - a.date).slice(0, 10);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const filteredExercises = exerciseStats.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredWorkouts = workouts.filter(workout =>
        workout.exercises?.some(ex =>
            ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const renderStatsTab = () => {
        return (
            <Box>
                {/* Exercise List */}
                {filteredExercises.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Dumbbell size={48} color={theme.palette.surface.hover} style={{ marginBottom: '16px' }} />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            No exercises found
                        </Typography>
                    </Box>
                ) : (
                    filteredExercises.map((exercise) => {
                        const isExpanded = expandedExercises.has(exercise.name);
                        const trend = getTrendDirection(exercise.name);

                        return (
                            <StyledCard key={exercise.name} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => toggleExerciseExpanded(exercise.name)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                {exercise.name}
                                            </Typography>
                                            {trend === 'up' && <TrendingUp size={18} color={theme.palette.status.success} />}
                                            {trend === 'down' && <TrendingDown size={18} color={theme.palette.status.error} />}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {format(new Date(exercise.lastPerformed), 'MMM dd, yyyy')}
                                            </Typography>
                                            <IconButton size="small">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Collapse in={isExpanded}>
                                        <Box sx={{ mt: 2 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                            Sessions
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                            {exercise.sessions.length}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                            Max Weight
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                            {exercise.maxWeight.toFixed(0)}{weightUnit}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                            Max Reps
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                            {exercise.maxReps}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                            Total Volume
                                                        </Typography>
                                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                            {exercise.totalVolume.toFixed(0)}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </StyledCard>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderRecentTab = () => {
        return (
            <Box>
                {filteredWorkouts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Calendar size={48} color={theme.palette.surface.hover} style={{ marginBottom: '16px' }} />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            No recent workouts found
                        </Typography>
                    </Box>
                ) : (
                    filteredWorkouts.map((workout) => {
                        const isExpanded = expandedWorkouts.has(workout.id);

                        return (
                            <StyledCard key={workout.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => toggleWorkoutExpanded(workout.id)}
                                    >
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {format(new Date(workout.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                        <IconButton size="small">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={isExpanded}>
                                        <Box sx={{ mt: 2 }}>
                                            {workout.exercises?.map((exercise, index) => {
                                                const totalVolume = Array.isArray(exercise.sets)
                                                    ? exercise.sets.reduce((sum, set) => {
                                                        const weight = set.weightType === 'bodyweight' ? 0 : (parseFloat(set.weight) || 0);
                                                        const reps = parseInt(set.reps) || 0;
                                                        return sum + (weight * reps);
                                                    }, 0)
                                                    : 0;

                                                return (
                                                    <Box key={index} sx={{ mb: 2, p: 2, background: '#1e1e1e', borderRadius: '12px', border: `1px solid ${theme.palette.border.main}` }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                            <Typography variant="body1" sx={{ color: theme.palette.primary.main, fontWeight: '600' }}>
                                                                {exercise.name}
                                                            </Typography>
                                                            {getTrendDirection(exercise.name) === 'up' && (
                                                                <Chip
                                                                    label="PR"
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: theme.palette.primary.main,
                                                                        color: '#121212',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.7rem',
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>

                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontSize: '0.75rem' }}>
                                                            Sets Performed:
                                                        </Typography>

                                                        {Array.isArray(exercise.sets) && exercise.sets.map((set, setIndex) => (
                                                            <Typography key={setIndex} variant="body2" sx={{ color: theme.palette.text.primary, ml: 2, mb: 0.5, fontSize: '0.875rem' }}>
                                                                {set.reps} reps × {set.weightType === 'bodyweight' ? 'Bodyweight' : `${set.weight}${set.weightUnit || weightUnit}`} - Set {setIndex + 1}
                                                            </Typography>
                                                        ))}

                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1.5, fontSize: '0.875rem' }}>
                                                            Total Volume: {totalVolume.toFixed(0)}{weightUnit}
                                                        </Typography>

                                                        {exercise.notes && (
                                                            <Box sx={{ mt: 1.5, p: 1.5, background: '#121212', borderRadius: '8px', border: `1px solid ${theme.palette.border.main}` }}>
                                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                                                    Notes:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '0.875rem' }}>
                                                                    {exercise.notes}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </StyledCard>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderRecordsTab = () => {
        const personalRecords = getPersonalRecords();
        const recentAchievements = getRecentAchievements();

        return (
            <Box>
                {/* Personal Records Section */}
                <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2, fontWeight: 'bold' }}>
                    Personal Records
                </Typography>

                {personalRecords.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, mb: 4 }}>
                        <Award size={48} color={theme.palette.surface.hover} style={{ marginBottom: '16px' }} />
                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                            No personal records yet. Keep training!
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ mb: 4 }}>
                        {personalRecords.map((record, index) => {
                            const latestSession = record.sessions[0];
                            const maxSet = latestSession.sets.reduce((max, set) => {
                                const weight = parseFloat(set.weight) || 0;
                                const reps = parseInt(set.reps) || 0;
                                return weight > max.weight ? { weight, reps } : max;
                            }, { weight: 0, reps: 0 });

                            return (
                                <StyledCard key={index} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                                    {record.name}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                                                    Max: {maxSet.weight}{weightUnit} × {maxSet.reps} reps
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {format(new Date(record.lastPerformed), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StyledCard>
                            );
                        })}
                    </Box>
                )}

                <Divider sx={{ my: 3, bgcolor: theme.palette.border.main }} />

                {/* Recent Achievements Section */}
                <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2, fontWeight: 'bold' }}>
                    Recent Achievements
                </Typography>

                {recentAchievements.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Target size={48} color={theme.palette.surface.hover} style={{ marginBottom: '16px' }} />
                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                            No recent achievements. Keep pushing!
                        </Typography>
                    </Box>
                ) : (
                    recentAchievements.map((achievement, index) => (
                        <StyledCard key={index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: theme.palette.primary.main,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Award size={20} color="#121212" />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                                            New {achievement.exercise} PR
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                                            {achievement.weight}{weightUnit} (+{achievement.improvement.toFixed(1)}{weightUnit})
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            {format(new Date(achievement.date), 'MMM dd, yyyy')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </StyledCard>
                    ))
                )}
            </Box>
        );
    };

    const stats = getOverallStats();

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
            pb: '80px', // Add padding for mobile navigation
        }}>
            <div className="max-w-4xl mx-auto">
                {/* Page Title */}
                <Typography
                    variant="h4"
                    sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                >
                    Exercise History
                </Typography>

                {/* Subtitle */}
                <Typography
                    variant="body1"
                    sx={{
                        color: theme.palette.text.secondary,
                        mb: 4,
                        fontSize: '0.95rem'
                    }}
                >
                    Track your exercise performance, records, and progress over time
                </Typography>

                {/* Summary Cards - Visible for all tabs */}
                {!loading && !error && (
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6} md={3}>
                            <SummaryCard>
                                <IconContainer>
                                    <Dumbbell size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.totalSessions}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Total Sessions
                                    </Typography>
                                </Box>
                            </SummaryCard>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <SummaryCard>
                                <IconContainer>
                                    <TrendingUp size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.maxWeight.toFixed(0)}{weightUnit}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Max Weight
                                    </Typography>
                                </Box>
                            </SummaryCard>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <SummaryCard>
                                <IconContainer>
                                    <Award size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.totalPRs}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Personal Records
                                    </Typography>
                                </Box>
                            </SummaryCard>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <SummaryCard>
                                <IconContainer>
                                    <Target size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.totalVolume.toFixed(0)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Total Volume
                                    </Typography>
                                </Box>
                            </SummaryCard>
                        </Grid>
                    </Grid>
                )}

                {/* Search Bar */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: '#2a2a2a',
                                borderRadius: '16px',
                                '& fieldset': {
                                    borderColor: theme.palette.border.main,
                                },
                                '&:hover fieldset': {
                                    borderColor: theme.palette.border.primary,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                            },
                        }}
                    />
                    <IconButton
                        sx={{
                            background: '#2a2a2a',
                            borderRadius: '16px',
                            border: `1px solid ${theme.palette.border.main}`,
                            width: '56px',
                            height: '56px',
                            '&:hover': {
                                background: '#3a3a3a',
                                borderColor: theme.palette.border.primary,
                            },
                        }}
                    >
                        <Filter size={20} />
                    </IconButton>
                </Box>

                {/* Tabs with Icons */}
                <Box sx={{ mb: 4 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            background: '#2a2a2a',
                            borderRadius: '16px',
                            padding: '4px',
                            minHeight: '56px',
                            '& .MuiTab-root': {
                                color: theme.palette.text.muted,
                                fontWeight: '600',
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                minHeight: '48px',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.05)',
                                },
                            },
                            '& .Mui-selected': {
                                color: `${theme.palette.primary.main} !important`,
                                background: 'rgba(221, 237, 0, 0.1)',
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: theme.palette.primary.main,
                                height: '3px',
                                borderRadius: '3px 3px 0 0',
                            },
                        }}
                    >
                        <Tab
                            label="Recent"
                            icon={<Clock size={20} />}
                            iconPosition="start"
                            sx={{ gap: 1 }}
                        />
                        <Tab
                            label="Records"
                            icon={<Award size={20} />}
                            iconPosition="start"
                            sx={{ gap: 1 }}
                        />
                        <Tab
                            label="Stats"
                            icon={<BarChart3 size={20} />}
                            iconPosition="start"
                            sx={{ gap: 1 }}
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                        <CircularProgress sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body1" sx={{ color: theme.palette.status.error }}>
                            {error}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {activeTab === 0 && renderRecentTab()}
                        {activeTab === 1 && renderRecordsTab()}
                        {activeTab === 2 && renderStatsTab()}
                    </>
                )}
            </div>
        </Box>
    );
}
