import { useState, useEffect } from 'react';
import exerciseData from '../../MergedData.json';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid2,
    Chip,
    Button,
    Tabs,
    Tab,
    LinearProgress,
    TextField,
    InputAdornment,
    IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdPlayArrow,
    MdTimer,
    MdAdd,
    MdAutoAwesome,
    MdSearch,
    MdFilterList,
    MdInfo
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Clock, TrendingUp, Activity, Target, Dumbbell, BarChart3, Weight } from 'lucide-react';

// Workout card styling
const WorkoutCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%', // Ensure all cards have same height
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

// AI Pick badge styling
const AIPick = styled(Chip)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.2) 0%, rgba(221, 237, 0, 0.1) 100%)',
    color: 'var(--primary-a0)',
    border: '1px solid rgba(221, 237, 0, 0.3)',
    fontSize: '0.75rem',
    height: 24,
    '& .MuiChip-icon': {
        color: 'var(--primary-a0)',
    },
}));

// Section container
const SectionContainer = styled(Box)(() => ({
    marginBottom: '2rem',
}));

// AI Recommendations container
const AIRecommendationsCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '2rem',
}));

// Weekly Performance Chart Container
const ChartContainer = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

// Stats card for Exercise Library
const StatsCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
    },
}));

// Exercise card for library
const ExerciseCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

// Category filter chip
const CategoryChip = styled(Chip)(({ active }) => ({
    backgroundColor: active ? 'var(--primary-a0)' : 'rgba(255, 255, 255, 0.1)',
    color: active ? '#000' : 'rgba(255, 255, 255, 0.8)',
    border: `1px solid ${active ? 'var(--primary-a0)' : 'rgba(255, 255, 255, 0.2)'}`,
    fontWeight: 'bold',
    '&:hover': {
        backgroundColor: active ? 'var(--primary-a10)' : 'rgba(255, 255, 255, 0.15)',
    },
}));

export default function Workout() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // State management
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [displayLimit, setDisplayLimit] = useState(20); // Show 20 exercises initially

    // Sample workout data - replace with actual data loading
    const recommendedWorkouts = [
        {
            id: 1,
            title: 'Upper Body Strength',
            category: 'Strength Training',
            duration: 45,
            exercises: 8,
            difficulty: 'Intermediate',
            progress: 65,
            isAiPick: true,
            canContinue: true
        },
        {
            id: 2,
            title: 'HIIT Cardio Blast',
            category: 'Cardio',
            duration: 20,
            exercises: 6,
            difficulty: 'Advanced',
            progress: 0,
            isAiPick: true,
            canContinue: false
        }
    ];

    const allWorkouts = [
        ...recommendedWorkouts,
        {
            id: 3,
            title: 'Full Body Beginner',
            category: 'Strength Training',
            duration: 35,
            exercises: 6,
            difficulty: 'Beginner',
            progress: 0,
            isAiPick: false,
            canContinue: false
        },
        {
            id: 4,
            title: 'Yoga Flow',
            category: 'Flexibility',
            duration: 30,
            exercises: 12,
            difficulty: 'Beginner',
            progress: 0,
            isAiPick: false,
            canContinue: false
        }
    ];

    // Sample weekly performance data
    const performanceData = [
        { day: 'Mon', value: 65 },
        { day: 'Tue', value: 72 },
        { day: 'Wed', value: 58 },
        { day: 'Thu', value: 78 },
        { day: 'Fri', value: 74 },
        { day: 'Sat', value: 82 },
        { day: 'Sun', value: 89 }
    ];

    // Exercise Library Stats - from actual JSON data
    const totalExercises = exerciseData.metadata.total_records;
    const exerciseStats = {
        totalExercises: totalExercises,
        uniqueExercises: totalExercises, // All exercises are unique in this dataset
        totalWeight: 68501, // This would come from user's workout history
        totalReps: 851 // This would come from user's workout history
    };

    // Map muscle groups to categories
    const mapMuscleGroupToCategory = (muscleGroups) => {
        if (!muscleGroups || muscleGroups.length === 0) return 'Other';

        // Priority mapping - return first match
        if (muscleGroups.some(group =>
            ['Legs', 'Quadriceps', 'Hamstrings', 'Calves', 'Glutes'].includes(group)
        )) return 'Legs';

        if (muscleGroups.some(group =>
            ['Chest', 'Shoulders', 'Arms', 'Biceps', 'Triceps'].includes(group)
        )) return 'Upper Body';

        if (muscleGroups.some(group =>
            ['Back', 'Lats', 'Rhomboids', 'Traps'].includes(group)
        )) return 'Back';

        if (muscleGroups.some(group =>
            ['Core', 'Abs', 'Obliques'].includes(group)
        )) return 'Core';

        // Default categorization
        if (muscleGroups.includes('Back')) return 'Back';
        if (muscleGroups.includes('Shoulders') || muscleGroups.includes('Arms') || muscleGroups.includes('Biceps')) return 'Upper Body';
        if (muscleGroups.includes('Legs')) return 'Legs';

        return 'Other';
    };

    // Process exercise data from JSON with simulated user performance data
    const processedExercises = exerciseData.products.map((exercise, index) => {
        // Use deterministic "random" data based on exercise ID for consistency
        const idHash = parseInt(exercise.id) || index;
        const hasUserData = (idHash % 10) < 7; // 70% of exercises have user data
        const isNew = index < 20; // First 20 exercises are marked as new

        return {
            id: exercise.id,
            name: exercise.title,
            category: mapMuscleGroupToCategory(exercise.muscle_groups),
            difficulty: exercise.difficulty || 'Beginner',
            muscleGroups: exercise.muscle_groups || [],
            equipment: exercise.equipment || [],
            description: exercise.description || '',
            steps: exercise.steps || [],
            videoUrls: exercise.video_urls || {},
            slug: exercise.slug || '',
            // Simulated user performance data (deterministic)
            setsCompleted: hasUserData ? (idHash % 30) + 1 : 0,
            totalReps: hasUserData ? (idHash % 200) + 10 : 0,
            volume: hasUserData && (idHash % 2) === 0 ? (idHash % 50000) + 500 : null,
            lastPerformed: hasUserData ?
                ['Aug 27, 2025', 'Aug 26, 2025', 'Aug 25, 2025', 'Aug 24, 2025'][idHash % 4] :
                null,
            isNew: isNew && !hasUserData,
            notTried: !hasUserData
        };
    });

    // Sort exercises to show user's exercises first, then new ones
    const exercises = processedExercises.sort((a, b) => {
        if (a.notTried && !b.notTried) return 1;
        if (!a.notTried && b.notTried) return -1;
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return a.name.localeCompare(b.name); // Alphabetical within same category
    });

    // Performance insights
    const performanceInsights = {
        heaviestLift: { weight: 185, exercise: 'Bench Press' },
        mostPerformed: { count: 12, exercise: 'Squats' },
        highestVolume: { volume: 47.4, exercise: 'Bench Press' }
    };

    // Category filters
    const categories = ['All', 'Upper Body', 'Legs', 'Back', 'Core', 'Other'];

    // Load AI recommendations (placeholder for future implementation)
    useEffect(() => {
        // Future implementation for loading AI recommendations
    }, [currentUser]);

    // Reset display limit when search or category changes
    useEffect(() => {
        setDisplayLimit(20);
    }, [searchQuery, selectedCategory]);

    // Utility functions
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner':
                return { backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' };
            case 'Intermediate':
                return { backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' };
            case 'Advanced':
                return { backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' };
            default:
                return { backgroundColor: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return { backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' };
            case 'medium':
                return { backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' };
            case 'low':
                return { backgroundColor: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' };
            default:
                return { backgroundColor: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' };
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        // Remove navigation since we're handling both tabs in this component
    };

    const handleWorkoutAction = (workout) => {
        if (workout.canContinue) {
            // Continue existing workout
            navigate('/workout/start', { state: { continueWorkout: workout } });
        } else {
            // Start new workout
            navigate('/workout/start', { state: { template: workout } });
        }
    };

    // Filter exercises based on search and category
    const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Apply display limit for pagination
    const displayedExercises = filteredExercises.slice(0, displayLimit);

    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 20);
    };

    const handleExerciseClick = (exercise) => {
        navigate(`/workout/exercise/${exercise.id}`);
    };

    const formatWeight = (weight) => {
        if (weight >= 1000) {
            return `${(weight / 1000).toFixed(1)}k`;
        }
        return weight;
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
            paddingBottom: { xs: '100px', sm: '1rem' },
        }}>
            <Box sx={{
                maxWidth: '1200px',
                width: '100%',
            }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3
                }}>
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                color: 'text.primary',
                                fontWeight: 'bold',
                                mb: 0.5
                            }}
                        >
                            Workouts & Exercises
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                            }}
                        >
                            Track routines and browse exercise library
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => navigate('/workout/start')}
                        sx={{
                            backgroundColor: 'var(--primary-a0)',
                            color: '#000',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            px: 3,
                            py: 1.5,
                            '&:hover': {
                                backgroundColor: 'var(--primary-a10)',
                            }
                        }}
                    >
                        New Workout
                    </Button>
                </Box>

                {/* Tabs */}
                <Box sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            minHeight: 'auto',
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '24px',
                            // border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 1px 8px 0 rgba(0,0,0,0.10)',
                            px: 1.5,
                            py: 0.75,
                            width: 'fit-content',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '& .MuiTabs-root': {
                                minHeight: 'auto',
                            },
                            '& .MuiTab-root': {
                                color: 'rgba(255, 255, 255, 0.4)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                textTransform: 'none',
                                fontSize: '1rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.058)',
                                minHeight: 'auto',
                                py: 1,
                                px: 7,
                                gap: 1,
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                    color: '#fff',
                                },
                                '& .MuiTab-iconWrapper': {
                                    marginBottom: 0,
                                    marginRight: 0,
                                }
                            },
                            '& .MuiTabs-indicator': {
                                display: 'none',
                            },
                            '& .MuiTabs-flexContainer': {
                                gap: 4,
                            }
                        }}
                    >
                        <Tab
                            icon={<Activity size={20} />}
                            label="Workouts"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<Target size={20} />}
                            label="Exercise Library"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <>
                        {/* Recommended for You */}
                        <SectionContainer>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: 'text.primary',
                                    fontWeight: 'bold',
                                    mb: 2
                                }}
                            >
                                Recommended for You
                            </Typography>

                            <Grid2 container spacing={2} sx={{ mb: 4 }}>
                                {recommendedWorkouts.map((workout) => (
                                    <Grid2 size={6} key={workout.id}>
                                        <WorkoutCard onClick={() => handleWorkoutAction(workout)}>
                                            <CardContent sx={{
                                                p: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                flex: 1
                                            }}>
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Box>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    color: 'text.primary',
                                                                    fontWeight: 'bold',
                                                                    mb: 0.5
                                                                }}
                                                            >
                                                                {workout.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                                    mb: 2
                                                                }}
                                                            >
                                                                {workout.category}
                                                            </Typography>
                                                        </Box>
                                                        {workout.isAiPick && (
                                                            <AIPick
                                                                icon={<MdAutoAwesome />}
                                                                label="AI Pick"
                                                            />
                                                        )}
                                                    </Box>

                                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <MdTimer style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem' }} />
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                                {workout.duration} min
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Dumbbell size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                                {workout.exercises} exercises
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                        <Chip
                                                            label={workout.difficulty}
                                                            size="small"
                                                            sx={{
                                                                ...getDifficultyColor(workout.difficulty),
                                                                fontWeight: 'bold',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        />
                                                        {workout.canContinue && (
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                {workout.progress}% complete
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {workout.canContinue && (
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={workout.progress}
                                                            sx={{
                                                                mb: 2,
                                                                height: 4,
                                                                borderRadius: 2,
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                '& .MuiLinearProgress-bar': {
                                                                    backgroundColor: 'var(--primary-a0)',
                                                                    borderRadius: 2,
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    startIcon={<MdPlayArrow />}
                                                    fullWidth
                                                    sx={{
                                                        backgroundColor: 'var(--primary-a0)',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        mt: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'var(--primary-a10)',
                                                        }
                                                    }}
                                                >
                                                    {workout.canContinue ? 'Continue' : 'Start Workout'}
                                                </Button>
                                            </CardContent>
                                        </WorkoutCard>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </SectionContainer>

                        {/* All Workouts */}
                        <SectionContainer>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: 'text.primary',
                                    fontWeight: 'bold',
                                    mb: 2
                                }}
                            >
                                All Workouts
                            </Typography>

                            <Grid2 container spacing={2} sx={{ mb: 4 }}>
                                {allWorkouts.map((workout) => (
                                    <Grid2 size={6} key={workout.id}>
                                        <WorkoutCard onClick={() => handleWorkoutAction(workout)}>
                                            <CardContent sx={{
                                                p: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                flex: 1
                                            }}>
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                        <Box>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    color: 'text.primary',
                                                                    fontWeight: 'bold',
                                                                    mb: 0.5
                                                                }}
                                                            >
                                                                {workout.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                                    mb: 2
                                                                }}
                                                            >
                                                                {workout.category}
                                                            </Typography>
                                                        </Box>
                                                        {workout.isAiPick && (
                                                            <AIPick
                                                                icon={<MdAutoAwesome />}
                                                                label="AI Pick"
                                                            />
                                                        )}
                                                    </Box>

                                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <MdTimer style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem' }} />
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                                {workout.duration} min
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Dumbbell size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                                {workout.exercises} exercises
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                        <Chip
                                                            label={workout.difficulty}
                                                            size="small"
                                                            sx={{
                                                                ...getDifficultyColor(workout.difficulty),
                                                                fontWeight: 'bold',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        />
                                                        {workout.canContinue && (
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                {workout.progress}% complete
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {workout.canContinue && (
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={workout.progress}
                                                            sx={{
                                                                mb: 2,
                                                                height: 4,
                                                                borderRadius: 2,
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                '& .MuiLinearProgress-bar': {
                                                                    backgroundColor: 'var(--primary-a0)',
                                                                    borderRadius: 2,
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    startIcon={<MdPlayArrow />}
                                                    fullWidth
                                                    sx={{
                                                        backgroundColor: 'var(--primary-a0)',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        mt: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'var(--primary-a10)',
                                                        }
                                                    }}
                                                >
                                                    {workout.canContinue ? 'Continue' : 'Start Workout'}
                                                </Button>
                                            </CardContent>
                                        </WorkoutCard>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </SectionContainer>

                        {/* AI Recommendations */}
                        <AIRecommendationsCard>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Brain size={20} style={{ color: 'var(--primary-a0)' }} />
                                    <Typography variant="h6" sx={{
                                        color: 'text.primary',
                                        fontSize: '1.125rem',
                                        fontWeight: 'bold'
                                    }}>
                                        AI Recommendations
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {/* Sample AI Recommendations - matching Home page style */}
                                    <Box sx={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px',
                                        p: 2.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TrendingUp size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle1" sx={{
                                                        color: 'text.primary',
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Focus on Legs
                                                    </Typography>
                                                    <Chip
                                                        label="high"
                                                        size="small"
                                                        sx={{
                                                            ...getPriorityColor('high'),
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            fontWeight: 'bold',
                                                            '& .MuiChip-label': {
                                                                px: 1.5
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    You haven&apos;t trained legs in 4 days. Try the Lower Body Power workout.
                                                </Typography>
                                                <Button
                                                    variant="text"
                                                    sx={{
                                                        color: 'var(--primary-a0)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 'bold',
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                >
                                                    Start Workout
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px',
                                        p: 2.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Clock size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle1" sx={{
                                                        color: 'text.primary',
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Rest Day Suggested
                                                    </Typography>
                                                    <Chip
                                                        label="medium"
                                                        size="small"
                                                        sx={{
                                                            ...getPriorityColor('medium'),
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            fontWeight: 'bold',
                                                            '& .MuiChip-label': {
                                                                px: 1.5
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    You&apos;ve been training hard. Consider taking tomorrow as a recovery day.
                                                </Typography>
                                                <Button
                                                    variant="text"
                                                    sx={{
                                                        color: 'var(--primary-a0)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 'bold',
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                >
                                                    Schedule Rest
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px',
                                        p: 2.5,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TrendingUp size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle1" sx={{
                                                        color: 'text.primary',
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Increase Weight
                                                    </Typography>
                                                    <Chip
                                                        label="low"
                                                        size="small"
                                                        sx={{
                                                            ...getPriorityColor('low'),
                                                            fontSize: '0.7rem',
                                                            height: 22,
                                                            fontWeight: 'bold',
                                                            '& .MuiChip-label': {
                                                                px: 1.5
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    Your bench press has been consistent. Try adding 5lbs next session.
                                                </Typography>
                                                <Button
                                                    variant="text"
                                                    sx={{
                                                        color: 'var(--primary-a0)',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 'bold',
                                                        p: 0,
                                                        minWidth: 'auto',
                                                        '&:hover': {
                                                            backgroundColor: 'transparent',
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                >
                                                    Update Goal
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </AIRecommendationsCard>

                        {/* Weekly Performance Chart */}
                        <ChartContainer>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 'bold',
                                    mb: 3
                                }}>
                                    Weekly Performance
                                </Typography>

                                {/* Simple line chart representation */}
                                <Box sx={{ position: 'relative', height: 200, mb: 2 }}>
                                    <svg width="100%" height="100%" viewBox="0 0 400 150">
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="var(--primary-a0)" />
                                                <stop offset="100%" stopColor="var(--primary-a20)" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid lines */}
                                        {[0, 25, 50, 75, 100].map((y) => (
                                            <line
                                                key={y}
                                                x1="0"
                                                y1={150 - (y * 1.2)}
                                                x2="400"
                                                y2={150 - (y * 1.2)}
                                                stroke="rgba(255, 255, 255, 0.1)"
                                                strokeWidth="1"
                                            />
                                        ))}

                                        {/* Performance line */}
                                        <polyline
                                            points={performanceData.map((point, index) =>
                                                `${(index * 60) + 30},${150 - (point.value * 1.2)}`
                                            ).join(' ')}
                                            fill="none"
                                            stroke="url(#lineGradient)"
                                            strokeWidth="3"
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                        />

                                        {/* Data points */}
                                        {performanceData.map((point, index) => (
                                            <circle
                                                key={index}
                                                cx={(index * 60) + 30}
                                                cy={150 - (point.value * 1.2)}
                                                r="4"
                                                fill="var(--primary-a0)"
                                                stroke="rgba(255, 255, 255, 0.2)"
                                                strokeWidth="2"
                                            />
                                        ))}
                                    </svg>

                                    {/* Y-axis labels */}
                                    <Box sx={{ position: 'absolute', left: -20, top: 0, height: '100%' }}>
                                        {[100, 75, 50, 25, 0].map((value) => (
                                            <Typography
                                                key={value}
                                                variant="caption"
                                                sx={{
                                                    position: 'absolute',
                                                    top: `${100 - value}%`,
                                                    transform: 'translateY(-50%)',
                                                    color: 'text.secondary',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {value}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>

                                {/* X-axis labels */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                                    {performanceData.map((point) => (
                                        <Typography
                                            key={point.day}
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {point.day}
                                        </Typography>
                                    ))}
                                </Box>
                            </CardContent>
                        </ChartContainer>
                    </>
                )}

                {activeTab === 1 && (
                    <>
                        {/* Exercise Library Stats */}
                        <Grid2 container spacing={2} sx={{ mb: 4 }}>
                            <Grid2 size={3}>
                                <StatsCard>
                                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                            <Activity size={20} style={{ color: 'var(--primary-a0)' }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ color: 'var(--primary-a0)', fontWeight: 'bold', mb: 0.5 }}>
                                            {exerciseStats.totalExercises}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Total Exercises
                                        </Typography>
                                    </CardContent>
                                </StatsCard>
                            </Grid2>
                            <Grid2 size={3}>
                                <StatsCard>
                                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                            <Target size={20} style={{ color: 'var(--primary-a0)' }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ color: 'var(--primary-a0)', fontWeight: 'bold', mb: 0.5 }}>
                                            {exerciseStats.uniqueExercises}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Unique Exercises
                                        </Typography>
                                    </CardContent>
                                </StatsCard>
                            </Grid2>
                            <Grid2 size={3}>
                                <StatsCard>
                                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                            <Weight size={20} style={{ color: 'var(--primary-a0)' }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ color: 'var(--primary-a0)', fontWeight: 'bold', mb: 0.5 }}>
                                            {formatWeight(exerciseStats.totalWeight)}lb
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Total Weight
                                        </Typography>
                                    </CardContent>
                                </StatsCard>
                            </Grid2>
                            <Grid2 size={3}>
                                <StatsCard>
                                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                                            <BarChart3 size={20} style={{ color: 'var(--primary-a0)' }} />
                                        </Box>
                                        <Typography variant="h4" sx={{ color: 'var(--primary-a0)', fontWeight: 'bold', mb: 0.5 }}>
                                            {exerciseStats.totalReps}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Total Reps
                                        </Typography>
                                    </CardContent>
                                </StatsCard>
                            </Grid2>
                        </Grid2>

                        {/* Search and Filter Section */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                            <TextField
                                placeholder="Search exercises..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        '& fieldset': {
                                            border: 'none',
                                        },
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid var(--primary-a0)',
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'text.primary',
                                        '&::placeholder': {
                                            color: 'rgba(255, 255, 255, 0.5)',
                                        }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MdSearch style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<MdFilterList />}
                                sx={{
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'text.secondary',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    '&:hover': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                            >
                                Filter
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<MdAdd />}
                                sx={{
                                    backgroundColor: 'var(--primary-a0)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    '&:hover': {
                                        backgroundColor: 'var(--primary-a10)',
                                    }
                                }}
                            >
                                Add Exercise
                            </Button>
                        </Box>

                        {/* Category Filters */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
                            {categories.map((category) => (
                                <CategoryChip
                                    key={category}
                                    label={category}
                                    active={selectedCategory === category}
                                    onClick={() => setSelectedCategory(category)}
                                />
                            ))}
                        </Box>

                        {/* Exercise Library Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                Exercise Library
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdInfo style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                    Click any exercise to view detailed instructions
                                </Typography>
                            </Box>
                        </Box>

                        {/* Exercise List */}
                        <Box sx={{ mb: 4 }}>
                            {displayedExercises.map((exercise) => (
                                <ExerciseCard key={exercise.id} sx={{ mb: 2 }} onClick={() => handleExerciseClick(exercise)}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="h6" sx={{
                                                        color: 'var(--primary-a0)',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem'
                                                    }}>
                                                        {exercise.name}
                                                    </Typography>
                                                    <Chip
                                                        label={exercise.category}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    />
                                                    <Chip
                                                        label={exercise.difficulty}
                                                        size="small"
                                                        sx={{
                                                            ...getDifficultyColor(exercise.difficulty),
                                                            fontSize: '0.75rem',
                                                        }}
                                                    />
                                                    {exercise.equipment.length > 0 && (
                                                        <Chip
                                                            label={exercise.equipment[0]}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                                                color: '#2196f3',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        />
                                                    )}
                                                    {exercise.isNew && (
                                                        <Chip
                                                            label="New"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'var(--primary-a0)',
                                                                color: '#000',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    )}
                                                </Box>

                                                {exercise.notTried ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                                                            Not performed yet
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'var(--primary-a0)' }}>
                                                            Try it out!
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                            {exercise.setsCompleted} sets completed
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                            {exercise.totalReps} total reps
                                                        </Typography>
                                                        {exercise.volume && (
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                                {formatWeight(exercise.volume)}lb volume
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {exercise.lastPerformed && (
                                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                                        {exercise.lastPerformed}
                                                    </Typography>
                                                )}
                                                <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                                    <MdInfo />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </ExerciseCard>
                            ))}
                        </Box>

                        {/* Performance Insights */}
                        <ChartContainer sx={{ mb: 4 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    fontWeight: 'bold',
                                    mb: 3
                                }}>
                                    Performance Insights
                                </Typography>

                                <Grid2 container spacing={4}>
                                    <Grid2 size={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{
                                                color: 'var(--primary-a0)',
                                                fontWeight: 'bold',
                                                mb: 1
                                            }}>
                                                {performanceInsights.heaviestLift.weight}lb
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                Heaviest Lift ({performanceInsights.heaviestLift.exercise})
                                            </Typography>
                                        </Box>
                                    </Grid2>
                                    <Grid2 size={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{
                                                color: 'var(--primary-a0)',
                                                fontWeight: 'bold',
                                                mb: 1
                                            }}>
                                                {performanceInsights.mostPerformed.count}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                Most Performed ({performanceInsights.mostPerformed.exercise})
                                            </Typography>
                                        </Box>
                                    </Grid2>
                                    <Grid2 size={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{
                                                color: 'var(--primary-a0)',
                                                fontWeight: 'bold',
                                                mb: 1
                                            }}>
                                                {performanceInsights.highestVolume.volume}k
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                Highest Volume ({performanceInsights.highestVolume.exercise})
                                            </Typography>
                                        </Box>
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </ChartContainer>

                        {/* Load More Button */}
                        {displayLimit < filteredExercises.length && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleLoadMore}
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'text.secondary',
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: '12px',
                                        '&:hover': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                        }
                                    }}
                                >
                                    Load More Exercises ({filteredExercises.length - displayLimit} remaining)
                                </Button>
                            </Box>
                        )}

                        {/* Show total count when all exercises are displayed */}
                        {displayLimit >= filteredExercises.length && filteredExercises.length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    Showing all {filteredExercises.length} exercises
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}