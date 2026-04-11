import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, LinearProgress, TextField, InputAdornment, Select, MenuItem, FormControl, Menu, IconButton, Skeleton, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdPlayArrow, MdTimer, MdAutoAwesome, MdFlashOn, MdFolderOpen, MdAdd, MdSearch, MdArrowDropDown, MdExpandMore, MdMoreVert, MdEdit, MdContentCopy, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useWorkoutPrograms } from '../hooks/useWorkoutPrograms';
import { mapWorkoutDayToTemplateInput, useWorkoutMutations } from '../hooks/useWorkoutMutations';
import CreateWorkoutModal from './CreateWorkoutModal';
import CreateProgramModal from './CreateProgramModal';
import WorkoutRecommendationPreviewDialog from './WorkoutRecommendationPreviewDialog';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PropTypes from 'prop-types';
import { Collapse } from '@mui/material';
import { useWorkoutState } from '../hooks/useWorkoutState';
import {
    buildStarterWorkoutRecommendations,
    buildStarterWorkoutStartState,
} from './starterWorkoutRecommendations';
import progressiveOverloadAI from '../../../services/progressiveOverloadAI';
import { Brain, TrendingUp, Clock } from 'lucide-react';
import AIUnlockProgress from '../../Home/components/AIUnlockProgress';

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

const TabButton = styled(Button)(({ $active, theme }) => ({
    background: $active
        ? 'rgba(40, 40, 40, 0.9)'
        : 'transparent',
    color: $active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
    borderRadius: '15px',
    padding: '10px 20px',
    textTransform: 'none',
    fontSize: '0.9rem',
    fontWeight: $active ? 'bold' : 'medium',
    border: $active ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
    backdropFilter: $active ? 'blur(10px)' : 'none',
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
        background: $active
            ? 'rgba(40, 40, 40, 0.9)'
            : 'rgba(255, 255, 255, 0.05)',
        color: $active ? '#fff' : 'rgba(255, 255, 255, 0.8)',
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

// eslint-disable-next-line react-refresh/only-export-components
export async function loadCompletedWorkoutsFromSupabase({ supabase, userId }) {
    if (!userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('timestamp', { ascending: false })
        .limit(50);

    if (error) {
        throw error;
    }

    return (data || []).map(workout => ({
        ...workout,
        userId: workout.user_id,
        templateId: workout.template_id,
        templateName: workout.template_name,
        dayName: workout.day_name,
        weightUnit: workout.weight_unit,
        completedAt: workout.completed_at,
        createdAt: workout.created_at,
        updatedAt: workout.updated_at,
    }));
}

function getPersistedTemplateId(day, fallbackTemplateId) {
    return day?.templateId || day?.id || fallbackTemplateId || null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function buildWorkoutStartState(program, day) {
    const templateId = day?.templateId || day?.id || null;
    const dayId = templateId;

    return {
        templateId,
        dayId,
        workout: {
            name: `${program?.name || 'Program'} - ${day?.name || 'Workout'}`,
            programName: program?.name || 'Program',
            dayName: day?.name || 'Workout',
            exercises: day?.exercises || [],
        },
    };
}

// eslint-disable-next-line react-refresh/only-export-components
export function findNextDayInProgram(program, completedWorkouts) {
    const days = Array.isArray(program?.days) ? [...program.days] : [];

    if (days.length <= 1) {
        return null;
    }

    const completedTemplateIds = new Set(
        completedWorkouts
            .map(workout => workout.templateId)
            .filter(Boolean)
    );
    const completedDayNames = new Set(
        completedWorkouts
            .map(workout => workout.dayName)
            .filter(Boolean)
    );

    for (const day of days) {
        const dayTemplateId = day?.templateId || day?.id || null;

        if (dayTemplateId && !completedTemplateIds.has(dayTemplateId)) {
            return day;
        }

        if (!dayTemplateId && day?.name && !completedDayNames.has(day.name)) {
            return day;
        }
    }

    return days[0] || null;
}

const WorkoutsTab = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const supabase = useSupabase();
    const { templates, loading: templatesLoading, loadTemplates } = useWorkoutTemplates();
    const { programs, loading: programsLoading, loadPrograms } = useWorkoutPrograms();
    const { createTemplate, createProgram, deleteTemplate, deleteProgram } = useWorkoutMutations();
    const { workoutStarted, exercises } = useWorkoutState();

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
    const [hasOngoingWorkout, setHasOngoingWorkout] = useState(false);
    const [workoutInfo, setWorkoutInfo] = useState(null);
    const [selectedRecommendedWorkout, setSelectedRecommendedWorkout] = useState(null);
    const [editingRecommendation, setEditingRecommendation] = useState(null);

    const handleSubTabChange = (tabIndex) => {
        setActiveSubTab(tabIndex);
    };

    const handleToggleExercises = (day) => {
        setExpandedDay(expandedDay === day ? null : day);
    };

    const handleStartWorkout = (program, day) => {
        console.log('🚀 Starting workout:', { program: program.name, day: day.name });
        navigate('/workout/start', {
            state: buildWorkoutStartState(program, day),
        });
    };

    const handleContinueWorkout = () => {
        navigate('/workout/start');
    };

    const handleClearOngoingWorkout = (e) => {
        e.stopPropagation();
        localStorage.removeItem('workoutState');
        setHasOngoingWorkout(false);
        setWorkoutInfo(null);
    };

    // Weekly performance data - computed from real workout history
    const [weeklyPerformanceData, setWeeklyPerformanceData] = useState([]);

    // AI Recommendation state (matching Home page)
    const AI_RECOMMENDATION_UNLOCK_WORKOUTS = 5;
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(0);
    const isAiUnlocked = completedWorkoutsCount >= AI_RECOMMENDATION_UNLOCK_WORKOUTS;
    const workoutsUntilAiUnlock = Math.max(AI_RECOMMENDATION_UNLOCK_WORKOUTS - completedWorkoutsCount, 0);

    // Check for ongoing workout
    useEffect(() => {
        const savedState = localStorage.getItem('workoutState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.workoutStarted && state.exercises && state.exercises.length > 0) {
                    setHasOngoingWorkout(true);

                    // Calculate progress
                    const totalSets = state.exercises.reduce((total, exercise) =>
                        total + (exercise.sets?.length || 0), 0
                    );
                    const completedSets = state.exercises.reduce((total, exercise) =>
                        total + (exercise.sets?.filter(set => set.completed).length || 0), 0
                    );
                    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

                    // Calculate estimated duration (8 min per exercise as rough estimate)
                    const estimatedDuration = state.exercises.length * 8;

                    setWorkoutInfo({
                        name: state.selectedDay?.name || state.currentTemplate?.name || 'Workout',
                        category: state.currentTemplate?.category || 'Strength Training',
                        duration: estimatedDuration,
                        exerciseCount: state.exercises.length,
                        difficulty: state.currentTemplate?.difficulty || 'Intermediate',
                        progress: Math.round(progress)
                    });
                }
            } catch (error) {
                console.error('Error parsing workout state:', error);
            }
        }
    }, [workoutStarted, exercises]);

    const calculateRecommendations = useCallback((userPrograms, completedWorkouts, userTemplates = []) => {
        const recommendations = [];

        for (const program of userPrograms) {
            if (program.days && program.days.length > 1) {
                const nextDay = findNextDayInProgram(program, completedWorkouts);
                if (nextDay) {
                    recommendations.push({
                        id: `program-${program.id}-${nextDay.id}`,
                        title: `${program.name} - ${nextDay.name}`,
                        category: getTemplateCategory(nextDay),
                        duration: estimateDuration(nextDay),
                        exercises: nextDay.exercises?.length || 0,
                        difficulty: nextDay.difficulty || program.difficulty || 'Intermediate',
                        progress: 0,
                        isAIPick: false,
                        templateId: getPersistedTemplateId(nextDay, program.id),
                        dayId: nextDay.id || getPersistedTemplateId(nextDay, program.id),
                        dayData: nextDay,
                        programId: program.id,
                        programName: program.name,
                        type: 'nextDay',
                    });
                }
            }
        }

        const defaultRecommendations = recommendations.length > 0
            ? recommendations.slice(0, 3)
            : buildStarterWorkoutRecommendations();

        // 🎯 Override starter recommendations with custom user templates matching the same name
        return defaultRecommendations.map(rec => {
            if (rec.type === 'starter' || rec.isAIPick) {
                const matchingTemplate = userTemplates.find(t => t.name.toLowerCase() === rec.title.toLowerCase());
                if (matchingTemplate) {
                    return {
                        ...rec,
                        id: matchingTemplate.id, 
                        duration: estimateTemplateDuration(matchingTemplate) || rec.duration,
                        exercises: getTotalExercises(matchingTemplate) || rec.exercises,
                        difficulty: matchingTemplate.difficulty || rec.difficulty,
                        dayData: {
                            ...rec.dayData,
                            id: matchingTemplate.id,
                            templateId: matchingTemplate.id,
                            exercises: matchingTemplate.workoutDays?.[0]?.exercises || matchingTemplate.exercises || [],
                        }
                    };
                }
            }
            return rec;
        });
    }, []);

    // Load user's completed workouts and calculate recommendations
    useEffect(() => {
        const loadWorkoutData = async () => {
            try {
                setLoading(true);
                const workouts = await loadCompletedWorkoutsFromSupabase({
                    supabase,
                    userId: currentUser.uid,
                });

                // Track total completed workouts for AI unlock
                setCompletedWorkoutsCount(workouts.length);

                // Calculate recommendations based on templates and progress
                const recommendations = calculateRecommendations(programs, workouts, templates);
                setRecommendedWorkouts(recommendations);

                // Compute weekly performance from real data
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)
                weekStart.setHours(0, 0, 0, 0);

                // Initialize all 7 days
                const weekData = dayNames.map((name, i) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(weekStart.getDate() + i);
                    return { date: name, value: 0, dayDate };
                });

                // Fill in performance scores from completed workouts
                workouts.forEach(workout => {
                    const wDate = new Date(workout.timestamp || workout.completedAt);
                    if (wDate >= weekStart) {
                        const dayIndex = wDate.getDay();
                        // Calculate a performance score from the workout
                        const totalSets = workout.exercises?.reduce((sum, ex) =>
                            sum + (ex.sets?.filter(s => s.completed).length || 0), 0) || 0;
                        const totalVolume = workout.exercises?.reduce((sum, ex) =>
                            sum + (ex.sets?.reduce((setSum, s) =>
                                setSum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0) || 0), 0) || 0;
                        // Score: combination of sets completed and volume (normalized roughly)
                        const score = Math.min(100, Math.round((totalSets * 5) + (totalVolume / 50)));
                        weekData[dayIndex].value = Math.max(weekData[dayIndex].value, score);
                    }
                });

                // Remove the dayDate helper before setting state
                setWeeklyPerformanceData(weekData.map(({ date, value }) => ({ date, value })));

            } catch (error) {
                console.error('Error loading workout data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser && !programsLoading) {
            loadWorkoutData();
        }
    }, [currentUser, programs, programsLoading, templates, calculateRecommendations, supabase]);

    // AI Recommendation utility functions (matching Home page)
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
            case 'medium':
                return { backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' };
            case 'low':
            default:
                return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
        }
    };

    const getRecommendationTitle = (recommendation) => {
        if (recommendation.progressionType === 'weight') return 'Increase Weight';
        if (recommendation.progressionType === 'reps') return 'Increase Reps';
        if (recommendation.progressionType === 'deload') return 'Deload Week';
        return 'Progression Suggested';
    };

    const getRecommendationDescription = (recommendation) => {
        if (recommendation.progressionType === 'weight') {
            return `Try increasing ${recommendation.exerciseName} from ${recommendation.currentWeight}kg to ${recommendation.suggestedWeight}kg.`;
        } else if (recommendation.progressionType === 'reps') {
            return `Try increasing reps for ${recommendation.exerciseName} from ${recommendation.currentReps} to ${recommendation.suggestedReps}.`;
        } else if (recommendation.progressionType === 'deload') {
            return `Consider a deload week for ${recommendation.exerciseName}. Reduce weight to ${recommendation.suggestedWeight}kg.`;
        }
        return recommendation.reasoning || `Consider progression for ${recommendation.exerciseName}.`;
    };

    // Load AI recommendations (matching Home page pattern)
    const loadAIRecommendations = useCallback(async () => {
        if (!currentUser?.uid || !supabase || !isAiUnlocked) {
            setAiLoading(false);
            setAiRecommendations([]);
            setAiError('');
            return;
        }

        try {
            setAiLoading(true);
            progressiveOverloadAI.setSupabase(supabase);

            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('AI recommendations timed out')), 30000);
            });

            const loadPromise = (async () => {
                const analyses = await progressiveOverloadAI.analyzeWorkoutHistory(currentUser.uid);
                if (analyses && analyses.length > 0) {
                    const topAnalyses = analyses.slice(0, 3);
                    const exerciseIds = topAnalyses.map(a => a.exerciseId);
                    const batchProgressions = await progressiveOverloadAI.calculateBatchProgressions(currentUser.uid, exerciseIds);
                    return batchProgressions.map((progression, index) => {
                        if (!progression) return null;
                        return {
                            ...progression,
                            ...topAnalyses[index],
                            priority: (progression.confidenceLevel || 0) >= 0.8 ? 'high' :
                                (progression.confidenceLevel || 0) >= 0.6 ? 'medium' : 'low',
                            icon: progression.progressionType === 'weight' ? TrendingUp :
                                progression.progressionType === 'deload' ? Clock : Brain
                        };
                    }).filter(s => s !== null);
                }
                return [];
            })();

            const suggestions = await Promise.race([loadPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            setAiRecommendations(suggestions);
        } catch (error) {
            console.error('Error loading AI recommendations:', error);
            setAiRecommendations([]);
            if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
                setAiError('AI suggestions temporarily unavailable due to high usage.');
            } else {
                setAiError('');
            }
        } finally {
            setAiLoading(false);
        }
    }, [isAiUnlocked, supabase, currentUser?.uid]);

    // Trigger AI recommendation loading
    useEffect(() => {
        if (currentUser?.uid && supabase && !loading) {
            loadAIRecommendations();
        }
    }, [currentUser?.uid, supabase, loading, loadAIRecommendations]);

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

    const handleStarterWorkoutStart = () => {
        if (!selectedRecommendedWorkout) return;

        navigate('/workout/start', {
            state: buildStarterWorkoutStartState(selectedRecommendedWorkout),
        });
        setSelectedRecommendedWorkout(null);
    };

    const handleStarterWorkoutEdit = () => {
        if (!selectedRecommendedWorkout) return;

        setEditingRecommendation({
            ...selectedRecommendedWorkout,
            isAIPick: false,
            title: selectedRecommendedWorkout.title
        });
        setSelectedRecommendedWorkout(null);
    };

    const handleWorkoutClick = (workout) => {
        if (workout.type === 'starter') {
            setSelectedRecommendedWorkout(workout);
            return;
        }

        if (workout.type === 'day') {
            console.log('🚀 Starting day workout:', workout);
            navigate('/workout/start', {
                state: buildWorkoutStartState(
                    {
                        id: workout.programId || workout.templateId,
                        name: workout.programName || workout.title.split(' - ')[0] || 'Workout',
                    },
                    {
                        id: workout.dayId,
                        templateId: workout.templateId,
                        name: workout.dayData?.name || workout.title.split(' - ')[1] || 'Workout',
                        exercises: workout.dayData?.exercises || [],
                    }
                ),
            });
        } else if (workout.type === 'nextDay') {
            navigate('/workout/start', {
                state: buildWorkoutStartState(
                    {
                        id: workout.programId || workout.templateId,
                        name: workout.programName || workout.title.split(' - ')[0] || 'Program',
                    },
                    workout.dayData || {
                        id: workout.dayId,
                        templateId: workout.templateId,
                        name: workout.title.split(' - ')[1] || 'Workout',
                        exercises: [],
                    }
                ),
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
        setCreateModalOpen(false);
        loadTemplates();
    };

    const handleCreateProgram = () => {
        setCreateProgramModalOpen(true);
    };

    const handleProgramCreated = () => {
        setCreateProgramModalOpen(false);
        setEditProgramData(null);
        loadPrograms();
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
        if (!selectedProgram || !currentUser?.uid) return;

        try {
            const duplicatedTemplateIds = [];

            for (const day of selectedProgram.days || []) {
                const createdTemplate = await createTemplate(
                    mapWorkoutDayToTemplateInput(day, {
                        category: selectedProgram.category,
                        difficulty: selectedProgram.difficulty,
                        isCustom: true,
                    })
                );
                duplicatedTemplateIds.push(createdTemplate.id);
            }

            await createProgram({
                name: `${selectedProgram.name} (Copy)`,
                description: selectedProgram.description,
                category: selectedProgram.category,
                difficulty: selectedProgram.difficulty,
                frequency: selectedProgram.frequency,
                duration: selectedProgram.duration,
                templateIds: duplicatedTemplateIds,
            });
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
                await deleteProgram(selectedProgram.id);
                for (const templateId of selectedProgram.templateIds || []) {
                    await deleteTemplate(templateId);
                }
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
                        $active={activeSubTab === 0}
                        onClick={() => handleSubTabChange(0)}
                        startIcon={<MdFlashOn />}
                    >
                        Quick Start
                    </TabButton>
                    <TabButton
                        $active={activeSubTab === 1}
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
                        {/* Continue Workout Card - Show first if available */}
                        {hasOngoingWorkout && workoutInfo && (
                            <Grid item xs={12} md={6} lg={4}>
                                <Card sx={{
                                    height: '100%',
                                    background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(30, 30, 30, 0.95))',
                                    border: '1px solid rgba(221, 237, 0, 0.3)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #dded00 0%, #e8f15d 100%)',
                                    },
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 24px rgba(221, 237, 0, 0.3)',
                                    }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                {workoutInfo.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Chip
                                                    label="AI Pick"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#dded00',
                                                        color: '#000',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={handleClearOngoingWorkout}
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        marginLeft: '8px',
                                                        '&:hover': {
                                                            color: '#f44336',
                                                            backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    <MdDelete size={20} />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                            {workoutInfo.category}
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <MdTimer size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {workoutInfo.duration} min
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {workoutInfo.exerciseCount} exercises
                                            </Typography>
                                            <Chip
                                                label={workoutInfo.difficulty}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(221, 237, 0, 0.15)',
                                                    color: '#dded00',
                                                    fontSize: '0.7rem',
                                                    height: '20px'
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    Progress
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#dded00' }}>
                                                    {workoutInfo.progress}% complete
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={workoutInfo.progress}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        background: 'linear-gradient(90deg, #dded00 0%, #e8f15d 100%)',
                                                        borderRadius: 3,
                                                    },
                                                }}
                                            />
                                        </Box>

                                        <Button
                                            variant="contained"
                                            startIcon={<MdPlayArrow />}
                                            fullWidth
                                            onClick={handleContinueWorkout}
                                            sx={{
                                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                color: '#000',
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                                },
                                            }}
                                        >
                                            Continue
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {loading ? (
                            // Loading skeleton
                            [1, 2].map((i) => (
                                <Grid item xs={12} md={6} lg={4} key={i}>
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
                                <Grid item xs={12} md={6} lg={4} key={workout.id}>
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
                                    // 🎯 NEW: Flatten structure to show individual workout DAYS instead of programs
                                    templates.flatMap((template) => {
                                        // If template has workout days, create a card for each day
                                        if (template.workoutDays && template.workoutDays.length > 0) {
                                            return template.workoutDays.map((day, dayIndex) => {
                                                const dayWorkout = {
                                                    id: `${template.id}-${day.id || dayIndex}`,
                                                    title: `${template.name} - ${day.name}`,
                                                    category: day.category || template.category || 'Strength Training',
                                                    duration: `${Math.ceil((day.exercises?.length || 0) * 8)} min`,
                                                    exercises: day.exercises?.length || 0,
                                                    difficulty: day.difficulty || template.difficulty || 'Intermediate',
                                                    progress: 0,
                                                    isAIPick: template.isAIGenerated || false,
                                                    templateId: getPersistedTemplateId(day, template.id),
                                                    dayId: day.templateId || day.id || getPersistedTemplateId(day, template.id) || `day-${dayIndex}`,
                                                    dayData: day,
                                                    type: 'day'
                                                };

                                                return (
                                                    <Grid item xs={12} sm={6} key={dayWorkout.id}>
                                                        <WorkoutCard onClick={() => handleWorkoutClick(dayWorkout)}>
                                                            <CardContent>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', flexGrow: 1, pr: 1 }}>
                                                                        {dayWorkout.title}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        {dayWorkout.isAIPick && (
                                                                            <AIPick
                                                                                icon={<MdAutoAwesome size={12} />}
                                                                                label="AI Pick"
                                                                                size="small"
                                                                            />
                                                                        )}
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                if (window.confirm('Are you sure you want to delete this workout?')) {
                                                                                    await deleteTemplate(dayWorkout.templateId);
                                                                                    loadTemplates();
                                                                                }
                                                                            }}
                                                                            sx={{
                                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                                '&:hover': {
                                                                                    color: '#f44336',
                                                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                                                }
                                                                            }}
                                                                        >
                                                                            <MdDelete size={20} />
                                                                        </IconButton>
                                                                    </Box>
                                                                </Box>

                                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                                    {dayWorkout.category}
                                                                </Typography>

                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <MdTimer size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                            {dayWorkout.duration}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                        {dayWorkout.exercises} exercises
                                                                    </Typography>
                                                                    <Chip
                                                                        label={dayWorkout.difficulty}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: `${getDifficultyColor(dayWorkout.difficulty)}20`,
                                                                            color: getDifficultyColor(dayWorkout.difficulty),
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
                                            });
                                        } else {
                                            // Template has no days defined, show the template itself as a single workout
                                            const templateWorkout = {
                                                id: template.id,
                                                title: template.name,
                                                category: 'Single Day',
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
                                                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', flexGrow: 1, pr: 1 }}>
                                                                    {templateWorkout.title}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {templateWorkout.isAIPick && (
                                                                        <AIPick
                                                                            icon={<MdAutoAwesome size={12} />}
                                                                            label="AI Pick"
                                                                            size="small"
                                                                        />
                                                                    )}
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm('Are you sure you want to delete this workout?')) {
                                                                                await deleteTemplate(templateWorkout.templateId);
                                                                                loadTemplates();
                                                                            }
                                                                        }}
                                                                        sx={{
                                                                            color: 'rgba(255, 255, 255, 0.5)',
                                                                            '&:hover': {
                                                                                color: '#f44336',
                                                                                backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <MdDelete size={20} />
                                                                    </IconButton>
                                                                </Box>
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
                                        }
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
                            <Card sx={{
                                background: 'rgba(40, 40, 40, 0.6)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                p: 3,
                                mb: 3
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Brain size={20} style={{ color: '#dded00' }} />
                                    <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.125rem' }}>
                                        AI Recommendations
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {aiLoading ? (
                                        <>
                                            {[1, 2, 3].map((i) => (
                                                <Box key={i} sx={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', p: 2.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                        <Skeleton variant="circular" width={20} height={20} />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                                <Skeleton variant="text" width="60%" height={24} />
                                                                <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: '12px' }} />
                                                            </Box>
                                                            <Skeleton variant="text" width="90%" height={20} />
                                                            <Skeleton variant="text" width="70%" height={20} />
                                                            <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </>
                                    ) : aiRecommendations.length > 0 ? (
                                        aiRecommendations.map((recommendation, index) => (
                                            <Box key={recommendation.exerciseId || index} sx={{
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                borderRadius: '12px',
                                                p: 2.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': { background: 'rgba(255, 255, 255, 0.05)' }
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                    <recommendation.icon size={20} style={{ color: '#dded00', marginTop: '2px' }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ color: '#fff', fontSize: '1rem' }}>
                                                                {getRecommendationTitle(recommendation)}
                                                            </Typography>
                                                            <Chip
                                                                label={recommendation.priority}
                                                                size="small"
                                                                sx={{
                                                                    ...getPriorityColor(recommendation.priority),
                                                                    fontSize: '0.7rem',
                                                                    height: 22,
                                                                    '& .MuiChip-label': { px: 1.5 }
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" sx={{
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                            mb: 2.5,
                                                            lineHeight: 1.4,
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            {getRecommendationDescription(recommendation)}
                                                        </Typography>
                                                        <Button
                                                            variant="text"
                                                            size="small"
                                                            sx={{
                                                                color: '#dded00',
                                                                textTransform: 'none',
                                                                fontSize: '0.875rem',
                                                                p: 0,
                                                                minWidth: 'auto',
                                                                '&:hover': { backgroundColor: 'transparent', color: '#e8f15d' }
                                                            }}
                                                            onClick={() => navigate('/workout/start')}
                                                        >
                                                            Start Workout
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))
                                    ) : (
                                        <Box sx={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                                            {aiError ? (
                                                <>
                                                    <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#64b5f6' }}>
                                                        {aiError}
                                                    </Alert>
                                                    <Brain size={32} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} />
                                                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                                                        Using Smart Fallbacks
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                                        Rule-based progression system is still working
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    {isAiUnlocked ? (
                                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                                            AI recommendations are calibrating from your recent workout history
                                                        </Typography>
                                                    ) : (
                                                        <>
                                                            <AIUnlockProgress
                                                                completedWorkouts={completedWorkoutsCount}
                                                                totalWorkouts={AI_RECOMMENDATION_UNLOCK_WORKOUTS}
                                                            />
                                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                                                Complete {workoutsUntilAiUnlock} more workout{workoutsUntilAiUnlock === 1 ? '' : 's'} to unlock AI recommendations
                                                            </Typography>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Card>

                            {/* Weekly Performance Chart */}
                            <Box>
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
                open={createModalOpen || !!editingRecommendation}
                editData={editingRecommendation}
                onClose={() => {
                    setCreateModalOpen(false);
                    setEditingRecommendation(null);
                }}
                onWorkoutCreated={() => {
                    setCreateModalOpen(false);
                    setEditingRecommendation(null);
                    loadTemplates();
                }}
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
            <WorkoutRecommendationPreviewDialog
                open={Boolean(selectedRecommendedWorkout)}
                workout={selectedRecommendedWorkout}
                onClose={() => setSelectedRecommendedWorkout(null)}
                onStart={handleStarterWorkoutStart}
                onEdit={handleStarterWorkoutEdit}
            />
        </Box>
    );
};

export default WorkoutsTab;
