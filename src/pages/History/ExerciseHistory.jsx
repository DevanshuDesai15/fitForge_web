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
    Flame,
    ChevronDown,
    MoveDown,
    Weight,
    Trophy,
    Minus,
    MoveUp,
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
import { useUnits } from '../../contexts/UnitsContext';
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
    const { currentUser } = useAuth();
    const { weightUnit, convertWeight } = useUnits();
    const theme = useTheme();

    // Helper function to convert and format weight for display
    const displayWeight = (weight, storedUnit = null) => {
        const numWeight = parseFloat(weight);
        if (isNaN(numWeight) || numWeight === 0) return '0';

        // If no stored unit, assume it's already in current display unit (for old data)
        if (!storedUnit || storedUnit === weightUnit) {
            return numWeight.toFixed(1);
        }

        // Convert from stored unit to current display unit
        return convertWeight(numWeight, storedUnit, weightUnit);
    };

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
                    weightUnit: exercise.sets?.[0]?.weightUnit || workout.weightUnit || 'lbs' // Fallback for old data
                });

                // Calculate max weight and reps (convert to current display unit)
                if (Array.isArray(exercise.sets)) {
                    exercise.sets.forEach(set => {
                        const rawWeight = set.weightType === 'bodyweight' ? 0 : (parseFloat(set.weight) || 0);
                        const storedUnit = set.weightUnit || workout.weightUnit || 'lbs';

                        // Convert to current display unit for comparison
                        const weight = parseFloat(convertWeight(rawWeight, storedUnit, weightUnit)) || 0;
                        const reps = parseInt(set.reps) || 0;

                        if (weight > stats.maxWeight) {
                            stats.maxWeight = weight;
                            stats.maxWeightUnit = storedUnit; // Keep track of original unit
                        }
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
        const totalVolume = exerciseStats.reduce((sum, e) => sum + e.totalVolume, 0);

        // Calculate longest workout streak (consecutive days)
        const workoutDays = [...new Set(
            workouts.map(w => {
                const d = new Date(w.date?.toDate ? w.date.toDate() : w.date);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            })
        )].sort();

        let longestStreak = 0;
        let currentStreak = 1;
        for (let i = 1; i < workoutDays.length; i++) {
            const prev = new Date(workoutDays[i - 1].replace(/-/g, '/'));
            const curr = new Date(workoutDays[i].replace(/-/g, '/'));
            const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        if (workoutDays.length > 0) longestStreak = Math.max(longestStreak, 1);

        const uniqueExercises = exerciseStats.length;
        return { totalSessions, maxWeight, totalVolume, longestStreak, uniqueExercises };
    };

    const getPersonalRecords = () => {
        return exerciseStats
            .filter(e => e.maxWeight > 0)
            .sort((a, b) => b.maxWeight - a.maxWeight)
            .slice(0, 3);
    };

    const getRecentAchievements = () => {
        const achievements = [];

        exerciseStats.forEach(exercise => {
            if (exercise.sessions.length < 2) return;

            const latest = exercise.sessions[0];
            // Convert weights to current display unit before comparing
            const latestMax = Math.max(...latest.sets.map(s => {
                const weight = parseFloat(s.weight) || 0;
                const storedUnit = s.weightUnit || latest.weightUnit || 'lbs';
                return parseFloat(convertWeight(weight, storedUnit, weightUnit)) || 0;
            }));

            const previousMax = Math.max(
                ...exercise.sessions.slice(1).flatMap(s => s.sets.map(set => {
                    const weight = parseFloat(set.weight) || 0;
                    const storedUnit = set.weightUnit || s.weightUnit || 'lbs';
                    return parseFloat(convertWeight(weight, storedUnit, weightUnit)) || 0;
                }))
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

    const formatVolume = (volume) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k`;
        }
        return volume.toFixed(0);
    };

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
                        const trend = getTrendDirection(exercise.name);
                        const TrendIcon = trend === 'up' ? MoveUp : trend === 'down' ? TrendingDown : () => (
                            <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: theme.palette.text.secondary }}>
                                —
                            </Box>
                        );

                        return (
                            <StyledCard key={exercise.name} sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    {/* Header with Exercise Name and Trend */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: '600' }}>
                                                {exercise.name}
                                            </Typography>
                                            {trend === 'up' && <TrendingUp size={18} color="#368739" />}
                                            {trend === 'down' && <TrendingDown size={18} color={theme.palette.status.error} />}
                                            {trend === 'neutral' && <TrendIcon />}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                            Last: {format(new Date(exercise.lastPerformed), 'MMM dd, yyyy')}
                                        </Typography>
                                    </Box>

                                    {/* Stats Grid */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                                        gap: 3,
                                    }}>
                                        {/* Sessions */}
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 0.5 }}>
                                                {exercise.sessions.length}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                Sessions
                                            </Typography>
                                        </Box>

                                        {/* Max Weight */}
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 0.5 }}>
                                                {exercise.maxWeight.toFixed(0)}{weightUnit}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                Max Weight
                                            </Typography>
                                        </Box>

                                        {/* Max Reps */}
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 0.5 }}>
                                                {exercise.maxReps}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                Max Reps
                                            </Typography>
                                        </Box>

                                        {/* Total Volume */}
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 0.5 }}>
                                                {formatVolume(exercise.totalVolume)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                Total Volume
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </StyledCard>
                        );
                    })
                )}
            </Box>
        );
    };

    const renderRecentTab = () => {
        // Group exercises by exercise name and get the most recent workout for each
        const exerciseMap = new Map();

        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                const name = exercise.name;
                if (!exerciseMap.has(name) || workout.timestamp > exerciseMap.get(name).timestamp) {
                    exerciseMap.set(name, {
                        name,
                        sets: exercise.sets || [],
                        weightUnit: exercise.sets?.[0]?.weightUnit || workout.weightUnit || 'lbs', // Store weight unit
                        notes: exercise.notes || '',
                        timestamp: workout.timestamp,
                        workoutId: workout.id,
                    });
                }
            });
        });

        const recentExercises = Array.from(exerciseMap.values())
            .filter(exercise =>
                searchQuery ? exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
            )
            .sort((a, b) => b.timestamp - a.timestamp);

        return (
            <Box>
                {recentExercises.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Calendar size={48} color={theme.palette.surface.hover} style={{ marginBottom: '16px' }} />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                            No recent workouts found
                        </Typography>
                    </Box>
                ) : (
                    recentExercises.map((exercise) => {
                        const trend = getTrendDirection(exercise.name);
                        const isPR = trend === 'up';

                        // Calculate total volume (convert weights to current display unit)
                        const totalVolume = Array.isArray(exercise.sets)
                            ? exercise.sets.reduce((sum, set) => {
                                const rawWeight = set.weightType === 'bodyweight' ? 0 : (parseFloat(set.weight) || 0);
                                const storedUnit = set.weightUnit || exercise.weightUnit || 'lbs';
                                const weight = parseFloat(convertWeight(rawWeight, storedUnit, weightUnit)) || 0;
                                const reps = parseInt(set.reps) || 0;
                                return sum + (weight * reps);
                            }, 0)
                            : 0;

                        return (
                            <StyledCard key={exercise.name} sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    {/* Header with Exercise Name, PR Badge, Trend, and Date */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: '600' }}>
                                                {exercise.name}
                                            </Typography>
                                            {isPR && (
                                                <Chip
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <Trophy size={11} />
                                                            <span>PR</span>
                                                        </Box>
                                                    }
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#695a24a6',
                                                        color: '#ffc800',
                                                        border: '1px solid #ffc800',
                                                        borderRadius: '8px',
                                                        padding: '0 4px',
                                                        fontSize: '0.65rem',
                                                        height: '22px',
                                                        '& .MuiChip-label': {
                                                            px: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }
                                                    }}
                                                />
                                            )}
                                            {trend === 'up' && <MoveUp size={18} color='#368739' />}
                                            {trend === 'neutral' && <Minus size={18} color='#a8a8a8' />}
                                            {trend === 'down' && <MoveDown size={18} color='#ff4444' />}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                            {format(new Date(exercise.timestamp), 'MMM dd, yyyy')}
                                        </Typography>
                                    </Box>

                                    {/* Sets Performed Label */}
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1.5, fontSize: '0.8rem', fontWeight: '500' }}>
                                        Sets Performed:
                                    </Typography>

                                    {/* Sets in Horizontal Grid Layout */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                                        gap: 2,
                                        mb: 2
                                    }}>
                                        {Array.isArray(exercise.sets) && exercise.sets.map((set, setIndex) => (
                                            <Box
                                                key={setIndex}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 0.5,
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: '600', fontSize: '0.95rem' }}>
                                                    {set.reps} reps × {set.weightType === 'bodyweight' ? '0' : displayWeight(set.weight, set.weightUnit)}{weightUnit}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                                    Set {setIndex + 1}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Total Volume */}
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem', mb: exercise.notes ? 1.5 : 0 }}>
                                        Total Volume: <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: '600' }}>{totalVolume.toFixed(0)}{weightUnit}</Box>
                                    </Typography>
                                    {isPR && (
                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, background: '#a7ea091c', borderRadius: '8px', padding: '8px 8px', fontSize: '0.875rem', mb: exercise.notes ? 1.5 : 0, display: 'inline-block' }}>
                                            New PR! Felt strong today! 💪
                                        </Typography>
                                    )}

                                    {/* Notes */}
                                    {exercise.notes && (
                                        <Box sx={{ mt: 2, p: 1.5, background: 'rgba(221, 237, 0, 0.05)', borderRadius: '8px', border: `1px solid ${theme.palette.border.main}` }}>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '0.875rem', fontStyle: 'italic' }}>
                                                {exercise.notes}
                                            </Typography>
                                        </Box>
                                    )}
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
                {/* Personal Records Card */}
                <Box sx={{ background: '#1e1e1e', borderRadius: '16px', p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Trophy size={20} color="#ffc800" />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: '700' }}>
                            Personal Records
                        </Typography>
                    </Box>

                    {personalRecords.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Award size={48} color="#444" style={{ marginBottom: '12px' }} />
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                No personal records yet. Keep training!
                            </Typography>
                        </Box>
                    ) : (
                        personalRecords.map((record, index) => {
                            const latestSession = record.sessions[0];
                            const maxSet = latestSession.sets.reduce((max, set) => {
                                const rawWeight = parseFloat(set.weight) || 0;
                                const storedUnit = set.weightUnit || latestSession.weightUnit || 'lbs';
                                const weight = parseFloat(convertWeight(rawWeight, storedUnit, weightUnit)) || 0;
                                const reps = parseInt(set.reps) || 0;
                                return weight > max.weight ? { weight, reps } : max;
                            }, { weight: 0, reps: 0 });

                            return (
                                <Box key={index}>
                                    {index > 0 && (
                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', my: 2 }} />
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body1" sx={{ color: 'white', mb: 0.25 }}>
                                                {record.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
                                                Max: {maxSet.weight}{weightUnit} × {maxSet.reps} reps
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography sx={{ color: theme.palette.primary.main, fontWeight: '700', fontSize: '1.1rem', lineHeight: 1.2 }}>
                                                {maxSet.weight}{weightUnit}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                                                {format(new Date(record.lastPerformed), 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>

                {/* Recent Achievements Card */}
                <Box sx={{ background: '#1e1e1e', borderRadius: '16px', p: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: '700', mb: 3 }}>
                        Recent Achievements
                    </Typography>

                    {recentAchievements.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Target size={48} color="#444" style={{ marginBottom: '12px' }} />
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                No recent achievements. Keep pushing!
                            </Typography>
                        </Box>
                    ) : (
                        recentAchievements.map((achievement, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    background: '#a7ea091c',
                                    borderRadius: '12px',
                                    px: 2,
                                    py: 1.5,
                                    mb: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: '50%',
                                        background: `${theme.palette.primary.main}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Trophy size={20} color="#000000" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'white', fontWeight: '700', mb: 0.25 }}>
                                        New {achievement.exercise} PR!
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                                        {achievement.weight}{weightUnit} - {format(new Date(achievement.date), 'MMM dd, yyyy')}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
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
                                    <Weight size={24} color={theme.palette.primary.main} />
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
                                    <Flame size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.longestStreak}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Longest Streak
                                    </Typography>
                                </Box>
                            </SummaryCard>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <SummaryCard>
                                <IconContainer>
                                    <BarChart3 size={24} color={theme.palette.primary.main} />
                                </IconContainer>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {stats.uniqueExercises}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                                        Exercises Tracked
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
                <Box sx={{ mb: 4, display: 'flex' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons={false}
                        TabIndicatorProps={{ style: { display: 'none' } }}
                        sx={{
                            background: '#1e1e1e',
                            borderRadius: '50px',
                            padding: '4px',
                            minHeight: '48px',
                            '& .MuiTabs-flexContainer': {
                                alignItems: 'center',
                                height: '100%',
                            },
                            '& .MuiTab-root': {
                                color: 'rgba(255,255,255,0.45)',
                                fontWeight: '600',
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                minHeight: '40px',
                                height: '40px',
                                borderRadius: '50px',
                                transition: 'all 0.2s ease',
                                zIndex: 1,
                                padding: '0 16px',
                                alignItems: 'center',
                                '&:hover': {
                                    color: 'rgba(255,255,255,0.7)',
                                },
                            },
                            '& .Mui-selected': {
                                color: '#ffffff !important',
                                background: '#3a3a3a',
                            },
                        }}
                    >
                        <Tab
                            label="Recent"
                            icon={<Clock size={17} />}
                            iconPosition="start"
                            sx={{ gap: 0.75 }}
                        />
                        <Tab
                            label="Records"
                            icon={<Trophy size={17} />}
                            iconPosition="start"
                            sx={{ gap: 0.75 }}
                        />
                        <Tab
                            label="Stats"
                            icon={<BarChart3 size={17} />}
                            iconPosition="start"
                            sx={{ gap: 0.75 }}
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
