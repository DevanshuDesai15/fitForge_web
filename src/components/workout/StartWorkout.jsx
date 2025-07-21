import { useState, useEffect } from 'react';
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
    MdClose
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';

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
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
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
    const [templateExercises, setTemplateExercises] = useState([]);
    const [previousExercises, setPreviousExercises] = useState([]);
    const [showTemplateSelection, setShowTemplateSelection] = useState(true);

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
        setError('');
        setSuccess('');
    };

    const handleStartWithTemplate = () => {
        if (!selectedTemplate) return;

        const template = templates.find(t => t.id === selectedTemplate);
        if (template && template.workoutDays && template.workoutDays.length > 0) {
            // Extract all exercises from the template
            const allTemplateExercises = template.workoutDays.flatMap(day =>
                day.exercises || []
            );
            setTemplateExercises(allTemplateExercises);
        }

        setWorkoutStarted(true);
        setWorkoutTime(0);
        setShowTemplateSelection(false);
        setError('');
        setSuccess('');
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

            // Save the workout as a whole (existing functionality)
            await addDoc(collection(db, 'workouts'), {
                userId: currentUser.uid,
                exercises: exercises,
                duration: workoutTime,
                timestamp: workoutTimestamp
            });

            // NEW: Save each exercise individually for progress tracking
            const exercisePromises = exercises.map(exercise => {
                return addDoc(collection(db, 'exercises'), {
                    userId: currentUser.uid,
                    exerciseName: exercise.name,
                    weight: exercise.weight.toString(),
                    reps: exercise.reps.toString(),
                    sets: exercise.sets.toString(),
                    notes: exercise.notes || '',
                    timestamp: workoutTimestamp,
                    source: 'workout' // Track that this came from a workout session
                });
            });

            // Wait for all individual exercises to be saved
            await Promise.all(exercisePromises);

            console.log(`✅ Workout saved with ${exercises.length} exercises saved individually for progress tracking`);

            setSuccess(`Workout saved successfully! ${exercises.length} exercises added to progress tracking.`);
            setWorkoutStarted(false);
            setExercises([]);
            setWorkoutTime(0);
            setTemplateExercises([]); // Clear template exercises
            setShowTemplateSelection(true); // Reset to show template selection next time

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

        setExercises([...exercises, {
            ...newExercise,
            weight: parseFloat(newExercise.weight),
            reps: parseInt(newExercise.reps),
            sets: parseInt(newExercise.sets)
        }]);

        setNewExercise({
            name: '',
            weight: '',
            reps: '',
            sets: '',
            notes: ''
        });

        setOpenDialog(false);
        setExerciseSelectionMode('manual');
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
                        {workoutStarted ? 'Active Workout' : 'Start Workout'}
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
                                                        {template.description && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                {template.description}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<MdPlayArrow />}
                                        onClick={handleStartWithTemplate}
                                        disabled={!selectedTemplate}
                                        sx={{
                                            background: selectedTemplate ? 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)' : 'rgba(255, 255, 255, 0.1)',
                                            color: selectedTemplate ? '#000' : 'rgba(255, 255, 255, 0.5)',
                                            fontWeight: 'bold',
                                            mb: 2
                                        }}
                                    >
                                        Start with Template
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

                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        {!workoutStarted ? (
                            templates.length === 0 && (
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
                            )
                        ) : (
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
                        )}
                    </CardContent>
                </StyledCard>

                {workoutStarted && (
                    <>
                        <List>
                            {exercises.map((exercise, index) => (
                                <StyledCard key={index} sx={{ mb: 2 }}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                sx={{ color: '#ff4444' }}
                                                onClick={() => handleDeleteExercise(index)}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ color: '#00ff9f' }}>
                                                    {exercise.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography sx={{ color: 'text.secondary' }}>
                                                    {`${exercise.weight}kg × ${exercise.reps} reps × ${exercise.sets} sets`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </StyledCard>
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
                        setExerciseSelectionMode('manual');
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
                        {/* Exercise Selection */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                Select Exercise
                            </Typography>
                            <ExerciseSelector
                                onExerciseSelect={handleExerciseSelectFromSelector}
                                placeholder="Select exercise or add new..."
                                showCustomEntry={true}
                                includeHistory={true}
                                includeTemplates={templateExercises.length > 0}
                                templateExercises={templateExercises}
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
                                        label="Weight (kg)"
                                        name="weight"
                                        type="number"
                                        value={newExercise.weight}
                                        onChange={handleExerciseChange}
                                        required
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