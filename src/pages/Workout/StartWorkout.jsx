import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Card, CardContent } from '@mui/material';
import { MdCheckCircle, MdTimer, MdArrowBack, MdLightbulb, MdSwapHoriz } from 'react-icons/md';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getWeightUnit } from '../../utils/weightUnit';

// Components
import TemplateSelector from './components/TemplateSelector';
import DaySelector from './components/DaySelector';
import ModernWorkoutExercise from './components/ModernWorkoutExercise';
import RestTimer from './components/RestTimer';
import ExerciseOverview from './components/ExerciseOverview';
import WorkoutTabs from './components/WorkoutTabs';
import AICoachTab from './components/AICoachTab';

// Hooks
import { useWorkoutState } from './hooks/useWorkoutState';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useAISuggestions } from './hooks/useAISuggestions';

const StartWorkout = () => {
    // State management
    const [currentStep, setCurrentStep] = useState('template'); // 'template', 'day', 'workout'
    const [weightUnit, setWeightUnit] = useState('kg');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [finishDialog, setFinishDialog] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [restDuration] = useState(180); // 3 minutes default - can be adjusted later
    const [bottomTab, setBottomTab] = useState('overview'); // 'overview', 'ai-coach', 'suggestions', 'variations'

    // Hooks
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
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
        workoutStartTime,
        setWorkoutStartTime,
        clearWorkoutState
    } = useWorkoutState();

    const { templates, loading: templatesLoading } = useWorkoutTemplates();
    const { loadAISuggestions } = useAISuggestions();

    // 🎯 NEW: Ensure targetSets is initialized for workouts loaded from session state
    useEffect(() => {
        if (exercises && exercises.length > 0) {
            const exercisesNeedUpdate = exercises.some(ex => ex.targetSets === undefined);
            if (exercisesNeedUpdate) {
                const updatedExercises = exercises.map(ex => ({
                    ...ex,
                    targetSets: ex.targetSets || ex.sets?.filter(s => s.reps).length || 3,
                }));
                setExercises(updatedExercises);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // 🎯 Background timer - tracks elapsed time during workout
    useEffect(() => {
        let interval;
        let startTime;

        if (workoutStarted) {
            // Initialize start time based on existing elapsed time
            startTime = Date.now() - (elapsedTime * 1000);

            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutStarted]); // Only re-run when workout starts/stops

    // 🎯 NEW: Auto-load workout from URL params or navigation state
    useEffect(() => {
        const loadWorkoutFromParams = async () => {
            // Don't load if already in a workout
            if (workoutStarted || exercises.length > 0) return;

            setLoading(true);
            try {
                // Get template ID from URL query params (?template=xxx)
                const templateIdFromUrl = searchParams.get('template');

                // Get template/day ID from navigation state (from WorkoutsTab)
                const stateTemplateId = location.state?.templateId;
                const stateDayId = location.state?.dayId;

                const templateId = templateIdFromUrl || stateTemplateId;

                if (templateId && currentUser) {
                    console.log('🚀 Auto-loading workout:', { templateId, dayId: stateDayId });

                    // Load template from Firestore
                    const templateRef = doc(db, 'workoutTemplates', templateId);
                    const templateSnap = await getDoc(templateRef);

                    if (templateSnap.exists()) {
                        const templateData = { id: templateSnap.id, ...templateSnap.data() };
                        setCurrentTemplate(templateData);

                        // Auto-select day
                        let dayToSelect = null;

                        if (stateDayId) {
                            // Find specific day from navigation state
                            dayToSelect = templateData.workoutDays?.find(d => d.id === stateDayId);
                        } else if (templateData.workoutDays && templateData.workoutDays.length === 1) {
                            // Auto-select if only one day
                            dayToSelect = templateData.workoutDays[0];
                        } else if (templateData.workoutDays && templateData.workoutDays.length > 0) {
                            // Default to first day
                            dayToSelect = templateData.workoutDays[0];
                        }

                        if (dayToSelect && dayToSelect.exercises) {
                            console.log('✅ Auto-selected day:', dayToSelect.name);
                            // Set exercises directly (inline handleSelectDay logic)
                            setSelectedDay(dayToSelect);
                            const workoutExercises = dayToSelect.exercises.map(exercise => ({
                                ...exercise,
                                targetSets: exercise.sets?.length || 3,
                                sets: Array.isArray(exercise.sets) && exercise.sets.length > 0
                                    ? exercise.sets
                                    : [
                                        { weight: '', reps: '', completed: false },
                                        { weight: '', reps: '', completed: false },
                                        { weight: '', reps: '', completed: false }
                                    ]
                            }));
                            setExercises(workoutExercises);

                            // Auto-start the workout after a brief moment
                            setTimeout(() => {
                                setWorkoutStartTime(new Date().toISOString());
                                setWorkoutStarted(true);
                            }, 100);
                        } else {
                            // No days available, show error
                            setError('This workout template has no exercises configured.');
                        }
                    } else {
                        setError('Workout template not found.');
                    }
                } else if (location.state?.workout) {
                    // Handle direct workout data from navigation state
                    const workoutData = location.state.workout;
                    console.log('🚀 Auto-loading workout from state:', workoutData);

                    if (workoutData.exercises) {
                        const workoutExercises = workoutData.exercises.map(exercise => ({
                            ...exercise,
                            targetSets: exercise.sets?.length || 3,
                            sets: Array.isArray(exercise.sets) && exercise.sets.length > 0
                                ? exercise.sets
                                : [
                                    { weight: '', reps: '', completed: false },
                                    { weight: '', reps: '', completed: false },
                                    { weight: '', reps: '', completed: false }
                                ]
                        }));
                        setExercises(workoutExercises);
                        setSelectedDay({ name: workoutData.name || 'Workout' });
                        setTimeout(() => {
                            setWorkoutStartTime(new Date().toISOString());
                            setWorkoutStarted(true);
                        }, 100);
                    }
                }
            } catch (err) {
                console.error('Error loading workout:', err);
                setError('Failed to load workout. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadWorkoutFromParams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, location.state, currentUser]);

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
                targetSets: exercise.sets?.length || 3,
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

    // Handle set changes (weight, reps, etc.)
    const handleSetChange = (exerciseIndex, setIndex, field, value) => {
        const updatedExercises = [...exercises];
        if (!updatedExercises[exerciseIndex].sets) {
            updatedExercises[exerciseIndex].sets = [];
        }
        updatedExercises[exerciseIndex].sets[setIndex][field] = value;
        setExercises(updatedExercises);
    };

    // 🎯 NEW: Handle completing a set and starting rest timer
    const handleCompleteSet = (exerciseIndex, setIndex) => {
        const updatedExercises = [...exercises];
        const currentSet = updatedExercises[exerciseIndex].sets[setIndex];

        if (!currentSet.reps) {
            return; // Don't complete if no reps entered
        }

        // Mark set as completed
        currentSet.completed = true;

        // If all existing sets are completed, add a new empty one
        const allSetsCompleted = updatedExercises[exerciseIndex].sets.every(set => set.completed);
        if (allSetsCompleted) {
            updatedExercises[exerciseIndex].sets.push({
                weight: currentSet.weight || '',
                reps: '',
                completed: false
            });
        }

        setExercises(updatedExercises);

        // Start rest timer
        setShowRestTimer(true);
    };

    // 🎯 NEW: Handle rest timer completion
    const handleRestComplete = useCallback(() => {
        setShowRestTimer(false);
    }, []);

    // 🎯 NEW: Handle skip rest
    const handleSkipRest = useCallback(() => {
        setShowRestTimer(false);
    }, []);

    // 🎯 NEW: Handle removing a completed set
    const handleRemoveCompletedSet = (exerciseIndex, setIndex) => {
        const updatedExercises = [...exercises];
        updatedExercises[exerciseIndex].sets[setIndex].completed = false;
        setExercises(updatedExercises);
    };

    // 🎯 NEW: Navigate to previous exercise
    const handlePreviousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
        }
    };

    // 🎯 NEW: Navigate to next exercise
    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    // 🎯 NEW: Jump to specific exercise from overview
    const handleExerciseClick = (index) => {
        setCurrentExerciseIndex(index);
        // Scroll to the top to show the exercise detail
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 🎯 NEW: Remove exercise from workout
    const handleRemoveExercise = (index) => {
        if (window.confirm('Remove this exercise from workout?')) {
            const updatedExercises = exercises.filter((_, i) => i !== index);
            setExercises(updatedExercises);
            if (currentExerciseIndex >= updatedExercises.length) {
                setCurrentExerciseIndex(Math.max(0, updatedExercises.length - 1));
            }
        }
    };

    const handleFinishWorkout = async () => {
        if (!currentUser) {
            setError('You must be logged in to save your workout.');
            return;
        }

        setSaving(true);
        setError(''); // Clear any previous errors

        try {
            console.log('💾 Starting workout save...', {
                exercises: exercises.length,
                completedSets,
                elapsedTime
            });

            // Check if we have exercises with completed sets
            const hasCompletedSets = exercises.some(ex =>
                ex.sets?.some(set => set.completed && set.reps)
            );

            console.log('💪 Has completed sets:', hasCompletedSets);

            // Save workout to database
            const workoutData = {
                userId: currentUser.uid,
                templateId: currentTemplate?.id || null,
                templateName: currentTemplate?.name || 'Custom Workout',
                dayName: selectedDay?.name || 'Workout Session',
                exercises: exercises.map(exercise => ({
                    name: exercise.name,
                    sets: (exercise.sets || []).filter(set => set.completed && set.reps).map(set => ({
                        weight: set.weight || '0',
                        reps: set.reps,
                        completed: true
                    })),
                    notes: exercise.notes || ''
                })).filter(ex => ex.sets.length > 0), // Only include exercises with completed sets
                duration: elapsedTime,
                completed: true,
                completedAt: new Date().toISOString(),
                timestamp: Date.now()
            };

            console.log('💾 Saving workout data:', workoutData);
            const workoutDocRef = await addDoc(collection(db, 'workouts'), workoutData);
            console.log('✅ Workout saved with ID:', workoutDocRef.id);

            // Save individual exercise records
            for (const exercise of exercises) {
                const completedSets = (exercise.sets || []).filter(set => set.completed && set.reps);

                if (completedSets.length > 0) {
                    const exerciseRecord = {
                        userId: currentUser.uid,
                        exerciseName: exercise.name,
                        sets: completedSets.map(set => ({
                            weight: set.weight || '0',
                            reps: set.reps,
                            completed: true
                        })),
                        weight: Math.max(...completedSets.map(set => parseFloat(set.weight) || 0)),
                        reps: Math.max(...completedSets.map(set => parseInt(set.reps) || 0)),
                        timestamp: new Date().toISOString(),
                        workoutId: workoutDocRef.id
                    };

                    await addDoc(collection(db, 'exercises'), exerciseRecord);
                    console.log('✅ Saved exercise record:', exercise.name);
                }
            }

            console.log('🎉 Workout save complete! Navigating to progress...');

            // Clear workout state
            clearWorkoutState();
            setFinishDialog(false);
            setSaving(false);

            // Navigate to progress page
            navigate('/progress', {
                state: {
                    workoutCompleted: true,
                    workoutId: workoutDocRef.id
                }
            });
        } catch (err) {
            console.error('❌ Error saving workout:', err);
            setError(`Failed to save workout: ${err.message || 'Unknown error'}. Please try again.`);
            setSaving(false);
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
                    {loading && 'Loading your workout...'}
                    {!loading && currentStep === 'template' && 'Choose a workout template to get started'}
                    {!loading && currentStep === 'day' && 'Select which day you want to train'}
                    {!loading && currentStep === 'workout' && 'Complete your workout sets'}
                </Typography>

                {/* Loading State */}
                {loading && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                            🚀 Loading your workout...
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            Getting everything ready for you
                        </Typography>
                    </Box>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Content based on current step */}
                {!loading && currentStep === 'template' && (
                    <TemplateSelector
                        templates={templates}
                        onSelectTemplate={handleSelectTemplate}
                        loading={templatesLoading}
                    />
                )}

                {!loading && currentStep === 'day' && (
                    <DaySelector
                        template={currentTemplate}
                        onSelectDay={handleSelectDay}
                        onBack={() => {
                            setCurrentTemplate(null);
                            setCurrentStep('template');
                        }}
                    />
                )}

                {currentStep === 'workout' && exercises.length > 0 && (
                    <Box sx={{ pb: 2 }}>
                        {/* Back Button */}
                        <Button
                            startIcon={<MdArrowBack />}
                            onClick={() => navigate('/workout')}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                mb: 2,
                                '&:hover': {
                                    color: '#fff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            Back to Workouts
                        </Button>

                        {/* Workout Header Card */}
                        <Card sx={{
                            background: 'rgba(40, 40, 40, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            mb: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                            {selectedDay?.name || currentTemplate?.name || 'Workout'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <MdTimer size={16} />
                                                Started at {workoutStartTime
                                                    ? new Date(workoutStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                }
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {completedSets}/{totalSets} sets
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        startIcon={<MdCheckCircle size={20} />}
                                        onClick={() => {
                                            console.log('🏁 Finish button clicked!', {
                                                completedSets,
                                                totalSets,
                                                exercises: exercises.length
                                            });
                                            setFinishDialog(true);
                                        }}
                                        sx={{
                                            color: '#f44336',
                                            borderColor: '#f44336',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            px: 2.5,
                                            py: 1,
                                            borderRadius: '8px',
                                            borderWidth: '1.5px',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                                borderColor: '#f44336',
                                                borderWidth: '1.5px'
                                            }
                                        }}
                                    >
                                        Finish
                                    </Button>
                                </Box>

                                {/* Workout Progress Bar */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Workout Progress
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                                            {workoutProgress.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            width: `${workoutProgress}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #dded00 0%, #e8f15d 100%)',
                                            transition: 'width 0.3s ease',
                                            borderRadius: '4px'
                                        }} />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Rest Timer */}
                        {showRestTimer && (
                            <RestTimer
                                duration={restDuration}
                                onComplete={handleRestComplete}
                                onSkip={handleSkipRest}
                            />
                        )}

                        {/* Current Exercise */}
                        {exercises[currentExerciseIndex] && (
                            <ModernWorkoutExercise
                                exercise={exercises[currentExerciseIndex]}
                                exerciseIndex={currentExerciseIndex}
                                currentSetIndex={exercises[currentExerciseIndex].sets?.findIndex(set => !set.completed) || 0}
                                onSetChange={handleSetChange}
                                onCompleteSet={handleCompleteSet}
                                onRemoveSet={handleRemoveCompletedSet}
                                weightUnit={weightUnit}
                                aiTip="Solid set! Maintain or slightly increase weight."
                                totalExercises={exercises.length}
                                onPreviousExercise={handlePreviousExercise}
                                onNextExercise={handleNextExercise}
                            />
                        )}

                        {/* Workout Tabs */}
                        <WorkoutTabs activeTab={bottomTab} onChange={setBottomTab} />


                        {/* Bottom Tab Content */}
                        {bottomTab === 'overview' && (
                            <Box sx={{ mt: 3 }}>
                                <ExerciseOverview
                                    exercises={exercises}
                                    currentExerciseIndex={currentExerciseIndex}
                                    onExerciseClick={handleExerciseClick}
                                    onRemoveExercise={handleRemoveExercise}
                                />
                            </Box>
                        )}

                        {bottomTab === 'ai-coach' && (
                            <AICoachTab exercise={exercises[currentExerciseIndex]} />
                        )}

                        {bottomTab === 'suggestions' && (
                            <Box sx={{ mt: 3 }}>
                                <Card sx={{
                                    background: 'rgba(40, 40, 40, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    p: 4,
                                    textAlign: 'center'
                                }}>
                                    <MdLightbulb size={32} style={{ color: '#dded00', marginBottom: '16px' }} />
                                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                                        Smart Suggestions
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Get personalized workout suggestions based on your progress.
                                    </Typography>
                                </Card>
                            </Box>
                        )}

                        {bottomTab === 'variations' && (
                            <Box sx={{ mt: 3 }}>
                                <Card sx={{
                                    background: 'rgba(40, 40, 40, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    p: 4,
                                    textAlign: 'center'
                                }}>
                                    <MdSwapHoriz size={32} style={{ color: '#dded00', marginBottom: '16px' }} />
                                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                                        Exercise Variations
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Discover alternative exercises for your workout.
                                    </Typography>
                                </Card>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Finish Workout Dialog */}
                <Dialog
                    open={finishDialog}
                    onClose={() => !saving && setFinishDialog(false)}
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
                        {saving ? 'Saving Workout...' : 'Finish Workout'}
                    </DialogTitle>
                    <DialogContent>
                        {saving ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography sx={{ color: '#fff', mb: 2 }}>
                                    💾 Saving your workout data...
                                </Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                                    Please wait while we save your progress
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography sx={{ color: '#fff', mb: 2 }}>
                                    {completedSets > 0
                                        ? `Great job! You completed ${completedSets} out of ${totalSets} sets.`
                                        : 'Are you sure you want to finish without completing any sets?'
                                    }
                                </Typography>
                                <Typography sx={{ color: 'text.secondary' }}>
                                    {completedSets > 0
                                        ? "Your workout will be saved and you'll be taken to the progress page to see your results."
                                        : "You can save this workout session and come back later, or continue working out."
                                    }
                                </Typography>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setFinishDialog(false)}
                            disabled={saving}
                            sx={{
                                color: 'text.secondary',
                                '&.Mui-disabled': {
                                    color: 'rgba(255, 255, 255, 0.3)'
                                }
                            }}
                        >
                            Continue Workout
                        </Button>
                        <Button
                            onClick={handleFinishWorkout}
                            disabled={saving}
                            variant="contained"
                            sx={{
                                background: saving
                                    ? 'rgba(221, 237, 0, 0.5)'
                                    : 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                '&.Mui-disabled': {
                                    background: 'rgba(221, 237, 0, 0.3)',
                                    color: 'rgba(0, 0, 0, 0.5)'
                                }
                            }}
                        >
                            {saving ? 'Saving...' : 'Save & Finish'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
};

export default StartWorkout;
