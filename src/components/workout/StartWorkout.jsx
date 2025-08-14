import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Chip,
    TextField,
    Alert,
    Grid2,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,

    Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdPlayArrow,
    MdStop,
    MdTimer,
    MdExpandMore,
    MdFitnessCenter,
    MdLibraryBooks,
    MdClose,
    MdToday,
    MdCheckCircle,
    MdCancel
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';

import { getWeightUnit, getWeightLabel } from '../../utils/weightUnit';

import { useWakeLock } from '../../utils/wakeLock';
import { useNotifications } from '../../utils/notifications';

const StyledCard = styled(Card)(() => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
        },
        '&:hover fieldset': {
            borderColor: '#00ff9f',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00ff9f',
        },
    },
    '& label.Mui-focused': {
        color: '#00ff9f',
    },
});

export default function StartWorkout() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [exercises, setExercises] = useState([]);

    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [weightUnit, setWeightUnitState] = useState('kg');
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [newExercise, setNewExercise] = useState({
        name: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
    });

    // Simple timestamp-based workout tracking
    const [workoutStartTime, setWorkoutStartTime] = useState(null);


    // Wake lock and notifications
    const { requestWakeLock, releaseWakeLock, isSupported: wakeLockSupported } = useWakeLock();
    const {
        requestPermission: requestNotificationPermission,

        showWorkoutComplete,
        isSupported: notificationSupported
    } = useNotifications();

    // Template and exercise selection states
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateDays, setTemplateDays] = useState([]);
    const [templateExercises, setTemplateExercises] = useState([]);

    const [showTemplateSelection, setShowTemplateSelection] = useState(true);
    const [showDaySelection, setShowDaySelection] = useState(false);


    const [showStartModal, setShowStartModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Simple timestamp-based workout tracking - no complex timer needed

    // Persist workout state to localStorage
    const saveWorkoutState = () => {
        if (workoutStarted && currentUser) {
            const workoutState = {
                workoutStarted,
                exercises,
                workoutStartTime: workoutStartTime?.toISOString(),
                currentTemplate: currentTemplate ? {
                    id: currentTemplate.id,
                    name: currentTemplate.name
                } : null,
                selectedDay,
                templateDays,
                templateExercises,
                showTemplateSelection,
                showDaySelection,
                lastActivity: new Date().toISOString(),
                userId: currentUser.uid
            };
            localStorage.setItem('activeWorkoutState', JSON.stringify(workoutState));
        }
    };

    // Restore workout state from localStorage
    const restoreWorkoutState = () => {
        try {
            const savedState = localStorage.getItem('activeWorkoutState');
            if (savedState && currentUser) {
                const state = JSON.parse(savedState);

                // Check if state belongs to current user
                if (state.userId !== currentUser.uid) {
                    localStorage.removeItem('activeWorkoutState');
                    return;
                }

                // Check if workout is older than 2 hours (7200000 ms)
                const lastActivity = new Date(state.lastActivity);
                const now = new Date();
                const timeDiff = now - lastActivity;
                const twoHours = 2 * 60 * 60 * 1000;

                if (timeDiff > twoHours) {
                    localStorage.removeItem('activeWorkoutState');
                    return;
                }

                // Restore state
                setWorkoutStarted(state.workoutStarted);
                setExercises(state.exercises || []);
                setWorkoutStartTime(state.workoutStartTime ? new Date(state.workoutStartTime) : null);
                setCurrentTemplate(state.currentTemplate);
                setSelectedDay(state.selectedDay || '');
                setTemplateDays(state.templateDays || []);
                setTemplateExercises(state.templateExercises || []);
                setShowTemplateSelection(state.showTemplateSelection ?? true);
                setShowDaySelection(state.showDaySelection ?? false);

                console.log('✅ Workout state restored from localStorage');
                setSuccess('Workout progress restored! Your previous session was recovered.');
            }
        } catch (error) {
            console.error('Error restoring workout state:', error);
            localStorage.removeItem('activeWorkoutState');
        }
    };

    // Clear workout state from localStorage
    const clearWorkoutState = () => {
        localStorage.removeItem('activeWorkoutState');
    };

    // Track user activity to update lastActivity timestamp
    const updateActivity = () => {
        if (workoutStarted) {
            const savedState = localStorage.getItem('activeWorkoutState');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    state.lastActivity = new Date().toISOString();
                    localStorage.setItem('activeWorkoutState', JSON.stringify(state));
                } catch (error) {
                    console.error('Error updating activity:', error);
                }
            }
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadTemplates();
            // Restore workout state after user is loaded
            restoreWorkoutState();
        }
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
    }, [currentUser]);

    // Save workout state whenever it changes
    useEffect(() => {
        if (currentUser) {
            saveWorkoutState();
        }
    }, [workoutStarted, exercises, workoutStartTime, currentTemplate, selectedDay, templateDays, templateExercises, showTemplateSelection, showDaySelection, currentUser]);

    // Track user activity
    useEffect(() => {
        if (!workoutStarted) return;

        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            updateActivity();
        };

        // Update activity every 30 seconds while workout is active
        const activityInterval = setInterval(updateActivity, 30000);

        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        return () => {
            clearInterval(activityInterval);
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [workoutStarted]);

    const loadTemplates = async () => {
        try {
            const templatesQuery = query(
                collection(db, 'workoutTemplates'),
                where('userId', '==', currentUser.uid)
            );
            const templateDocs = await getDocs(templatesQuery);
            const templateData = templateDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(templateData);
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };



    const handleStartWorkout = async () => {
        setWorkoutStarted(true);
        setShowTemplateSelection(false);
        setShowDaySelection(false);
        setError('');
        setSuccess('');

        // Record workout start time
        setWorkoutStartTime(new Date());

        // Request wake lock to keep screen awake
        if (wakeLockSupported) {
            const wakeLockAcquired = await requestWakeLock();
            if (wakeLockAcquired) {
                setSuccess('Screen will stay awake during workout');
            }
        }

        // Request notification permission
        if (notificationSupported) {
            await requestNotificationPermission();
        }


    };

    const handleSelectTemplate = () => {
        if (!selectedTemplate) return;

        const template = templates.find(t => t.id === selectedTemplate);
        if (template && template.workoutDays && template.workoutDays.length > 0) {
            setCurrentTemplate(template);
            setTemplateDays(template.workoutDays);
            setShowTemplateSelection(false);
            setShowDaySelection(true);
        }
    };

    const handleSelectDay = async () => {
        if (!selectedDay) return;

        const day = templateDays.find(d => d.id.toString() === selectedDay);
        if (day && day.exercises) {
            const exercisesWithSets = day.exercises.map(ex => ({
                ...ex,
                columns: ex.columns || [
                    { type: 'reps', label: 'Reps' },
                    { type: 'weight', label: 'Weight' }
                ],
                sets: [{
                    reps: 10,
                    weight: 0,
                    completed: false,
                    weightType: 'weight',
                    weightUnit: 'kg'
                }]
            }));
            setTemplateExercises(exercisesWithSets);
            setExercises(exercisesWithSets);
        }

        // Start workout immediately after selecting day
        setWorkoutStarted(true);
        setShowDaySelection(false);
        setError('');
        setSuccess('');

        // Record workout start time
        setWorkoutStartTime(new Date());

        // Request wake lock to keep screen awake
        if (wakeLockSupported) {
            const wakeLockAcquired = await requestWakeLock();
            if (wakeLockAcquired) {
                setSuccess('Screen will stay awake during workout');
            }
        }

        // Request notification permission
        if (notificationSupported) {
            await requestNotificationPermission();
        }
    };

    const handleBackToTemplateSelection = () => {
        setShowTemplateSelection(true);
        setShowDaySelection(false);
        setSelectedTemplate('');
        setSelectedDay('');
        setCurrentTemplate(null);
        setTemplateDays([]);
        setTemplateExercises([]);
    };

    const handleCancelWorkout = () => {
        if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
            clearWorkoutState();
            setWorkoutStarted(false);
            setExercises([]);
            setTemplateExercises([]);
            setCurrentTemplate(null);
            setTemplateDays([]);
            setSelectedTemplate('');
            setSelectedDay('');
            setShowTemplateSelection(true);
            setShowDaySelection(false);
            setWorkoutStartTime(null);
        }
    };



    const handleBackToDaySelection = () => {
        setShowDaySelection(true);
        setShowTemplateSelection(false);
        setSelectedDay('');
        setExercises([]);
        setWorkoutStarted(false);
    };



    const handleSetChange = (exerciseIndex, setIndex, field, value) => {
        const updatedExercises = [...exercises];
        updatedExercises[exerciseIndex].sets[setIndex][field] = value;
        setExercises(updatedExercises);
    };

    const toggleSetCompletion = (exerciseIndex, setIndex) => {
        const updatedExercises = [...exercises];
        const currentCompleted = updatedExercises[exerciseIndex].sets[setIndex].completed;
        updatedExercises[exerciseIndex].sets[setIndex].completed = !currentCompleted;
        setExercises(updatedExercises);
    };




    const handleFinishWorkout = async () => {
        if (exercises.length === 0) {
            setError('Please add at least one exercise before finishing the workout');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const endTime = new Date();

            // Calculate workout duration in seconds
            const durationInSeconds = workoutStartTime ? Math.floor((endTime - workoutStartTime) / 1000) : 0;

            const workoutTimestamp = endTime.toISOString();

            // Save the workout as a whole with template information
            const workoutData = {
                userId: currentUser.uid,
                exercises: exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.map(set => ({ reps: set.reps, weight: set.weight, completed: set.completed }))
                })),
                startTime: workoutStartTime ? workoutStartTime.toISOString() : workoutTimestamp,
                endTime: workoutTimestamp,
                duration: durationInSeconds,
                timestamp: workoutTimestamp
            };

            // Add template information if this was a template-based workout
            if (currentTemplate && selectedDay) {
                const selectedDayData = templateDays.find(d => d.id.toString() === selectedDay);
                workoutData.templateInfo = {
                    templateId: currentTemplate.id,
                    templateName: currentTemplate.name,
                    dayId: selectedDay,
                    dayName: selectedDayData?.name || `Day ${selectedDay}`
                };
            }

            await addDoc(collection(db, 'workouts'), workoutData);

            // Save each exercise individually for progress tracking
            const exercisePromises = exercises.map(exercise => {
                const exerciseData = {
                    userId: currentUser.uid,
                    exerciseName: exercise.name,
                    sets: exercise.sets.map(set => ({ reps: set.reps, weight: set.weight, completed: set.completed })),
                    notes: exercise.notes || '',
                    timestamp: workoutTimestamp,
                    source: 'workout'
                };

                // Add template information for progress tracking
                if (currentTemplate && selectedDay) {
                    const selectedDayData = templateDays.find(d => d.id.toString() === selectedDay);
                    exerciseData.templateInfo = {
                        templateId: currentTemplate.id,
                        templateName: currentTemplate.name,
                        dayId: selectedDay,
                        dayName: selectedDayData?.name || `Day ${selectedDay}`
                    };
                }

                return addDoc(collection(db, 'exercises'), exerciseData);
            });

            await Promise.all(exercisePromises);

            console.log(`✅ Workout saved with ${exercises.length} exercises saved individually for progress tracking`);

            const templateInfo = currentTemplate && selectedDay
                ? ` Template: ${currentTemplate.name} - ${templateDays.find(d => d.id.toString() === selectedDay)?.name}`
                : '';

            setSuccess(`Workout saved successfully!${templateInfo} ${exercises.length} exercises added to progress tracking.`);

            // Release wake lock
            if (wakeLockSupported) {
                await releaseWakeLock();
            }

            // Show completion notification
            if (notificationSupported) {
                showWorkoutComplete(durationInSeconds, exercises.length);
            }

            // Clear saved workout state
            clearWorkoutState();

            // Reset states
            setWorkoutStarted(false);
            setExercises([]);
            setTemplateExercises([]);
            setCurrentTemplate(null);
            setTemplateDays([]);
            setSelectedTemplate('');
            setSelectedDay('');
            setShowTemplateSelection(true);
            setShowDaySelection(false);
            setWorkoutStartTime(null);

            // Navigate to history page after short delay
            setTimeout(() => {
                navigate('/history');
            }, 2000);

        } catch (error) {
            console.error('Error saving workout:', error);
            setError('Error saving workout: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExercise = (indexToDelete) => {
        setExercises(exercises.filter((_, index) => index !== indexToDelete));
    };

    const handleAddExercise = () => {
        if (!newExercise.name || !newExercise.weight || !newExercise.reps || !newExercise.sets) {
            setError('Please fill in all required fields');
            return;
        }

        const setsArray = Array.from({ length: parseInt(newExercise.sets) }, () => ({
            reps: parseInt(newExercise.reps),
            weight: parseFloat(newExercise.weight),
            completed: false,
            weightType: 'weight',
            weightUnit: 'kg'
        }));

        setExercises([...exercises, {
            ...newExercise,
            columns: [
                { type: 'reps', label: 'Reps' },
                { type: 'weight', label: 'Weight' }
            ],
            sets: setsArray
        }]);

        setNewExercise({
            name: '',
            weight: '',
            reps: '',
            sets: '',
            notes: ''
        });

        setOpenDialog(false);
    };

    // Handle exercise selection from the ExerciseSelector
    const handleExerciseSelectFromSelector = (exerciseData) => {
        if (!exerciseData) {
            // Clear form when no exercise is selected
            setNewExercise({
                name: '',
                weight: '',
                reps: '',
                sets: '',
                notes: ''
            });
            return;
        }

        console.log('🔍 Exercise selected in StartWorkout:', exerciseData);

        // Update exercise form with auto-populated data
        setNewExercise({
            name: exerciseData.name,
            weight: exerciseData.defaultWeight || '',
            reps: exerciseData.defaultReps || '',
            sets: exerciseData.defaultSets || '',
            notes: exerciseData.notes || ''
        });
    };

    const handleExerciseChange = (e) => {
        const { name, value } = e.target;
        setNewExercise(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Format time helper function
    const formatTime = (date) => {
        if (!date) return '--:--';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const allExercises = useMemo(() => {
        return exercises;
    }, [exercises]);


    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444'
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                            color: '#00ff9f'
                        }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                        {workoutStarted
                            ? currentTemplate
                                ? `${currentTemplate.name} - ${templateDays.find(d => d.id.toString() === selectedDay)?.name || 'Active Workout'}`
                                : 'Active Workout'
                            : showDaySelection
                                ? `${currentTemplate?.name} - Select Day`
                                : 'Start Workout'
                        }
                    </Typography>
                    {workoutStarted && workoutStartTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                icon={<MdTimer />}
                                label={`Started: ${formatTime(workoutStartTime)}`}
                                sx={{
                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                    color: '#00ff9f',
                                    '& .MuiChip-icon': { color: '#00ff9f' }
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Template Selection (shown before workout starts) */}
                {!workoutStarted && showTemplateSelection && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdLibraryBooks /> Choose How to Start
                            </Typography>

                            {/* Template Selection */}
                            {templates.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                        Start from Template
                                    </Typography>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            Select Workout Template
                                        </InputLabel>
                                        <Select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            sx={{
                                                color: '#fff',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(0, 255, 159, 0.5)',
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#00ff9f',
                                                },
                                            }}
                                        >
                                            {templates.map(template => (
                                                <MenuItem key={template.id} value={template.id}>
                                                    <Box>
                                                        <Typography sx={{ color: '#fff' }}>
                                                            {template.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {template.workoutDays?.length || 0} days
                                                            {template.description && ` • ${template.description}`}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<MdToday />}
                                        onClick={handleSelectTemplate}
                                        disabled={!selectedTemplate}
                                        sx={{
                                            background: selectedTemplate ? 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)' : 'rgba(255, 255, 255, 0.1)',
                                            color: selectedTemplate ? '#000' : 'rgba(255, 255, 255, 0.5)',
                                            fontWeight: 'bold',
                                            mb: 2
                                        }}
                                    >
                                        Select Template Day
                                    </Button>
                                </Box>
                            )}

                            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

                            {/* Free Workout Option */}
                            <Box>
                                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                    Start Free Workout
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<MdFitnessCenter />}
                                    onClick={handleStartWorkout}
                                    sx={{
                                        borderColor: '#00ff9f',
                                        color: '#00ff9f',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            borderColor: '#00e676',
                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                        },
                                    }}
                                >
                                    Start Empty Workout
                                </Button>
                            </Box>
                        </CardContent>
                    </StyledCard>
                )}

                {!workoutStarted && templates.length === 0 && showTemplateSelection && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdPlayArrow />}
                                onClick={handleStartWorkout}
                                sx={{
                                    background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                }}
                            >
                                Start Workout
                            </Button>
                        </CardContent>
                    </StyledCard>
                )}

                {/* Day Selection (shown after template is selected) */}
                {!workoutStarted && showDaySelection && currentTemplate && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ color: '#00ff9f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdToday /> Select Workout Day
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleBackToTemplateSelection}
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        '&:hover': {
                                            borderColor: '#00ff9f',
                                            color: '#00ff9f',
                                        },
                                    }}
                                >
                                    ← Back to Templates
                                </Button>
                            </Box>

                            <Typography variant="body1" sx={{ color: '#fff', mb: 3 }}>
                                Template: <strong>{currentTemplate.name}</strong>
                            </Typography>

                            <Grid2 container spacing={2}>
                                {templateDays.map(day => (
                                    <Grid2 xs={12} sm={6} key={day.id}>
                                        <Card
                                            sx={{
                                                background: selectedDay === day.id.toString()
                                                    ? 'rgba(0, 255, 159, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.05)',
                                                border: selectedDay === day.id.toString()
                                                    ? '2px solid #00ff9f'
                                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 20px rgba(0, 255, 159, 0.2)',
                                                }
                                            }}
                                            onClick={() => {
                                                setSelectedDay(day.id.toString());
                                                setShowStartModal(true);
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                                        {day.name}
                                                    </Typography>
                                                    {selectedDay === day.id.toString() && (
                                                        <MdCheckCircle style={{ color: '#00ff9f' }} />
                                                    )}
                                                </Box>

                                                {/* Muscle Groups */}
                                                {day.muscleGroups && day.muscleGroups.length > 0 && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                                                            Target Muscles:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {day.muscleGroups.map(mg => (
                                                                <Chip
                                                                    key={mg.id}
                                                                    label={mg.name}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                        color: '#00ff9f',
                                                                        fontSize: '0.75rem'
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}

                                                {/* Exercise Count */}
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {day.exercises?.length || 0} exercises
                                                </Typography>

                                                {/* Exercise Preview */}
                                                {day.exercises && day.exercises.length > 0 && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {day.exercises.slice(0, 3).map(ex => ex.name).join(', ')}
                                                            {day.exercises.length > 3 && ` +${day.exercises.length - 3} more`}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid2>
                                ))}
                            </Grid2>


                        </CardContent>
                    </StyledCard>
                )}

                {/* Start Workout Modal */}
                <Dialog
                    open={showStartModal}
                    onClose={() => setShowStartModal(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                            border: '1px solid rgba(0, 255, 159, 0.3)',
                            borderRadius: 2,
                        }
                    }}
                >
                    <DialogTitle sx={{
                        color: '#00ff9f',
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(0, 255, 159, 0.2)',
                        pb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <MdPlayArrow />
                            Ready to Start Workout?
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        {selectedDay && templateDays.find(d => d.id.toString() === selectedDay) && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                    {templateDays.find(d => d.id.toString() === selectedDay)?.name}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                                    Template: <strong style={{ color: '#00ff9f' }}>{currentTemplate?.name}</strong>
                                </Typography>

                                {/* Show exercise count and muscle groups */}
                                {(() => {
                                    const selectedDayData = templateDays.find(d => d.id.toString() === selectedDay);
                                    return (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                                                {selectedDayData?.exercises?.length || 0} exercises
                                            </Typography>

                                            {selectedDayData?.muscleGroups && selectedDayData.muscleGroups.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1, display: 'block' }}>
                                                        Target Muscles:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                                        {selectedDayData.muscleGroups.map(mg => (
                                                            <Chip
                                                                key={mg.id}
                                                                label={mg.name}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                    color: '#00ff9f',
                                                                    fontSize: '0.75rem'
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })()}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={() => setShowStartModal(false)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                }
                            }}
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowStartModal(false);
                                handleSelectDay();
                            }}
                            variant="contained"
                            startIcon={<MdPlayArrow />}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                px: 3,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                }
                            }}
                        >
                            Start Workout
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Cancel Workout Confirmation Modal */}
                <Dialog
                    open={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                            border: '1px solid rgba(255, 68, 68, 0.3)',
                            borderRadius: 2,
                        }
                    }}
                >
                    <DialogTitle sx={{
                        color: '#ff4444',
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(255, 68, 68, 0.2)',
                        pb: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <MdCancel />
                            Cancel Workout?
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                Are you sure you want to cancel this workout?
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                                All your progress will be lost and will not be saved.
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 68, 68, 0.8)' }}>
                                This action cannot be undone.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={() => setShowCancelModal(false)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                }
                            }}
                            variant="outlined"
                        >
                            Keep Workout
                        </Button>
                        <Button
                            onClick={() => {
                                setShowCancelModal(false);
                                handleCancelWorkout();
                            }}
                            variant="contained"
                            startIcon={<MdCancel />}
                            sx={{
                                background: 'linear-gradient(45deg, #ff4444 30%, #ff1744 90%)',
                                color: '#fff',
                                fontWeight: 'bold',
                                px: 3,
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #ff1744 30%, #ff4444 90%)',
                                }
                            }}
                        >
                            Yes, Cancel Workout
                        </Button>
                    </DialogActions>
                </Dialog>

                {workoutStarted && (
                    <>
                        <StyledCard sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<MdCancel />}
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={loading}
                                        sx={{
                                            borderColor: '#ff4444',
                                            color: '#ff4444',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                borderColor: '#ff1744',
                                                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                                color: '#ff1744'
                                            }
                                        }}
                                    >
                                        Cancel Workout
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<MdStop />}
                                        onClick={handleFinishWorkout}
                                        disabled={loading}
                                        sx={{
                                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                            }
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Finish Workout'}
                                    </Button>
                                    {currentTemplate && (
                                        <Button
                                            variant="outlined"
                                            onClick={handleBackToDaySelection}
                                            sx={{
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                minWidth: '140px',
                                                '&:hover': {
                                                    borderColor: '#00ff9f',
                                                    color: '#00ff9f',
                                                },
                                            }}
                                        >
                                            ← Change Day
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </StyledCard>

                        {workoutStarted && (
                            <>
                                <List>
                                    {allExercises.map((exercise, exerciseIndex) => (
                                        <Accordion key={exerciseIndex} sx={{
                                            background: 'rgba(30, 30, 30, 0.9)',
                                            color: 'white',
                                            mb: 2,
                                            borderRadius: '16px',
                                            '&.Mui-expanded': {
                                                margin: '16px 0',
                                            },
                                            boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}>
                                            <AccordionSummary
                                                expandIcon={<MdExpandMore sx={{ color: '#00ff9f' }} />}
                                                aria-controls={`panel${exerciseIndex}-content`}
                                                id={`panel${exerciseIndex}-header`}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                    <Typography sx={{ color: '#00ff9f' }}>{exercise.name}</Typography>
                                                    <IconButton
                                                        edge="end"
                                                        sx={{ color: '#ff4444' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExercise(exerciseIndex);
                                                        }}
                                                    >
                                                        <MdDelete />
                                                    </IconButton>
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                {/* Individual Set Cards */}
                                                {exercise.sets.map((set, setIndex) => (
                                                    <Card
                                                        key={setIndex}
                                                        sx={{
                                                            mb: 2,
                                                            bgcolor: 'rgba(40, 50, 70, 0.3)',
                                                            border: `1px solid ${set.completed ? '#00ff9f' : 'rgba(255, 255, 255, 0.1)'}`,
                                                            borderRadius: 2,
                                                            backdropFilter: 'blur(10px)'
                                                        }}
                                                    >
                                                        <CardContent sx={{ p: 2 }}>
                                                            {/* Set Header */}
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                <Chip
                                                                    label={`SET ${setIndex + 1}`}
                                                                    sx={{
                                                                        bgcolor: '#4a90e2',
                                                                        color: '#fff',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setExercises(prev => prev.map((ex, idx) => {
                                                                            if (idx === exerciseIndex) {
                                                                                return {
                                                                                    ...ex,
                                                                                    sets: ex.sets.filter((_, sIdx) => sIdx !== setIndex)
                                                                                };
                                                                            }
                                                                            return ex;
                                                                        }));
                                                                    }}
                                                                    sx={{ color: '#ff4444' }}
                                                                >
                                                                    <MdDelete />
                                                                </IconButton>
                                                            </Box>

                                                            {/* Set Fields */}
                                                            <Grid container spacing={2}>
                                                                {/* Reps Field */}
                                                                <Grid item xs={12} sm={6}>
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, display: 'block' }}>
                                                                            Reps
                                                                        </Typography>
                                                                        <StyledTextField
                                                                            type="number"
                                                                            placeholder="0"
                                                                            defaultValue={set.reps}
                                                                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                                            size="small"
                                                                            fullWidth
                                                                            sx={{
                                                                                '.MuiInputBase-input': {
                                                                                    textAlign: 'center',
                                                                                    padding: '12px',
                                                                                    fontSize: '1rem'
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Grid>

                                                                {/* Weight Field */}
                                                                <Grid item xs={12} sm={6}>
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, display: 'block' }}>
                                                                            Weight
                                                                        </Typography>

                                                                        {/* Weight Type Dropdown */}
                                                                        <Select
                                                                            value={set.weightType || 'weight'}
                                                                            onChange={(e) => {
                                                                                setExercises(prev => prev.map((ex, idx) => {
                                                                                    if (idx === exerciseIndex) {
                                                                                        const newSets = [...ex.sets];
                                                                                        newSets[setIndex] = { ...newSets[setIndex], weightType: e.target.value };
                                                                                        return { ...ex, sets: newSets };
                                                                                    }
                                                                                    return ex;
                                                                                }));
                                                                            }}
                                                                            size="small"
                                                                            fullWidth
                                                                            sx={{
                                                                                mb: 1,
                                                                                bgcolor: 'rgba(50, 60, 80, 0.8)',
                                                                                color: '#fff',
                                                                                '& .MuiOutlinedInput-notchedOutline': {
                                                                                    borderColor: 'rgba(255, 255, 255, 0.3)'
                                                                                },
                                                                                '& .MuiSvgIcon-root': {
                                                                                    color: '#fff'
                                                                                }
                                                                            }}
                                                                        >
                                                                            <MenuItem value="bodyweight">Bodyweight</MenuItem>
                                                                            <MenuItem value="weight">Weight</MenuItem>
                                                                        </Select>

                                                                        {/* Weight Input */}
                                                                        {set.weightType === 'bodyweight' ? (
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    height: '48px',
                                                                                    bgcolor: 'rgba(0, 255, 159, 0.1)',
                                                                                    border: '1px solid rgba(0, 255, 159, 0.3)',
                                                                                    borderRadius: 1,
                                                                                    color: '#00ff9f',
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '1.1rem'
                                                                                }}
                                                                            >
                                                                                Bodyweight
                                                                            </Box>
                                                                        ) : (
                                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                                <StyledTextField
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    defaultValue={set.weight}
                                                                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        flex: 1,
                                                                                        '.MuiInputBase-input': {
                                                                                            textAlign: 'center',
                                                                                            padding: '12px',
                                                                                            fontSize: '1rem'
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <Select
                                                                                    value={set.weightUnit || weightUnit}
                                                                                    onChange={(e) => {
                                                                                        setExercises(prev => prev.map((ex, idx) => {
                                                                                            if (idx === exerciseIndex) {
                                                                                                const newSets = [...ex.sets];
                                                                                                newSets[setIndex] = { ...newSets[setIndex], weightUnit: e.target.value };
                                                                                                return { ...ex, sets: newSets };
                                                                                            }
                                                                                            return ex;
                                                                                        }));
                                                                                    }}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        minWidth: 70,
                                                                                        bgcolor: 'rgba(50, 60, 80, 0.8)',
                                                                                        color: '#fff',
                                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                                            borderColor: 'rgba(255, 255, 255, 0.3)'
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <MenuItem value="kg">kg</MenuItem>
                                                                                    <MenuItem value="lbs">lbs</MenuItem>
                                                                                </Select>
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>

                                                            {/* Finish Set Button */}
                                                            <Button
                                                                fullWidth
                                                                variant="contained"
                                                                onClick={() => toggleSetCompletion(exerciseIndex, setIndex)}
                                                                sx={{
                                                                    mt: 2,
                                                                    bgcolor: set.completed ? '#00ff9f' : '#4a90e2',
                                                                    color: set.completed ? '#000' : '#fff',
                                                                    fontWeight: 'bold',
                                                                    '&:hover': {
                                                                        bgcolor: set.completed ? '#00e676' : '#357abd'
                                                                    }
                                                                }}
                                                            >
                                                                {set.completed ? '✓ Set Completed' : 'Finish Set'}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                {/* Add Set and Next Exercise Buttons */}
                                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<MdAdd />}
                                                        onClick={() => {
                                                            setExercises(prev => prev.map((ex, idx) => {
                                                                if (idx === exerciseIndex) {
                                                                    return {
                                                                        ...ex,
                                                                        sets: [...ex.sets, { reps: 10, weight: 0, completed: false, weightType: 'weight', weightUnit: 'kg' }]
                                                                    };
                                                                }
                                                                return ex;
                                                            }));
                                                        }}
                                                        sx={{
                                                            bgcolor: '#28a745',
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            '&:hover': {
                                                                bgcolor: '#218838'
                                                            }
                                                        }}
                                                    >
                                                        Add Set
                                                    </Button>
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        startIcon={<MdPlayArrow />}
                                                        onClick={() => {
                                                            // Scroll to next exercise or show completion
                                                            if (exerciseIndex < exercises.length - 1) {
                                                                const nextAccordion = document.querySelector(`#panel${exerciseIndex + 1}-header`);
                                                                if (nextAccordion) {
                                                                    nextAccordion.click();
                                                                    nextAccordion.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }
                                                            } else {
                                                                // Last exercise - could show completion message
                                                                setSuccess('Great job! You have completed all exercises. Ready to finish your workout?');
                                                            }
                                                        }}
                                                        sx={{
                                                            bgcolor: '#4a90e2',
                                                            color: '#fff',
                                                            fontWeight: 'bold',
                                                            '&:hover': {
                                                                bgcolor: '#357abd'
                                                            }
                                                        }}
                                                    >
                                                        Next Exercise
                                                    </Button>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </List>

                                <Fab
                                    color="primary"
                                    sx={{
                                        position: 'fixed',
                                        bottom: 72,
                                        right: 16,
                                        background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                    }}
                                    onClick={() => setOpenDialog(true)}
                                >
                                    <MdAdd />
                                </Fab>
                            </>
                        )}
                    </>
                )}

                <Dialog
                    open={openDialog}
                    onClose={() => {
                        setOpenDialog(false);
                    }}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        style: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Add Exercise
                        <IconButton onClick={() => setOpenDialog(false)} sx={{ color: '#fff' }}>
                            <MdClose />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        {/* Template Exercises Quick Select */}
                        {templateExercises.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                    From Your Template
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    Quick-select from {templateDays.find(d => d.id.toString() === selectedDay)?.name || 'your routine'}:
                                </Typography>
                                <Grid2 container spacing={1}>
                                    {templateExercises
                                        .filter(templateEx => !exercises.some(workoutEx => workoutEx.name === templateEx.name))
                                        .map((exercise, index) => (
                                            <Grid2 key={exercise.id || index}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => {
                                                        const setsArray = [{
                                                            reps: 10,
                                                            weight: 0,
                                                            completed: false,
                                                            weightType: 'weight',
                                                            weightUnit: 'kg'
                                                        }];
                                                        const exerciseWithColumns = {
                                                            ...exercise,
                                                            columns: exercise.columns || [
                                                                { type: 'reps', label: 'Reps' },
                                                                { type: 'weight', label: 'Weight' }
                                                            ],
                                                            sets: setsArray
                                                        };
                                                        setExercises(prev => [...prev, exerciseWithColumns]);
                                                    }}
                                                    sx={{
                                                        borderColor: newExercise.name === exercise.name ? '#00ff9f' : 'rgba(255, 255, 255, 0.3)',
                                                        color: newExercise.name === exercise.name ? '#00ff9f' : '#fff',
                                                        backgroundColor: newExercise.name === exercise.name ? 'rgba(0, 255, 159, 0.1)' : 'transparent',
                                                        '&:hover': {
                                                            borderColor: '#00ff9f',
                                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                        },
                                                        textTransform: 'none',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {exercise.name}
                                                </Button>
                                            </Grid2>
                                        ))}
                                </Grid2>
                                {templateExercises.filter(templateEx => !exercises.some(workoutEx => workoutEx.name === templateEx.name)).length === 0 && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        All template exercises have been added to your workout ✓
                                    </Typography>
                                )}
                                <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', my: 3 }} />
                            </Box>
                        )}

                        {/* Exercise Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                {templateExercises.length > 0 ? 'Search More Exercises' : 'Select Exercise'}
                            </Typography>
                            <ExerciseSelector
                                onExerciseSelect={handleExerciseSelectFromSelector}
                                placeholder={templateExercises.length > 0 ? "Search database or add custom exercise..." : "Select exercise or add new..."}
                                showCustomEntry={true}
                                includeHistory={true}
                                includeTemplates={false}
                                sx={{ mb: 2 }}
                            />
                        </Box>

                        {/* Exercise Details Form */}
                        <Box component="form" sx={{ mt: 2 }}>
                            <Grid2 container spacing={2}>
                                <Grid2 xs={12}>
                                    <StyledTextField
                                        fullWidth
                                        label="Exercise Name"
                                        name="name"
                                        value={newExercise.name}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid2>
                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label={getWeightLabel(weightUnit)}
                                        name="weight"
                                        type="number"
                                        value={newExercise.weight}
                                        onChange={handleExerciseChange}
                                        required
                                        helperText={weightUnit === 'kg' ? 'Enter weight in kilograms' : 'Enter weight in pounds'}
                                        FormHelperTextProps={{
                                            sx: { color: 'text.secondary' }
                                        }}
                                    />
                                </Grid2>
                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Reps"
                                        name="reps"
                                        type="number"
                                        value={newExercise.reps}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid2>
                                <Grid2 xs={12} sm={4}>
                                    <StyledTextField
                                        fullWidth
                                        label="Sets"
                                        name="sets"
                                        type="number"
                                        value={newExercise.sets}
                                        onChange={handleExerciseChange}
                                        required
                                    />
                                </Grid2>
                                <Grid2 xs={12}>
                                    <StyledTextField
                                        fullWidth
                                        label="Notes (optional)"
                                        name="notes"
                                        multiline
                                        rows={2}
                                        value={newExercise.notes}
                                        onChange={handleExerciseChange}
                                    />
                                </Grid2>
                            </Grid2>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            onClick={() => {
                                setOpenDialog(false);
                                setNewExercise({
                                    name: '',
                                    weight: '',
                                    reps: '',
                                    sets: '',
                                    notes: ''
                                });
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddExercise}
                            disabled={!newExercise.name || !newExercise.weight || !newExercise.reps || !newExercise.sets}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                },
                                '&:disabled': {
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.3)',
                                },
                            }}
                        >
                            Add Exercise
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}