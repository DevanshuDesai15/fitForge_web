import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Chip,
    IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdFilterList,
    MdAdd,
    MdInfo
} from 'react-icons/md';
import { Activity, Target, Weight, BarChart3, Search } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { extractExerciseDataArray } from '../../../utils/exerciseData';
import { getWeightUnit } from '../../../utils/weightUnit';
import { getExerciseLibraryStatsFromWorkouts } from '../../../utils/workoutExerciseHistory';

const EMPTY_LIBRARY_STATS = {
    exercisesTried: 0,
    totalSets: 0,
    totalVolume: 0,
    volumeUnit: 'lbs',
    hasWorkoutData: false,
};

const normalizeExerciseKey = (name) => (name || '').trim().toLowerCase();

const ViewDetailsChip = styled(Chip)(({ theme }) => ({
    backgroundColor: 'rgba(221, 237, 0, 0.118)',
    color: theme.palette.primary.main,
    // fontWeight: 'bold',
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
}));

const StatsCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s ease',
    '&:hover': {
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transform: 'translateY(-2px)',
    },
}));

const IconContainer = styled(Box)(({ iconColor }) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: iconColor || 'rgba(221, 237, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

const ExerciseCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        backgroundColor: 'rgba(221, 237, 0, 0.118)',
        transform: 'translateY(-2px)',
    },
    '&:hover .view-details-chip': {
        opacity: 1,
    }
}));

const CategoryChip = styled(Chip)(({ active }) => ({
    backgroundColor: active ? 'rgba(221, 237, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: active ? '#dded00' : 'rgba(255, 255, 255, 0.7)',
    border: active ? '1px solid rgba(221, 237, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    '&:hover': {
        backgroundColor: active ? 'rgba(221, 237, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
    },
}));

import ExerciseDetailDialog from './ExerciseDetailDialog';

const ExerciseLibraryTab = () => {
    const { currentUser } = useAuth();
    const supabase = useSupabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [exerciseData, setExerciseData] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [libraryStats, setLibraryStats] = useState(EMPTY_LIBRARY_STATS);
    const [workouts, setWorkouts] = useState([]);

    // Dynamically load exercise data on mount
    useEffect(() => {
        import('../../../../UpdatedExerciseData.json').then(module => {
            setExerciseData({ products: extractExerciseDataArray(module.default) });
        });
    }, []);

    useEffect(() => {
        const loadLibraryStats = async () => {
            if (!currentUser?.uid) {
                setLibraryStats(EMPTY_LIBRARY_STATS);
                setWorkouts([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('workouts')
                    .select('id, exercises, weight_unit, timestamp, created_at')
                    .eq('user_id', currentUser.uid)
                    .order('timestamp', { ascending: false });

                if (error) throw error;

                setWorkouts(data || []);
                const displayUnit = getWeightUnit() === 'kg' ? 'kg' : 'lbs';
                setLibraryStats(getExerciseLibraryStatsFromWorkouts(data || [], displayUnit));
            } catch (error) {
                console.error('Error loading exercise library stats:', error);
                setLibraryStats(EMPTY_LIBRARY_STATS);
                setWorkouts([]);
            }
        };

        loadLibraryStats();
    }, [currentUser, supabase]);

    // Build a lookup from exercise id to raw exercise data (for the detail dialog)
    // Must be before the early return to avoid React hooks violation
    const rawExerciseLookup = useMemo(() => {
        const lookup = {};
        if (exerciseData?.products) {
            exerciseData.products.forEach(ex => { lookup[ex.id] = ex; });
        }
        return lookup;
    }, [exerciseData]);

    const userWorkoutHistory = useMemo(() => {
        const historyByExercise = {};
        const displayUnit = getWeightUnit() === 'kg' ? 'kg' : 'lbs';

        workouts.forEach((workout) => {
            const performedAt = workout?.timestamp || workout?.created_at;
            const formattedDate = performedAt
                ? new Date(performedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null;

            (workout?.exercises || []).forEach((exercise) => {
                const exerciseName = exercise?.name || exercise?.exerciseName;
                const exerciseKey = normalizeExerciseKey(exerciseName);

                if (!exerciseKey) return;

                const existing = historyByExercise[exerciseKey] || {
                    setsCompleted: 0,
                    totalReps: 0,
                    totalVolume: 0,
                    lastPerformed: null,
                    lastPerformedAt: null,
                    hasData: false,
                };

                (exercise?.sets || []).forEach((set) => {
                    if (set?.completed === false) return;

                    existing.setsCompleted += 1;

                    const reps = Number(set?.reps);
                    if (Number.isFinite(reps)) {
                        existing.totalReps += reps;
                    }

                    const weight = Number(set?.weight);
                    if (Number.isFinite(weight) && Number.isFinite(reps)) {
                        const setWeightUnit = set?.weightUnit || workout?.weight_unit || displayUnit;
                        const normalizedSetUnit = setWeightUnit === 'kg' ? 'kg' : 'lbs';
                        const convertedWeight = normalizedSetUnit === displayUnit
                            ? weight
                            : Number((normalizedSetUnit === 'kg' ? weight * 2.20462 : weight / 2.20462).toFixed(1));

                        existing.totalVolume += convertedWeight * reps;
                    }
                });

                if (performedAt && (!existing.lastPerformedAt || new Date(performedAt) > new Date(existing.lastPerformedAt))) {
                    existing.lastPerformedAt = performedAt;
                    existing.lastPerformed = formattedDate;
                }

                existing.hasData = existing.setsCompleted > 0;
                historyByExercise[exerciseKey] = existing;
            });
        });

        return Object.fromEntries(
            Object.entries(historyByExercise).map(([key, stats]) => [
                key,
                {
                    setsCompleted: stats.setsCompleted,
                    totalReps: stats.totalReps,
                    volume: stats.totalVolume > 0 ? `${Math.round(stats.totalVolume)}${displayUnit} volume` : null,
                    lastPerformed: stats.lastPerformed,
                    hasData: stats.hasData,
                    isNew: !stats.hasData,
                },
            ])
        );
    }, [workouts]);

    // Show nothing while data is loading
    if (!exerciseData) return null;

    // Map primary muscle to category
    const getCategoryFromMuscle = (primaryMuscle) => {
        if (!primaryMuscle || typeof primaryMuscle !== 'string') return 'Other';
        const muscleToCategory = {
            'Latissimus Dorsi': 'Back', 'Rhomboids': 'Back', 'Trapezius': 'Back', 'Erector Spinae': 'Back',
            'Quadriceps': 'Legs', 'Hamstrings': 'Legs', 'Glutes': 'Legs', 'Calves': 'Legs', 'Gastrocnemius': 'Legs', 'Soleus': 'Legs',
            'Pectorals': 'Chest',
            'Anterior Deltoids': 'Shoulders', 'Posterior Deltoids': 'Shoulders', 'Lateral Deltoids': 'Shoulders', 'Deltoids': 'Shoulders',
            'Biceps': 'Arms', 'Triceps': 'Arms', 'Forearms': 'Arms',
            'Abdominals': 'Core', 'Obliques': 'Core', 'Hip Flexors': 'Core'
        };
        for (const [muscle, category] of Object.entries(muscleToCategory)) {
            if (primaryMuscle.includes(muscle)) return category;
        }
        return 'Other';
    };



    // Transform exercise data from JSON to match our component structure
    const exerciseStats = exerciseData.products.map((exercise) => {
        const userStats = userWorkoutHistory[normalizeExerciseKey(exercise.title)] || {
            setsCompleted: 0,
            totalReps: 0,
            volume: null,
            lastPerformed: null,
            isNew: true,
            hasData: false,
        };

        return {
            id: exercise.id || 'unknown',
            name: exercise.title || 'Unknown Exercise',
            category: getCategoryFromMuscle(exercise.primary_muscle),
            difficulty: exercise.difficulty || 'Beginner',
            primaryMuscle: exercise.primary_muscle || 'Unknown',
            secondaryMuscles: exercise.secondary_muscles || [],
            equipment: exercise.equipment_needed || [],
            description: exercise.description || 'No description available',
            videoUrls: exercise.video_urls || {},
            ...userStats
        };
    });

    const handleExerciseClick = (exerciseId) => {
        const rawExercise = rawExerciseLookup[exerciseId];
        if (rawExercise) {
            setSelectedExercise(rawExercise);
            setDetailOpen(true);
        }
    };

    // Get unique categories from the actual data
    const uniqueCategories = [...new Set(exerciseStats.map(ex => ex.category))].sort();
    const categories = ['All', ...uniqueCategories];

    // Filter exercises
    const filteredExercises = exerciseStats.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exercise.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const totalExercises = exerciseStats.length; // Total exercises in database
    const historyStats = [
        {
            icon: <Target size={20} color="#dded00" />,
            label: 'Exercises Tried',
            value: libraryStats.hasWorkoutData ? libraryStats.exercisesTried : 'No data yet',
            helper: libraryStats.hasWorkoutData ? 'Distinct exercises logged' : 'Log a workout to see the data',
        },
        {
            icon: <Weight size={20} color="#dded00" />,
            label: 'Total Sets',
            value: libraryStats.hasWorkoutData ? libraryStats.totalSets : 'No data yet',
            helper: libraryStats.hasWorkoutData ? 'Completed sets across workouts' : 'Log a workout to see the data',
        },
        {
            icon: <BarChart3 size={20} color="#dded00" />,
            label: 'Total Volume',
            value: libraryStats.hasWorkoutData ? `${libraryStats.totalVolume}${libraryStats.volumeUnit}` : 'No data yet',
            helper: libraryStats.hasWorkoutData ? `Accumulated training volume (${libraryStats.volumeUnit})` : 'Log a workout to see the data',
        }
    ];

    return (
        <Box>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={6} md={3}>
                    <StatsCard sx={{ padding: { xs: '16px', sm: '20px' } }}>
                        <IconContainer iconColor="rgba(221, 237, 0, 0.2)" sx={{
                            width: { xs: '40px', sm: '48px' },
                            height: { xs: '40px', sm: '48px' }
                        }}>
                            <Activity size={20} color="#dded00" />
                        </IconContainer>
                        <Box>
                            <Typography variant="h4" sx={{
                                color: '#fff',
                                fontWeight: 'bold',
                                mb: 0.5,
                                fontSize: { xs: '1.5rem', sm: '2rem' }
                            }}>
                                {totalExercises}
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}>
                                Total Exercises
                            </Typography>
                        </Box>
                    </StatsCard>
                </Grid>
                {historyStats.map((stat) => (
                    <Grid item xs={6} sm={6} md={3} key={stat.label}>
                        <StatsCard sx={{ padding: { xs: '16px', sm: '20px' } }}>
                            <IconContainer iconColor="rgba(221, 237, 0, 0.2)" sx={{
                                width: { xs: '40px', sm: '48px' },
                                height: { xs: '40px', sm: '48px' }
                            }}>
                                {stat.icon}
                            </IconContainer>
                            <Box>
                                <Typography variant="h4" sx={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    mb: 0.5,
                                    fontSize: libraryStats.hasWorkoutData ? { xs: '1.5rem', sm: '2rem' } : { xs: '1rem', sm: '1.2rem' }
                                }}>
                                    {stat.value}
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}>
                                    {stat.label}
                                </Typography>
                                <Typography variant="caption" sx={{
                                    display: 'block',
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    mt: 0.5,
                                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                    maxWidth: '180px'
                                }}>
                                    {stat.helper}
                                </Typography>
                            </Box>
                        </StatsCard>
                    </Grid>
                ))}
            </Grid>

            {/* Search and Filter */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 },
                mb: 3
            }}>
                <Box sx={{
                    position: 'relative',
                    flex: 1,
                    maxWidth: { xs: '100%', sm: '400px' }
                }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            zIndex: 1
                        }}
                    />
                    <TextField
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(40, 40, 40, 0.6)',
                                borderRadius: '8px',
                                height: { xs: '44px', sm: '56px' },
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#dded00',
                                },
                            },
                            '& .MuiOutlinedInput-input': {
                                color: '#fff',
                                paddingLeft: '40px',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                            },
                        }}
                    />
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    justifyContent: { xs: 'space-between', sm: 'flex-end' },
                    width: { xs: '100%', sm: 'auto' }
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<MdFilterList />}
                        sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            padding: { xs: '6px 12px', sm: '8px 16px' },
                            minWidth: { xs: 'auto', sm: '64px' },
                            flex: { xs: 1, sm: 'none' },
                            '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        sx={{
                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            padding: { xs: '6px 12px', sm: '8px 16px' },
                            minWidth: { xs: 'auto', sm: '64px' },
                            flex: { xs: 1, sm: 'none' },
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                            }
                        }}
                    >
                        Add Exercise
                    </Button>
                </Box>
            </Box>

            {/* Category Filter */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 0.5, sm: 1 },
                mb: 3,
                justifyContent: { xs: 'center', sm: 'flex-start' }
            }}>
                {categories.map((category) => (
                    <CategoryChip
                        key={category}
                        label={category}
                        size="small"
                        active={selectedCategory === category}
                        onClick={() => setSelectedCategory(category)}
                        sx={{
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            height: { xs: '24px', sm: '28px' },
                            padding: { xs: '0 8px', sm: '0 12px' }
                        }}
                    />
                ))}
            </Box>

            {/* Exercise Library Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                    Exercise Library
                    <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                        {filteredExercises.length} of {totalExercises} exercises
                    </Typography>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MdInfo size={16} />
                    Click any exercise to view detailed instructions
                </Typography>
            </Box>

            {/* Exercise List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredExercises.map((exercise, index) => (
                    <ExerciseCard key={index} onClick={() => handleExerciseClick(exercise.id)}>
                        <CardContent sx={{ py: 2, px: 3 }}>
                            {/* Top Row: Exercise Name and Category */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 1
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <Typography variant="h6" sx={{
                                        color: '#dded00',
                                        fontSize: { xs: '1rem', sm: '1.1rem' },
                                        fontWeight: 'normal'
                                    }}>
                                        {exercise.name}
                                    </Typography>
                                    <Chip
                                        label={exercise.category}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem',
                                            height: '20px',
                                            display: { xs: 'none', sm: 'inline-flex' }
                                        }}
                                    />
                                    <ViewDetailsChip
                                        className="view-details-chip"
                                        label="View Details"
                                        size="small"
                                    />
                                    {exercise.isNew && (
                                        <Chip
                                            label="New"
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                                color: '#4caf50',
                                                fontSize: '0.7rem',
                                                height: '20px'
                                            }}
                                        />
                                    )}
                                </Box>
                                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                    <MdInfo />
                                </IconButton>
                            </Box>

                            {/* Bottom Row: Performance Data */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                gap: { xs: 1, sm: 3 }
                            }}>
                                {exercise.hasData ? (
                                    <>
                                        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                                            <Typography variant="body2" sx={{
                                                color: 'text.secondary',
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                            }}>
                                                {exercise.setsCompleted} sets completed
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: 'text.secondary',
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                            }}>
                                                {exercise.totalReps} total reps
                                            </Typography>
                                            {exercise.volume && (
                                                <Typography variant="body2" sx={{
                                                    color: 'text.secondary',
                                                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                                }}>
                                                    {exercise.volume}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body2" sx={{
                                            color: 'text.secondary',
                                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {exercise.lastPerformed}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                                            <Typography variant="body2" sx={{
                                                color: 'text.secondary',
                                                fontStyle: 'italic',
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                            }}>
                                                Not performed yet
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: 'text.secondary',
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                display: { xs: 'none', sm: 'block' }
                                            }}>
                                                Not tried yet
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{
                                                borderColor: '#4caf50',
                                                color: '#4caf50',
                                                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                                height: '24px',
                                                minWidth: 'auto',
                                                px: { xs: 1, sm: 1.5 },
                                                '&:hover': {
                                                    borderColor: '#66bb6a',
                                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                }
                                            }}
                                        >
                                            TRY IT OUT!
                                        </Button>
                                    </>
                                )}
                            </Box>

                            {/* Mobile Category Chip */}
                            <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                                <Chip
                                    label={exercise.category}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'text.secondary',
                                        fontSize: '0.65rem',
                                        height: '18px'
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </ExerciseCard>
                ))}
            </Box>

            {/* Performance Insights */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    Performance Insights
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <StatsCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ color: '#dded00', fontWeight: 'bold', mb: 1 }}>
                                    185lb
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Heaviest Lift (Bench Press)
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <StatsCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                                    12
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Most Performed (Squats)
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <StatsCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold', mb: 1 }}>
                                    47.4k
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Highest Volume (Bench Press)
                                </Typography>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                </Grid>
            </Box>

            {/* Load More Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                    variant="outlined"
                    sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        px: 4,
                        py: 1,
                        '&:hover': {
                            borderColor: '#dded00',
                            color: '#dded00',
                        }
                    }}
                >
                    Load More Exercises
                </Button>
            </Box>

            {/* Exercise Detail Dialog */}
            <ExerciseDetailDialog
                open={detailOpen}
                onClose={() => { setDetailOpen(false); setSelectedExercise(null); }}
                exercise={selectedExercise}
            />
        </Box>
    );
};

export default ExerciseLibraryTab;
