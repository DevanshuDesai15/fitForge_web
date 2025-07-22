import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
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
    ListItemButton
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
    MdEdit,
    MdCheck,
    MdCancel
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';
import { getWeightUnit, getWeightLabel } from '../../utils/weightUnit';

const StyledCard = styled(Card)(({ theme }) => ({
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
    const [workoutTime, setWorkoutTime] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [completedSets, setCompletedSets] = useState({});
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

    // Template and exercise selection states
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateDays, setTemplateDays] = useState([]);
    const [templateExercises, setTemplateExercises] = useState([]);
    const [previousExercises, setPreviousExercises] = useState([]);
    const [showTemplateSelection, setShowTemplateSelection] = useState(true);
    const [showDaySelection, setShowDaySelection] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);

    useEffect(() => {
        let interval;
        if (workoutStarted) {
            interval = setInterval(() => {
                setWorkoutTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [workoutStarted]);

    useEffect(() => {
        if (currentUser) {
            loadTemplates();
            loadPreviousExercises();
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

    const loadPreviousExercises = async () => {
        try {
            const exercisesQuery = query(
                collection(db, 'exercises'),
                where('userId', '==', currentUser.uid)
            );
            const exerciseDocs = await getDocs(exercisesQuery);
            const exerciseData = exerciseDocs.docs.map(doc => doc.data());

            // Get unique exercises with their latest data
            const uniqueExercises = exerciseData.reduce((acc, exercise) => {
                const name = exercise.exerciseName;
                if (!acc[name] || new Date(exercise.timestamp) > new Date(acc[name].timestamp)) {
                    acc[name] = exercise;
                }
                return acc;
            }, {});

            setPreviousExercises(Object.values(uniqueExercises));
        } catch (err) {
            console.error('Error loading previous exercises:', err);
        }
    };

    const handleStartWorkout = () => {
        setWorkoutStarted(true);
        setWorkoutTime(0);
        setShowTemplateSelection(false);
        setShowDaySelection(false);
        setError('');
        setSuccess('');
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

    const handleSelectDay = () => {
        if (!selectedDay) return;

        const day = templateDays.find(d => d.id.toString() === selectedDay);
        if (day && day.exercises) {
            const exercisesWithSets = day.exercises.map(ex => ({
                ...ex,
                sets: Array.from({ length: ex.sets || 3 }, () => ({ reps: ex.reps || 10, weight: ex.weight || 0, completed: false }))
            }));
            setTemplateExercises(exercisesWithSets);
            setExercises(exercisesWithSets);
        }

        // Start workout immediately after selecting day
        setWorkoutStarted(true);
        setWorkoutTime(0);
        setShowDaySelection(false);
        setError('');
        setSuccess('');
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

    const handleBackToDaySelection = () => {
        setShowDaySelection(true);
        setShowTemplateSelection(false);
        setSelectedDay('');
        setExercises([]);
        setWorkoutStarted(false);
        setWorkoutTime(0);
    };

    const handleEditExercise = (index) => {
        setEditingExercise(index);
    };

    const handleSaveExerciseEdit = (index, updatedExercise) => {
        setExercises(prev => prev.map((ex, i) => i === index ? updatedExercise : ex));
        setEditingExercise(null);
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


    const handleCancelExerciseEdit = () => {
        setEditingExercise(null);
    };

    const handleFinishWorkout = async () => {
        if (exercises.length === 0) {
            setError('Please add at least one exercise before finishing the workout');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const workoutTimestamp = new Date().toISOString();

            // Save the workout as a whole with template information
            const workoutData = {
                userId: currentUser.uid,
                exercises: exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.map(set => ({ reps: set.reps, weight: set.weight, completed: set.completed }))
                })),
                duration: workoutTime,
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

            // Reset states
            setWorkoutStarted(false);
            setExercises([]);
            setWorkoutTime(0);
            setTemplateExercises([]);
            setCurrentTemplate(null);
            setTemplateDays([]);
            setSelectedTemplate('');
            setSelectedDay('');
            setShowTemplateSelection(true);
            setShowDaySelection(false);

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
            completed: false
        }));

        setExercises([...exercises, {
            ...newExercise,
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

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                    {workoutStarted && (
                        <Chip
                            icon={<MdTimer />}
                            label={formatTime(workoutTime)}
                            sx={{
                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                color: '#00ff9f',
                                '& .MuiChip-icon': { color: '#00ff9f' }
                            }}
                        />
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
                                            onClick={() => setSelectedDay(day.id.toString())}
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

                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdPlayArrow />}
                                onClick={handleSelectDay}
                                disabled={!selectedDay}
                                sx={{
                                    mt: 3,
                                    background: selectedDay ? 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)' : 'rgba(255, 255, 255, 0.1)',
                                    color: selectedDay ? '#000' : 'rgba(255, 255, 255, 0.5)',
                                    fontWeight: 'bold',
                                }}
                            >
                                Start Workout Day
                            </Button>
                        </CardContent>
                    </StyledCard>
                )}

                {workoutStarted && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<MdStop />}
                                    onClick={handleFinishWorkout}
                                    disabled={loading}
                                    sx={{
                                        background: 'linear-gradient(45deg, #ff4444 30%, #ff1744 90%)',
                                        color: '#fff',
                                        fontWeight: 'bold',
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
                )}

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
                                        <Box display="flex" alignItems="center" sx={{ mb: 1, gap: 1, pr: 1, pl: 1 }}>
                                            <Box sx={{ flex: '0 0 40px', textAlign: 'center' }}><Typography variant="caption" sx={{ fontWeight: 'bold' }}>Set</Typography></Box>
                                            <Box sx={{ flex: '1 1 0', textAlign: 'center' }}><Typography variant="caption" sx={{ fontWeight: 'bold' }}>{getWeightLabel(weightUnit)}</Typography></Box>
                                            <Box sx={{ flex: '1 1 0', textAlign: 'center' }}><Typography variant="caption" sx={{ fontWeight: 'bold' }}>Reps</Typography></Box>
                                            <Box sx={{ flex: '0 0 40px' }}></Box>
                                        </Box>
                                        {exercise.sets.map((set, setIndex) => (
                                            <Box
                                                key={setIndex}
                                                display="flex"
                                                alignItems="center"
                                                sx={{ mb: 1.5, gap: 1, pr: 1, pl: 1 }}
                                            >
                                                <Box sx={{ flex: '0 0 40px', textAlign: 'center' }}>
                                                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{setIndex + 1}</Typography>
                                                </Box>
                                                <Box sx={{ flex: '1 1 0' }}>
                                                    <StyledTextField
                                                        type="number"
                                                        defaultValue={set.weight}
                                                        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                        sx={{ '.MuiInputBase-input': { textAlign: 'center', padding: '8px' } }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: '1 1 0' }}>
                                                    <StyledTextField
                                                        type="number"
                                                        defaultValue={set.reps}
                                                        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                        sx={{ '.MuiInputBase-input': { textAlign: 'center', padding: '8px' } }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: '0 0 40px', textAlign: 'right' }}>
                                                    <IconButton onClick={() => toggleSetCompletion(exerciseIndex, setIndex)} sx={{ color: set.completed ? '#00ff9f' : 'grey' }}>
                                                        <MdCheckCircle />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        ))}
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
                                                        const setsArray = Array.from({ length: parseInt(exercise.sets) || 3 }, () => ({
                                                            reps: parseInt(exercise.reps) || 10,
                                                            weight: parseFloat(exercise.weight) || 0,
                                                            completed: false
                                                        }));
                                                        setExercises(prev => [...prev, { ...exercise, sets: setsArray }]);
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
                                                    {exercise.weight > 0 && (
                                                        <Chip
                                                            label={`${exercise.weight}${weightUnit}`}
                                                            size="small"
                                                            sx={{
                                                                ml: 1,
                                                                height: '20px',
                                                                backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                color: '#00ff9f',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    )}
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