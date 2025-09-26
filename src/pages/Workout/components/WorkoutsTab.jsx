import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, LinearProgress, TextField, InputAdornment, Select, MenuItem, FormControl, Menu, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdPlayArrow, MdTimer, MdAutoAwesome, MdFlashOn, MdFolderOpen, MdAdd, MdSearch, MdArrowDropDown, MdExpandMore, MdMoreVert, MdEdit, MdContentCopy, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useWorkoutPrograms } from '../hooks/useWorkoutPrograms';
import { collection, query, where, orderBy, limit, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import AISuggestionCards from '../../../components/common/AISuggestionCards';
import CreateWorkoutModal from './CreateWorkoutModal';
import CreateProgramModal from './CreateProgramModal';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PropTypes from 'prop-types';
import { Collapse } from '@mui/material';

const WorkoutCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%',
    '&:hover': {
        transform: 'translateY(-2px)',
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

const AIPick = styled(Chip)(() => ({
    background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '0.7rem',
    height: '20px',
    '& .MuiChip-icon': {
        color: '#000',
    },
}));

const TabButton = styled(Button)(({ active, theme }) => ({
    background: active
        ? 'rgba(40, 40, 40, 0.9)'
        : 'transparent',
    color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
    borderRadius: '15px',
    padding: '10px 20px',
    textTransform: 'none',
    fontSize: '0.9rem',
    fontWeight: active ? 'bold' : 'medium',
    border: active ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
    backdropFilter: active ? 'blur(10px)' : 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 'auto',
    [theme.breakpoints.down('sm')]: {
        padding: '8px 16px',
        fontSize: '0.8rem',
        gap: '4px',
    },
    '&:hover': {
        background: active
            ? 'rgba(40, 40, 40, 0.9)'
            : 'rgba(255, 255, 255, 0.05)',
        color: active ? '#fff' : 'rgba(255, 255, 255, 0.8)',
    },
}));


// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <Box sx={{
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                border: '1px solid rgba(221, 237, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                backdropFilter: 'blur(10px)'
            }}>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                    {label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#dded00', display: 'block' }}>
                    Performance: {payload[0].value}%
                </Typography>
            </Box>
        );
    }
    return null;
};

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.number
    })),
    label: PropTypes.string
};

const WorkoutsTab = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { templates, loading: templatesLoading } = useWorkoutTemplates();
    const { programs, loading: programsLoading } = useWorkoutPrograms();

    const [activeSubTab, setActiveSubTab] = useState(0); // 0 = Quick Start, 1 = Programs
    const [recommendedWorkouts, setRecommendedWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [expandedDay, setExpandedDay] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [editProgramData, setEditProgramData] = useState(null);

    const handleSubTabChange = (tabIndex) => {
        setActiveSubTab(tabIndex);
    };

    const handleToggleExercises = (day) => {
        setExpandedDay(expandedDay === day ? null : day);
    };

    const handleStartWorkout = (program, day) => {
        console.log('Starting workout:', { program: program.name, day: day.name });
        // Here you would navigate to the workout session or open a workout modal
        // For now, we'll just log it
        alert(`Starting ${day.name} from ${program.name} program!`);
    };

    // Weekly performance data
    const weeklyPerformanceData = [
        { date: 'Mon', value: 65 },
        { date: 'Tue', value: 75 },
        { date: 'Wed', value: 55 },
        { date: 'Thu', value: 80 },
        { date: 'Fri', value: 75 },
        { date: 'Sat', value: 85 },
        { date: 'Sun', value: 95 }
    ];

    const calculateRecommendations = useCallback((userTemplates, completedWorkouts) => {
        const recommendations = [];

        // Find next day in multi-day templates
        for (const template of userTemplates) {
            if (template.workoutDays && template.workoutDays.length > 1) {
                const nextDay = findNextDayInTemplate(template, completedWorkouts);
                if (nextDay) {
                    recommendations.push({
                        id: `template-${template.id}-${nextDay.id}`,
                        title: `${template.name} - ${nextDay.name}`,
                        category: getTemplateCategory(nextDay),
                        duration: estimateDuration(nextDay),
                        exercises: nextDay.exercises?.length || 0,
                        difficulty: 'Intermediate',
                        progress: 0,
                        isAIPick: false,
                        templateId: template.id,
                        dayId: nextDay.id,
                        type: 'nextDay'
                    });
                    break; // Only show one next day recommendation
                }
            }
        }

        // Add AI recommendation (placeholder for now)
        if (recommendations.length < 2) {
            recommendations.push({
                id: 'ai-recommendation',
                title: "AI Recommended Workout",
                category: "Personalized",
                duration: "35 min",
                exercises: 7,
                difficulty: "Intermediate",
                progress: 0,
                isAIPick: true,
                type: 'aiRecommended'
            });
        }

        return recommendations;
    }, []);

    // Load user's completed workouts and calculate recommendations
    useEffect(() => {
        const loadWorkoutData = async () => {
            try {
                setLoading(true);

                // Get user's completed workouts
                const workoutsQuery = query(
                    collection(db, 'workouts'),
                    where('userId', '==', currentUser.uid),
                    where('completed', '==', true),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );

                const workoutsSnapshot = await getDocs(workoutsQuery);
                const workouts = workoutsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Calculate recommendations based on templates and progress
                const recommendations = calculateRecommendations(templates, workouts);
                setRecommendedWorkouts(recommendations);

            } catch (error) {
                console.error('Error loading workout data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser && templates.length > 0) {
            loadWorkoutData();
        }
    }, [currentUser, templates, calculateRecommendations]);

    const findNextDayInTemplate = (template, completedWorkouts) => {
        if (!template.workoutDays || template.workoutDays.length <= 1) return null;

        // Find the last completed day for this template
        const templateWorkouts = completedWorkouts.filter(w => w.templateId === template.id);

        if (templateWorkouts.length === 0) {
            // No workouts completed, return first day
            return template.workoutDays[0];
        }

        // Find the highest day number completed
        const completedDayNames = templateWorkouts.map(w => w.dayName);
        const sortedDays = template.workoutDays.sort((a, b) => a.id - b.id);

        for (let i = 0; i < sortedDays.length; i++) {
            const day = sortedDays[i];
            if (!completedDayNames.includes(day.name)) {
                return day;
            }
        }

        // All days completed, start over
        return sortedDays[0];
    };

    const getTemplateCategory = (day) => {
        if (!day.muscleGroups || day.muscleGroups.length === 0) return 'General';

        const muscleGroupNames = day.muscleGroups.map(mg => mg.name.toLowerCase());

        if (muscleGroupNames.includes('chest') || muscleGroupNames.includes('back') || muscleGroupNames.includes('shoulders')) {
            return 'Upper Body';
        } else if (muscleGroupNames.includes('legs') || muscleGroupNames.includes('glutes')) {
            return 'Lower Body';
        } else if (muscleGroupNames.includes('cardio')) {
            return 'Cardio';
        }

        return 'Strength Training';
    };

    const estimateDuration = (day) => {
        const exerciseCount = day.exercises?.length || 0;
        const estimatedMinutes = exerciseCount * 5 + 10; // Rough estimate
        return `${estimatedMinutes} min`;
    };

    const estimateTemplateDuration = (template) => {
        if (!template.workoutDays || template.workoutDays.length === 0) return '30 min';

        // Get average duration across all days
        const totalExercises = template.workoutDays.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
        const avgExercises = totalExercises / template.workoutDays.length;
        const estimatedMinutes = Math.round(avgExercises * 5 + 10);
        return `${estimatedMinutes} min`;
    };

    const getTotalExercises = (template) => {
        if (!template.workoutDays || template.workoutDays.length === 0) return 0;

        // Get average exercises per day
        const totalExercises = template.workoutDays.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
        return Math.round(totalExercises / template.workoutDays.length);
    };

    const handleSuggestionAccept = (suggestion) => {
        console.log('Accepted suggestion:', suggestion);
        // Handle suggestion acceptance logic here
    };

    const handleSuggestionDismiss = (suggestion) => {
        console.log('Dismissed suggestion:', suggestion);
        // Handle suggestion dismissal logic here
    };

    const handleWorkoutClick = (workout) => {
        if (workout.type === 'nextDay') {
            // Navigate to start workout with specific template and day
            navigate('/workout/start', {
                state: {
                    templateId: workout.templateId,
                    dayId: workout.dayId
                }
            });
        } else if (workout.type === 'template') {
            // Navigate to template selection
            navigate('/workout/start', {
                state: {
                    templateId: workout.templateId
                }
            });
        } else {
            // Default navigation
            navigate('/workout/start');
        }
    };


    const handleWorkoutCreated = () => {
        // Reload templates after creating a new one
        if (templates) {
            // Trigger a reload of templates
            window.location.reload(); // Simple reload for now
        }
    };

    const handleCreateProgram = () => {
        setCreateProgramModalOpen(true);
    };

    const handleProgramCreated = () => {
        // Reload programs after creating a new one
        window.location.reload();
    };

    const handleMenuOpen = (event, program) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedProgram(program);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedProgram(null);
    };

    const handleEditProgram = () => {
        if (selectedProgram) {
            setEditProgramData(selectedProgram);
            setCreateProgramModalOpen(true);
        }
        handleMenuClose();
    };

    const handleDuplicateProgram = async () => {
        if (!selectedProgram) return;

        try {
            const duplicatedProgram = {
                ...selectedProgram,
                name: `${selectedProgram.name} (Copy)`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                userId: currentUser.uid,
                isFromTemplate: false, // Duplicated programs are not from templates
            };
            delete duplicatedProgram.id; // Remove the original ID

            await addDoc(collection(db, 'workoutPrograms'), duplicatedProgram);
            console.log('Program duplicated successfully');
        } catch (error) {
            console.error('Error duplicating program:', error);
        }
        handleMenuClose();
    };

    const handleDeleteProgram = async () => {
        if (!selectedProgram) return;

        const confirmMessage = selectedProgram.isFromTemplate
            ? `Are you sure you want to delete "${selectedProgram.name}"? This is a starter program that will be restored if you create a new account.`
            : `Are you sure you want to delete "${selectedProgram.name}"? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            try {
                await deleteDoc(doc(db, 'workoutPrograms', selectedProgram.id));
                console.log('Program deleted successfully');
            } catch (error) {
                console.error('Error deleting program:', error);
            }
        }
        handleMenuClose();
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return '#4caf50';
            case 'Intermediate': return '#ffc107';
            case 'Advanced': return '#f44336';
            default: return '#666';
        }
    };

    return (
        <Box>
            {/* Sub-Tab Navigation */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                px: { xs: 2, sm: 0 }
            }}>
                <Box sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 1 },
                    background: 'rgba(20, 20, 20, 0.5)',
                    borderRadius: '15px',
                    padding: { xs: '4px', sm: '6px' },
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    width: 'fit-content',
                    maxWidth: { xs: '100%', sm: 'none' }
                }}>
                    <TabButton
                        active={activeSubTab === 0}
                        onClick={() => handleSubTabChange(0)}
                        startIcon={<MdFlashOn />}
                    >
                        Quick Start
                    </TabButton>
                    <TabButton
                        active={activeSubTab === 1}
                        onClick={() => handleSubTabChange(1)}
                        startIcon={<MdFolderOpen />}
                    >
                        Programs
                    </TabButton>
                </Box>
            </Box>

            {/* Quick Start Content */}
            {activeSubTab === 0 && (
                <>
                    {/* Recommended for You Section */}
                    <Typography variant="h5" sx={{ color: '#fff', mb: 3, fontWeight: 'bold' }}>
                        Recommended for You
                    </Typography>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {loading ? (
                            // Loading skeleton
                            [1, 2].map((i) => (
                                <Grid item xs={12} md={6} key={i}>
                                    <WorkoutCard>
                                        <CardContent>
                                            <Box sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Typography sx={{ color: 'text.secondary' }}>Loading...</Typography>
                                            </Box>
                                        </CardContent>
                                    </WorkoutCard>
                                </Grid>
                            ))
                        ) : recommendedWorkouts.length > 0 ? (
                            recommendedWorkouts.map((workout) => (
                                <Grid item xs={12} md={6} key={workout.id}>
                                    <WorkoutCard onClick={() => handleWorkoutClick(workout)}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                    {workout.title}
                                                </Typography>
                                                {workout.isAIPick && (
                                                    <AIPick
                                                        icon={<MdAutoAwesome size={12} />}
                                                        label="AI Pick"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>

                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                {workout.category}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <MdTimer size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {workout.duration}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {workout.exercises} exercises
                                                </Typography>
                                                <Chip
                                                    label={workout.difficulty}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${getDifficultyColor(workout.difficulty)}20`,
                                                        color: getDifficultyColor(workout.difficulty),
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                            </Box>

                                            {workout.progress > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Progress
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#dded00' }}>
                                                            {workout.progress}% complete
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={workout.progress}
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            '& .MuiLinearProgress-bar': {
                                                                backgroundColor: '#dded00',
                                                                borderRadius: 3,
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            )}

                                            <Button
                                                variant="contained"
                                                startIcon={<MdPlayArrow />}
                                                fullWidth
                                                sx={{
                                                    background: workout.progress > 0
                                                        ? 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)'
                                                        : 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                    color: '#000',
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                        background: workout.progress > 0
                                                            ? 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)'
                                                            : 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                    },
                                                }}
                                            >
                                                {workout.progress > 0 ? 'Continue' : 'Start Workout'}
                                            </Button>
                                        </CardContent>
                                    </WorkoutCard>
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                                        No workout recommendations available
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Create some workout templates to get personalized recommendations
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>

                    <Grid container spacing={3}>
                        {/* All Workouts Section */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                    All Workouts
                                </Typography>
                                {/* <Button
                            variant="contained"
                            startIcon={<MdAdd />}
                            onClick={handleNewWorkout}
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                px: 2,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                            }}
                        >
                            New Workout
                        </Button> */}
                            </Box>

                            <Grid container spacing={2}>
                                {templatesLoading ? (
                                    // Loading skeleton
                                    [1, 2, 3, 4].map((i) => (
                                        <Grid item xs={12} sm={6} key={i}>
                                            <WorkoutCard>
                                                <CardContent>
                                                    <Box sx={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography sx={{ color: 'text.secondary' }}>Loading...</Typography>
                                                    </Box>
                                                </CardContent>
                                            </WorkoutCard>
                                        </Grid>
                                    ))
                                ) : templates.length > 0 ? (
                                    templates.map((template) => {
                                        const templateWorkout = {
                                            id: template.id,
                                            title: template.name,
                                            category: template.workoutDays?.length > 1 ? `${template.workoutDays.length} Day Split` : 'Single Day',
                                            duration: estimateTemplateDuration(template),
                                            exercises: getTotalExercises(template),
                                            difficulty: 'Intermediate',
                                            progress: 0,
                                            isAIPick: template.isAIGenerated || false,
                                            templateId: template.id,
                                            type: 'template'
                                        };

                                        return (
                                            <Grid item xs={12} sm={6} key={template.id}>
                                                <WorkoutCard onClick={() => handleWorkoutClick(templateWorkout)}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                                                                {templateWorkout.title}
                                                            </Typography>
                                                            {templateWorkout.isAIPick && (
                                                                <AIPick
                                                                    icon={<MdAutoAwesome size={12} />}
                                                                    label="AI Pick"
                                                                    size="small"
                                                                />
                                                            )}
                                                        </Box>

                                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                            {templateWorkout.category}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <MdTimer size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                    {templateWorkout.duration}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                {templateWorkout.exercises} exercises
                                                            </Typography>
                                                            <Chip
                                                                label={templateWorkout.difficulty}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: `${getDifficultyColor(templateWorkout.difficulty)}20`,
                                                                    color: getDifficultyColor(templateWorkout.difficulty),
                                                                    fontSize: '0.7rem',
                                                                    height: '20px'
                                                                }}
                                                            />
                                                        </Box>

                                                        <Button
                                                            variant="contained"
                                                            startIcon={<MdPlayArrow />}
                                                            fullWidth
                                                            sx={{
                                                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                                color: '#000',
                                                                fontWeight: 'bold',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                                                },
                                                            }}
                                                        >
                                                            Start Workout
                                                        </Button>
                                                    </CardContent>
                                                </WorkoutCard>
                                            </Grid>
                                        );
                                    })
                                ) : (
                                    <Grid item xs={12}>
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                                                No workout templates found
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Create your first workout template to get started
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>

                        {/* AI Recommendations Sidebar */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdAutoAwesome />
                                AI Recommendations
                            </Typography>

                            <AISuggestionCards
                                userId={currentUser?.uid}
                                workoutContext="workout"
                                onSuggestionAccept={handleSuggestionAccept}
                                onSuggestionDismiss={handleSuggestionDismiss}
                                maxSuggestions={3}
                                showPlateauWarnings={true}
                            />

                            {/* Weekly Performance Chart */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                    Weekly Performance
                                </Typography>
                                <Card sx={{
                                    background: 'rgba(40, 40, 40, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ height: '200px', width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={weeklyPerformanceData}>
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.6)' }}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.6)' }}
                                                        domain={[0, 100]}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#dded00"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#dded00', strokeWidth: 0, r: 4 }}
                                                        activeDot={{ r: 5, fill: '#dded00', stroke: '#dded00', strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>

                </>
            )}

            {/* Programs Content */}
            {activeSubTab === 1 && (
                <Box>
                    {/* Programs Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                Programs
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<MdAdd />}
                            onClick={handleCreateProgram}
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                px: 3,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                            }}
                        >
                            Create Program
                        </Button>
                    </Box>

                    {/* Search and Filter Bar */}
                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 4,
                        flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                        <TextField
                            fullWidth
                            placeholder="Search programs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <MdSearch style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(40, 40, 40, 0.8)',
                                    borderRadius: '12px',
                                    color: '#fff',
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
                                '& .MuiInputBase-input': {
                                    color: '#fff',
                                    '&::placeholder': {
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        opacity: 1,
                                    },
                                },
                            }}
                        />
                        <FormControl sx={{ minWidth: '160px' }}>
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                displayEmpty
                                IconComponent={MdArrowDropDown}
                                sx={{
                                    backgroundColor: 'rgba(40, 40, 40, 0.8)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#dded00',
                                    },
                                    '& .MuiSelect-icon': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: 'rgba(40, 40, 40, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            '& .MuiMenuItem-root': {
                                                color: '#fff',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                                },
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(221, 237, 0, 0.3)',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value="All Categories">All Categories</MenuItem>
                                <MenuItem value="Strength">Strength</MenuItem>
                                <MenuItem value="Cardio">Cardio</MenuItem>
                                <MenuItem value="Flexibility">Flexibility</MenuItem>
                                <MenuItem value="Powerlifting">Powerlifting</MenuItem>
                                <MenuItem value="Bodybuilding">Bodybuilding</MenuItem>
                                <MenuItem value="CrossFit">CrossFit</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Your Programs Section */}
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 'bold' }}>
                            Your Programs
                        </Typography>

                        <Grid container spacing={3}>
                            {programsLoading ? (
                                <Grid item xs={12}>
                                    <Typography sx={{ color: 'text.secondary' }}>Loading programs...</Typography>
                                </Grid>
                            ) : programs.length > 0 ? (
                                programs.map(program => (
                                    <Grid item xs={12} key={program.id}>
                                        <Card sx={{
                                            background: 'rgba(40, 40, 40, 0.9)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            p: 3,
                                            '&:hover': {
                                                border: '1px solid rgba(221, 237, 0, 0.3)',
                                            }
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box>
                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                                        {program.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                        {program.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                        <Chip
                                                            label={program.difficulty}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 152, 0, 0.2)',
                                                                color: '#ff9800',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                        <Chip
                                                            label={program.isFromTemplate ? 'Starter' : 'Custom'}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: program.isFromTemplate ? 'rgba(221, 237, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                                                color: program.isFromTemplate ? '#dded00' : '#4caf50',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                📅 {program.duration}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                ⚡ {program.frequency}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                📊 {program.days?.length || 0} days
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <IconButton
                                                    onClick={(e) => handleMenuOpen(e, program)}
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        '&:hover': { color: '#fff' },
                                                        position: 'relative',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <MdMoreVert />
                                                </IconButton>
                                            </Box>

                                            {/* Program Days */}
                                            <Grid container spacing={2}>
                                                {program.days && program.days.map(day => (
                                                    <Grid item xs={12} md={4} key={day.id}>
                                                        <Box>
                                                            <Box sx={{
                                                                background: 'rgba(60, 60, 60, 0.5)',
                                                                borderRadius: expandedDay === `${program.id}-${day.id}` ? '12px 12px 0 0' : '12px',
                                                                p: 2,
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                borderBottom: expandedDay === `${program.id}-${day.id}` ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`
                                                            }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                                        {day.name}
                                                                    </Typography>
                                                                    {/* Performance metric can be added here if available */}
                                                                </Box>
                                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                                                    {day.focus}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                        {day.exercises?.length || 0} exercises
                                                                    </Typography>
                                                                    {/* Duration can be added here if available */}
                                                                </Box>
                                                                <Button
                                                                    variant="contained"
                                                                    startIcon={<MdPlayArrow />}
                                                                    fullWidth
                                                                    size="small"
                                                                    onClick={() => handleStartWorkout(program, day)}
                                                                    sx={{
                                                                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                                        color: '#000',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.75rem',
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                                                        },
                                                                    }}
                                                                >
                                                                    Start
                                                                </Button>
                                                                <Box
                                                                    onClick={() => handleToggleExercises(`${program.id}-${day.id}`)}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        color: 'text.secondary',
                                                                        mt: 2,
                                                                        '&:hover': {
                                                                            color: '#fff'
                                                                        }
                                                                    }}
                                                                >
                                                                    <Typography variant="caption">View Exercises</Typography>
                                                                    <MdExpandMore style={{ transform: expandedDay === `${program.id}-${day.id}` ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                                                </Box>
                                                            </Box>
                                                            <Collapse in={expandedDay === `${program.id}-${day.id}`}>
                                                                <Box sx={{
                                                                    p: 2,
                                                                    backgroundColor: 'rgba(40, 40, 40, 0.9)',
                                                                    borderRadius: '0 0 12px 12px',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    borderTop: 'none',
                                                                }}>
                                                                    {day.exercises.map((exercise, index) => (
                                                                        <Box key={index} sx={{ mb: index === day.exercises.length - 1 ? 0 : 2 }}>
                                                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold' }}>{exercise.name}</Typography>
                                                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>{exercise.sets ? `${exercise.sets.length} sets` : ''}</Typography>
                                                                        </Box>
                                                                    ))}
                                                                    <Button
                                                                        variant="contained"
                                                                        startIcon={<MdPlayArrow />}
                                                                        fullWidth
                                                                        size="small"
                                                                        onClick={() => handleStartWorkout(program, day)}
                                                                        sx={{
                                                                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                                            color: '#000',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.75rem',
                                                                            mt: 2,
                                                                            '&:hover': {
                                                                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                                                            },
                                                                        }}
                                                                    >
                                                                        Start
                                                                    </Button>
                                                                </Box>
                                                            </Collapse>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Card>
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                                        No custom programs created yet.
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Program Actions Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            sx: {
                                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                minWidth: '150px'
                            }
                        }}
                    >
                        <MenuItem
                            onClick={handleEditProgram}
                            sx={{
                                color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(221, 237, 0, 0.1)' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <MdEdit size={16} />
                            Edit Program
                        </MenuItem>
                        <MenuItem
                            onClick={handleDuplicateProgram}
                            sx={{
                                color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(221, 237, 0, 0.1)' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <MdContentCopy size={16} />
                            Duplicate
                        </MenuItem>
                        <MenuItem
                            onClick={handleDeleteProgram}
                            sx={{
                                color: '#f44336',
                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <MdDelete size={16} />
                            Delete
                        </MenuItem>
                    </Menu>

                    {/* Popular Programs Section */}
                    <Box>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 'bold' }}>
                            Popular Programs
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Popular Program Card */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{
                                    background: 'rgba(40, 40, 40, 0.9)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    p: 3,
                                    '&:hover': {
                                        border: '1px solid rgba(221, 237, 0, 0.3)',
                                    }
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                                Full Body Starter
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                Perfect beginner program to build foundation
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Chip
                                                    label="beginner"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                                        color: '#4caf50',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Chip
                                                    label="Popular"
                                                    size="small"
                                                    icon={<span style={{ fontSize: '12px' }}>⭐</span>}
                                                    sx={{
                                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                        color: '#dded00',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        👥 234 users
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        ⭐ 4.9/5
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        📅 4 weeks
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<span style={{ fontSize: '12px' }}>+</span>}
                                            sx={{
                                                borderColor: '#dded00',
                                                color: '#dded00',
                                                fontSize: '0.75rem',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                                    borderColor: '#dded00',
                                                },
                                            }}
                                        >
                                            Add to Mine
                                        </Button>
                                    </Box>

                                    {/* Program Preview Days */}
                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(60, 60, 60, 0.3)',
                                                borderRadius: '8px',
                                                p: 1.5,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>
                                                    Full Body A
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    2 exercises
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    45min
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{
                                                background: 'rgba(60, 60, 60, 0.3)',
                                                borderRadius: '8px',
                                                p: 1.5,
                                                textAlign: 'center'
                                            }}>
                                                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', display: 'block' }}>
                                                    Full Body B
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    2 exercises
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                    45min
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            )}

            {/* Create Workout Modal */}
            <CreateWorkoutModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onWorkoutCreated={handleWorkoutCreated}
            />

            {/* Create Program Modal */}
            <CreateProgramModal
                open={createProgramModalOpen}
                onClose={() => {
                    setCreateProgramModalOpen(false);
                    setEditProgramData(null);
                }}
                onProgramCreated={handleProgramCreated}
                editData={editProgramData}
            />
        </Box>
    );
};

export default WorkoutsTab;
