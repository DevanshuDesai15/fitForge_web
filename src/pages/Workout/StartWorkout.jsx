import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { MdPlayArrow, MdStop, MdCheckCircle } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getWeightUnit } from '../../utils/weightUnit';

// Components
import WorkoutTimer from './components/WorkoutTimer';
import TemplateSelector from './components/TemplateSelector';
import DaySelector from './components/DaySelector';
import WorkoutExercise from './components/WorkoutExercise';

// Hooks
import { useWorkoutState } from './hooks/useWorkoutState';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useAISuggestions } from './hooks/useAISuggestions';

const StartWorkout = () => {
    // State management
    const [currentStep, setCurrentStep] = useState('template'); // 'template', 'day', 'workout'
    const [weightUnit, setWeightUnit] = useState('kg');
    const [expandedExercise, setExpandedExercise] = useState(0);
    const [finishDialog, setFinishDialog] = useState(false);
    const [error, setError] = useState('');

    // Hooks
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const {
        workoutStarted,
        setWorkoutStarted,
        exercises,
        setExercises,
        currentTemplate,
        setCurrentTemplate,
        selectedDay,
        setSelectedDay,
        elapsedTime,
        setElapsedTime,
        clearWorkoutState
    } = useWorkoutState();

    const { templates, loading: templatesLoading } = useWorkoutTemplates();
    const { aiSuggestions, loadAISuggestions } = useAISuggestions();

    // Load weight unit preference
    useEffect(() => {
        setWeightUnit(getWeightUnit());

        const handleStorageChange = (e) => {
            if (e.key === 'weightUnit') {
                setWeightUnit(e.newValue || 'kg');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Load AI suggestions when exercises are set
    useEffect(() => {
        if (exercises.length > 0) {
            const exerciseNames = exercises.map(ex => ex.name);
            loadAISuggestions(exerciseNames);
        }
    }, [exercises, loadAISuggestions]);

    // Determine current step based on state
    useEffect(() => {
        if (workoutStarted && exercises.length > 0) {
            setCurrentStep('workout');
        } else if (currentTemplate && selectedDay) {
            setCurrentStep('workout');
        } else if (currentTemplate) {
            setCurrentStep('day');
        } else {
            setCurrentStep('template');
        }
    }, [workoutStarted, exercises, currentTemplate, selectedDay]);

    // Event handlers
    const handleSelectTemplate = (template) => {
        setCurrentTemplate(template);
        if (template.workoutDays && template.workoutDays.length === 1) {
            // Auto-select if only one day
            handleSelectDay(template.workoutDays[0]);
        }
    };

    const handleSelectDay = (day) => {
        setSelectedDay(day);
        if (day.exercises) {
            const workoutExercises = day.exercises.map(exercise => ({
                ...exercise,
                sets: Array.isArray(exercise.sets) && exercise.sets.length > 0
                    ? exercise.sets
                    : [
                        { weight: '', reps: '', completed: false },
                        { weight: '', reps: '', completed: false },
                        { weight: '', reps: '', completed: false }
                    ]
            }));
            setExercises(workoutExercises);
        }
    };

    const handleStartWorkout = () => {
        setWorkoutStarted(true);
    };

    const handleSetChange = (exerciseIndex, setIndex, field, value) => {
        const updatedExercises = [...exercises];
        if (!updatedExercises[exerciseIndex].sets) {
            updatedExercises[exerciseIndex].sets = [];
        }
        updatedExercises[exerciseIndex].sets[setIndex][field] = value;
        setExercises(updatedExercises);
    };

    const handleToggleCompletion = (exerciseIndex, setIndex) => {
        const updatedExercises = [...exercises];
        if (!updatedExercises[exerciseIndex].sets) {
            updatedExercises[exerciseIndex].sets = [];
        }
        const currentSet = updatedExercises[exerciseIndex].sets[setIndex];
        if (currentSet) {
            currentSet.completed = !currentSet.completed;
            setExercises(updatedExercises);
        }
    };

    const handleAddSet = (exerciseIndex) => {
        const updatedExercises = [...exercises];
        if (!updatedExercises[exerciseIndex].sets) {
            updatedExercises[exerciseIndex].sets = [];
        }
        updatedExercises[exerciseIndex].sets.push({
            weight: '',
            reps: '',
            completed: false
        });
        setExercises(updatedExercises);
    };

    const handleRemoveSet = (exerciseIndex) => {
        const updatedExercises = [...exercises];
        if (!updatedExercises[exerciseIndex].sets) {
            updatedExercises[exerciseIndex].sets = [];
        }
        if (updatedExercises[exerciseIndex].sets.length > 1) {
            updatedExercises[exerciseIndex].sets.pop();
            setExercises(updatedExercises);
        }
    };

    const handleFinishWorkout = async () => {
        try {
            // Save workout to database
            const workoutData = {
                userId: currentUser.uid,
                templateId: currentTemplate?.id,
                templateName: currentTemplate?.name,
                dayName: selectedDay?.name,
                exercises: exercises.map(exercise => ({
                    name: exercise.name,
                    sets: (exercise.sets || []).filter(set => set.completed && set.weight && set.reps),
                    notes: exercise.notes || ''
                })),
                duration: elapsedTime,
                completed: true,
                completedAt: new Date().toISOString(),
                timestamp: Date.now()
            };

            await addDoc(collection(db, 'workouts'), workoutData);

            // Save individual exercise records
            for (const exercise of exercises) {
                const completedSets = (exercise.sets || []).filter(set => set.completed && set.weight && set.reps);

                if (completedSets.length > 0) {
                    const exerciseRecord = {
                        userId: currentUser.uid,
                        exerciseName: exercise.name,
                        sets: completedSets,
                        weight: Math.max(...completedSets.map(set => parseFloat(set.weight) || 0)),
                        reps: Math.max(...completedSets.map(set => parseInt(set.reps) || 0)),
                        timestamp: new Date().toISOString(),
                        workoutId: workoutData.id
                    };

                    await addDoc(collection(db, 'exercises'), exerciseRecord);
                }
            }

            // Clear workout state and navigate
            clearWorkoutState();
            setFinishDialog(false);
            navigate('/progress');
        } catch (err) {
            console.error('Error saving workout:', err);
            setError('Failed to save workout. Please try again.');
        }
    };

    const handleCancelWorkout = () => {
        if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
            clearWorkoutState();
            navigate('/workout');
        }
    };

    // Calculate workout progress
    const totalSets = exercises.reduce((total, exercise) => total + (exercise.sets?.length || 0), 0);
    const completedSets = exercises.reduce((total, exercise) =>
        total + (exercise.sets?.filter(set => set.completed).length || 0), 0
    );
    const workoutProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    return (
        <Box sx={{ minHeight: '100vh', background: '#121212', p: 2 }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Typography variant="h4" sx={{ color: '#dded00', fontWeight: 'bold', mb: 1 }}>
                    Start Workout
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                    {currentStep === 'template' && 'Choose a workout template to get started'}
                    {currentStep === 'day' && 'Select which day you want to train'}
                    {currentStep === 'workout' && 'Complete your workout sets'}
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Workout Timer */}
                {workoutStarted && (
                    <WorkoutTimer
                        workoutStarted={workoutStarted}
                        onTimerUpdate={setElapsedTime}
                    />
                )}

                {/* Content based on current step */}
                {currentStep === 'template' && (
                    <TemplateSelector
                        templates={templates}
                        onSelectTemplate={handleSelectTemplate}
                        loading={templatesLoading}
                    />
                )}

                {currentStep === 'day' && (
                    <DaySelector
                        template={currentTemplate}
                        onSelectDay={handleSelectDay}
                        onBack={() => {
                            setCurrentTemplate(null);
                            setCurrentStep('template');
                        }}
                    />
                )}

                {currentStep === 'workout' && (
                    <Box>
                        {/* Workout Header */}
                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6" sx={{ color: '#dded00' }}>
                                    {selectedDay?.name || 'Custom Workout'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Progress: {workoutProgress.toFixed(0)}% ({completedSets}/{totalSets} sets)
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {!workoutStarted ? (
                                    <Button
                                        variant="contained"
                                        startIcon={<MdPlayArrow />}
                                        onClick={handleStartWorkout}
                                        sx={{
                                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                            color: '#fff',
                                        }}
                                    >
                                        Start Workout
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancelWorkout}
                                            sx={{ color: '#f44336', borderColor: '#f44336' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={<MdCheckCircle />}
                                            onClick={() => setFinishDialog(true)}
                                            disabled={completedSets === 0}
                                            sx={{
                                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                color: '#000',
                                            }}
                                        >
                                            Finish Workout
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Exercises */}
                        <Box>
                            {exercises.map((exercise, index) => (
                                <WorkoutExercise
                                    key={index}
                                    exercise={exercise}
                                    exerciseIndex={index}
                                    onSetChange={handleSetChange}
                                    onToggleCompletion={handleToggleCompletion}
                                    onAddSet={handleAddSet}
                                    onRemoveSet={handleRemoveSet}
                                    weightUnit={weightUnit}
                                    aiSuggestions={aiSuggestions}
                                    expanded={expandedExercise === index}
                                    onExpandChange={() => setExpandedExercise(expandedExercise === index ? -1 : index)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Finish Workout Dialog */}
                <Dialog
                    open={finishDialog}
                    onClose={() => setFinishDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: '#282828',
                            border: '1px solid rgba(221, 237, 0, 0.2)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#dded00' }}>
                        Finish Workout
                    </DialogTitle>
                    <DialogContent>
                        <Typography sx={{ color: '#fff', mb: 2 }}>
                            Great job! You completed {completedSets} out of {totalSets} sets.
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            Your workout will be saved and you'll be taken to the progress page to see your results.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFinishDialog(false)} sx={{ color: 'text.secondary' }}>
                            Continue Workout
                        </Button>
                        <Button
                            onClick={handleFinishWorkout}
                            variant="contained"
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                            }}
                        >
                            Save & Finish
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
};

export default StartWorkout;
