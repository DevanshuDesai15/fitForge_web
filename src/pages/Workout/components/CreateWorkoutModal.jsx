import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Chip,
    IconButton,
    Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdClose, MdAdd, MdTimer, MdFitnessCenter, MdRemove } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { fetchAllExercises } from '../../../services/localExerciseService';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        background: '#1a1a1a',
        border: '1px solid rgba(221, 237, 0, 0.2)',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '95vw',
        maxHeight: '95vh',
        margin: '8px',
        [theme.breakpoints.down('sm')]: {
            width: '100vw',
            height: '100vh',
            maxHeight: '100vh',
            maxWidth: '100vw',
            margin: 0,
            borderRadius: 0,
        },
    },
}));

const StyledStepper = styled(Stepper)(() => ({
    '& .MuiStepLabel-root .Mui-completed': {
        color: '#dded00',
    },
    '& .MuiStepLabel-root .Mui-active': {
        color: '#dded00',
    },
    '& .MuiStepConnector-line': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
        borderColor: '#dded00',
    },
}));

const QuickTemplateCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        transform: 'translateY(-2px)',
    },
}));

const ExerciseCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

const CreateWorkoutModal = ({ open, onClose, onWorkoutCreated }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [workoutData, setWorkoutData] = useState({
        name: '',
        category: '',
        description: '',
        difficulty: '',
        duration: '',
        exercises: []
    });
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
    const [exercises, setExercises] = useState([]);
    const [exercisesLoading, setExercisesLoading] = useState(true);

    const { currentUser } = useAuth();

    const steps = ['Details', 'Exercises'];

    const categories = [
        'Strength Training',
        'Cardio',
        'HIIT',
        'Flexibility',
        'Powerlifting',
        'Bodybuilding',
        'Functional',
        'Sports Specific'
    ];

    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

    const quickTemplates = [
        {
            id: 'push',
            name: 'Push Day',
            description: 'Focus on chest, shoulders, and triceps',
            duration: '45 min',
            exercises: 3,
            muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
            exerciseList: [
                { name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: '8-10' },
                { name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 3, reps: '10-12' },
                { name: 'Tricep Dips', muscleGroup: 'Triceps', sets: 3, reps: '12-15' }
            ]
        },
        {
            id: 'pull',
            name: 'Pull Day',
            description: 'Target back and biceps',
            duration: '45 min',
            exercises: 3,
            muscleGroups: ['Back', 'Biceps'],
            exerciseList: [
                { name: 'Pull-ups', muscleGroup: 'Back', sets: 4, reps: '6-10' },
                { name: 'Deadlift', muscleGroup: 'Back', sets: 3, reps: '8-10' },
                { name: 'Bicep Curls', muscleGroup: 'Biceps', sets: 3, reps: '12-15' }
            ]
        },
        {
            id: 'legs',
            name: 'Leg Day',
            description: 'Complete lower body workout',
            duration: '50 min',
            exercises: 3,
            muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes'],
            exerciseList: [
                { name: 'Squats', muscleGroup: 'Quadriceps', sets: 4, reps: '8-12' },
                { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', sets: 3, reps: '10-12' },
                { name: 'Hip Thrust', muscleGroup: 'Glutes', sets: 3, reps: '12-15' }
            ]
        }
    ];

    const muscleGroups = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

    // Load exercises from JSON data
    useEffect(() => {
        const loadExercises = async () => {
            try {
                setExercisesLoading(true);
                const exerciseData = await fetchAllExercises();

                // Transform exercise data to match our needs
                const transformedExercises = exerciseData.map(exercise => ({
                    id: exercise.id,
                    name: exercise.name || exercise.title,
                    muscleGroup: exercise.bodyPart || exercise.target || 'General',
                    equipment: exercise.equipment || 'Unknown',
                    description: exercise.description || '',
                    target: exercise.target || exercise.bodyPart
                }));

                setExercises(transformedExercises);
            } catch (error) {
                console.error('Error loading exercises:', error);
                // Fallback to empty array if loading fails
                setExercises([]);
            } finally {
                setExercisesLoading(false);
            }
        };

        loadExercises();
    }, []);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleInputChange = (field, value) => {
        setWorkoutData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuickTemplateSelect = (template) => {
        setWorkoutData(prev => ({
            ...prev,
            name: template.name,
            category: 'Strength Training',
            description: template.description,
            difficulty: 'Intermediate',
            duration: template.duration,
            exercises: template.exerciseList
        }));
        const transformedExercises = template.exerciseList.map(ex => ({
            id: ex.id || ex.name,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            equipment: ex.equipment || 'Unknown',
            description: ex.description || '',
            target: ex.target || ex.muscleGroup,
            sets: [{
                setNumber: 1,
                reps: parseInt(ex.reps?.split('-')[0]) || 12,
                weight: 0,
                restTime: 60
            }]
        }));
        setSelectedExercises(transformedExercises);
        handleNext();
    };

    const handleExerciseToggle = (exercise) => {
        setSelectedExercises(prev => {
            const isSelected = prev.some(ex => ex.id === exercise.id);
            if (isSelected) {
                return prev.filter(ex => ex.id !== exercise.id);
            } else {
                return [...prev, {
                    id: exercise.id,
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup,
                    equipment: exercise.equipment,
                    description: exercise.description,
                    target: exercise.target,
                    sets: [{
                        setNumber: 1,
                        reps: 12,
                        weight: 0,
                        restTime: 60
                    }]
                }];
            }
        });
    };

    const handleSetValueChange = (exerciseId, setIndex, field, value) => {
        setSelectedExercises(prev =>
            prev.map(exercise => {
                if (exercise.id === exerciseId) {
                    const updatedSets = [...exercise.sets];
                    updatedSets[setIndex] = {
                        ...updatedSets[setIndex],
                        [field]: field === 'reps' || field === 'weight' || field === 'restTime' ?
                            (value === '' ? 0 : Number(value)) : value
                    };
                    return { ...exercise, sets: updatedSets };
                }
                return exercise;
            })
        );
    };

    const handleAddSet = (exerciseId) => {
        setSelectedExercises(prev =>
            prev.map(exercise => {
                if (exercise.id === exerciseId) {
                    const currentSets = Array.isArray(exercise.sets) ? exercise.sets : [];
                    const newSetNumber = currentSets.length + 1;
                    const lastSet = currentSets[currentSets.length - 1];

                    const newSet = {
                        setNumber: newSetNumber,
                        reps: lastSet?.reps || 12,
                        weight: lastSet?.weight || 0,
                        restTime: lastSet?.restTime || 60
                    };

                    return {
                        ...exercise,
                        sets: [...currentSets, newSet]
                    };
                }
                return exercise;
            })
        );
    };

    const handleRemoveSet = (exerciseId, setIndex) => {
        setSelectedExercises(prev =>
            prev.map(exercise => {
                if (exercise.id === exerciseId && exercise.sets.length > 1) {
                    const updatedSets = exercise.sets.filter((_, index) => index !== setIndex);
                    // Renumber the sets
                    const renumberedSets = updatedSets.map((set, index) => ({
                        ...set,
                        setNumber: index + 1
                    }));
                    return { ...exercise, sets: renumberedSets };
                }
                return exercise;
            })
        );
    };

    const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscleGroup = selectedMuscleGroup === 'All' ||
            exercise.muscleGroup.toLowerCase().includes(selectedMuscleGroup.toLowerCase()) ||
            exercise.target?.toLowerCase().includes(selectedMuscleGroup.toLowerCase());
        return matchesSearch && matchesMuscleGroup;
    });

    const handleCreateWorkout = async () => {
        try {
            setLoading(true);

            const templateData = {
                name: workoutData.name,
                description: workoutData.description,
                category: workoutData.category,
                difficulty: workoutData.difficulty,
                duration: workoutData.duration,
                workoutDays: [{
                    id: 1,
                    name: 'Day 1',
                    exercises: selectedExercises.map(ex => ({
                        name: ex.name,
                        muscleGroup: ex.muscleGroup,
                        equipment: ex.equipment,
                        sets: Array.isArray(ex.sets) ? ex.sets : [{
                            setNumber: 1,
                            reps: 12,
                            weight: 0,
                            restTime: 60
                        }],
                        notes: ''
                    })),
                    muscleGroups: [...new Set(selectedExercises.map(ex => ({
                        id: ex.muscleGroup.toLowerCase(),
                        name: ex.muscleGroup
                    })))]
                }],
                userId: currentUser.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'workoutTemplates'), templateData);

            if (onWorkoutCreated) {
                onWorkoutCreated();
            }

            handleClose();
        } catch (error) {
            console.error('Error creating workout template:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setActiveStep(0);
        setWorkoutData({
            name: '',
            category: '',
            description: '',
            difficulty: '',
            duration: '',
            exercises: []
        });
        setSelectedExercises([]);
        setSearchTerm('');
        setSelectedMuscleGroup('All');
        onClose();
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        {/* Workout Details Form */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Workout Name"
                                    value={workoutData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#dded00',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#dded00',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#dded00',
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                                    <Select
                                        value={workoutData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        sx={{
                                            color: '#fff',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#dded00',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#dded00',
                                            },
                                        }}
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={workoutData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe your workout goals and focus..."
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#dded00',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#dded00',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#dded00',
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Difficulty</InputLabel>
                                    <Select
                                        value={workoutData.difficulty}
                                        onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                        sx={{
                                            color: '#fff',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#dded00',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#dded00',
                                            },
                                        }}
                                    >
                                        {difficulties.map((difficulty) => (
                                            <MenuItem key={difficulty} value={difficulty}>
                                                {difficulty}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Duration"
                                    value={workoutData.duration}
                                    onChange={(e) => handleInputChange('duration', e.target.value)}
                                    placeholder="45 min"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#dded00',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#dded00',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#dded00',
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        {/* Quick Templates Section */}
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    Quick Templates
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Click to use as starting point
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                {quickTemplates.map((template) => (
                                    <Grid item xs={12} md={4} key={template.id}>
                                        <QuickTemplateCard onClick={() => handleQuickTemplateSelect(template)}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                                                    {template.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                    {template.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdTimer size={16} style={{ color: '#dded00' }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {template.duration}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdFitnessCenter size={16} style={{ color: '#dded00' }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {template.exercises} exercises
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {template.muscleGroups.map((group) => (
                                                        <Chip
                                                            key={group}
                                                            label={group}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                                color: '#dded00',
                                                                fontSize: '0.7rem',
                                                                height: '20px'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </CardContent>
                                        </QuickTemplateCard>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Preview Section */}
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                Preview
                            </Typography>
                            <Card sx={{ background: 'rgba(40, 40, 40, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#fff' }}>
                                        {workoutData.name || 'Workout Name'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {workoutData.description || 'Workout description will appear here...'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{
                        display: 'flex',
                        gap: 3,
                        height: { xs: 'auto', md: '600px' },
                        flexDirection: { xs: 'column', md: 'row' },
                        minHeight: { xs: '70vh', md: 'auto' }
                    }}>
                        {/* Left Side - Exercise Library */}
                        <Box sx={{
                            flex: 1,
                            minHeight: { xs: '300px', md: 'auto' }
                        }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                Exercise Library
                            </Typography>

                            {/* Search */}
                            <TextField
                                fullWidth
                                placeholder="Search exercises..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        backgroundColor: 'rgba(40, 40, 40, 0.6)',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#dded00',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#dded00',
                                        },
                                    },
                                }}
                            />

                            {/* Muscle Group Filter */}
                            <Box sx={{
                                display: 'flex',
                                gap: { xs: 0.5, md: 1 },
                                flexWrap: 'wrap',
                                mb: 3,
                                maxHeight: { xs: '120px', md: 'auto' },
                                overflowY: { xs: 'auto', md: 'visible' }
                            }}>
                                {muscleGroups.map((group) => (
                                    <Chip
                                        key={group}
                                        label={group}
                                        onClick={() => setSelectedMuscleGroup(group)}
                                        variant={selectedMuscleGroup === group ? 'filled' : 'outlined'}
                                        size="small"
                                        sx={{
                                            backgroundColor: selectedMuscleGroup === group ? '#dded00' : 'transparent',
                                            color: selectedMuscleGroup === group ? '#000' : '#fff',
                                            borderColor: selectedMuscleGroup === group ? '#dded00' : 'rgba(255, 255, 255, 0.3)',
                                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                                            height: { xs: '24px', md: '32px' },
                                            '&:hover': {
                                                backgroundColor: selectedMuscleGroup === group ? '#e8f15d' : 'rgba(221, 237, 0, 0.1)',
                                            },
                                        }}
                                    />
                                ))}
                            </Box>

                            {/* Exercise List */}
                            <Box sx={{
                                height: { xs: '250px', md: '400px' },
                                overflowY: 'auto',
                                pr: 1
                            }}>
                                {exercisesLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                        <Typography sx={{ color: 'text.secondary' }}>Loading exercises...</Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={2}>
                                        {filteredExercises.map((exercise) => {
                                            const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
                                            return (
                                                <Grid item xs={12} key={exercise.id}>
                                                    <ExerciseCard
                                                        onClick={() => handleExerciseToggle(exercise)}
                                                        sx={{
                                                            border: isSelected ? '1px solid #dded00' : '1px solid rgba(255, 255, 255, 0.1)',
                                                            backgroundColor: isSelected ? 'rgba(221, 237, 0, 0.1)' : 'rgba(40, 40, 40, 0.6)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box>
                                                                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                                        {exercise.name}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                        {exercise.muscleGroup} • {exercise.equipment}
                                                                    </Typography>
                                                                </Box>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{
                                                                        color: isSelected ? '#dded00' : 'rgba(255, 255, 255, 0.5)',
                                                                        backgroundColor: isSelected ? 'rgba(221, 237, 0, 0.2)' : 'transparent',
                                                                    }}
                                                                >
                                                                    <MdAdd />
                                                                </IconButton>
                                                            </Box>
                                                        </CardContent>
                                                    </ExerciseCard>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}
                            </Box>
                        </Box>

                        {/* Right Side - Selected Exercises */}
                        <Box sx={{
                            flex: 1,
                            minHeight: { xs: '300px', md: 'auto' }
                        }}>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                Selected Exercises ({selectedExercises.length})
                            </Typography>

                            {selectedExercises.length === 0 ? (
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 8,
                                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    height: '400px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MdFitnessCenter size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '16px' }} />
                                    <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                                        No exercises selected
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Add exercises from the library
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    height: { xs: '250px', md: '400px' },
                                    overflowY: 'auto',
                                    pr: 1
                                }}>
                                    {selectedExercises.map((exercise, exerciseIndex) => (
                                        <Box key={exercise.id || exerciseIndex} sx={{
                                            background: 'rgba(40, 40, 40, 0.8)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            mb: 2,
                                            p: 2
                                        }}>
                                            {/* Exercise Header */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MdFitnessCenter style={{ color: '#dded00', fontSize: '16px' }} />
                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                                                        {exercise.name}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleExerciseToggle(exercise)}
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        '&:hover': {
                                                            color: '#f44336',
                                                            backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    <MdClose size={16} />
                                                </IconButton>
                                            </Box>

                                            {/* Exercise Details */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <Chip
                                                    label={exercise.muscleGroup}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                        color: '#dded00',
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {exercise.equipment}
                                                </Typography>
                                            </Box>

                                            {/* Sets */}
                                            {(exercise.sets && Array.isArray(exercise.sets) ? exercise.sets : []).map((set, setIndex) => (
                                                <Box key={setIndex} sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                    borderRadius: '6px',
                                                    p: 1.5,
                                                    mb: 1
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '15px' }}>
                                                            {set.setNumber}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                #
                                                            </Typography>
                                                            <TextField
                                                                value={set.reps}
                                                                onChange={(e) => handleSetValueChange(exercise.id, setIndex, 'reps', e.target.value)}
                                                                type="number"
                                                                inputProps={{ min: 1, max: 100 }}
                                                                sx={{
                                                                    width: '50px',
                                                                    '& .MuiOutlinedInput-root': {
                                                                        height: '32px',
                                                                        color: '#fff',
                                                                        fontSize: '1rem',
                                                                        fontWeight: 'bold',
                                                                        '& fieldset': {
                                                                            borderColor: 'transparent',
                                                                        },
                                                                        '&:hover fieldset': {
                                                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                                                        },
                                                                        '&.Mui-focused fieldset': {
                                                                            borderColor: '#dded00',
                                                                        },
                                                                        '& input': {
                                                                            textAlign: 'center',
                                                                            padding: '6px',
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                ⚖
                                                            </Typography>
                                                            <TextField
                                                                value={set.weight}
                                                                onChange={(e) => handleSetValueChange(exercise.id, setIndex, 'weight', e.target.value)}
                                                                type="number"
                                                                inputProps={{ min: 0, step: 0.5 }}
                                                                sx={{
                                                                    width: '60px',
                                                                    '& .MuiOutlinedInput-root': {
                                                                        height: '32px',
                                                                        color: '#fff',
                                                                        fontSize: '1rem',
                                                                        fontWeight: 'bold',
                                                                        '& fieldset': {
                                                                            borderColor: 'transparent',
                                                                        },
                                                                        '&:hover fieldset': {
                                                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                                                        },
                                                                        '&.Mui-focused fieldset': {
                                                                            borderColor: '#dded00',
                                                                        },
                                                                        '& input': {
                                                                            textAlign: 'center',
                                                                            padding: '6px',
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                ⏱
                                                            </Typography>
                                                            <TextField
                                                                value={set.restTime}
                                                                onChange={(e) => handleSetValueChange(exercise.id, setIndex, 'restTime', e.target.value)}
                                                                type="number"
                                                                inputProps={{ min: 0, max: 600, step: 15 }}
                                                                sx={{
                                                                    width: '60px',
                                                                    '& .MuiOutlinedInput-root': {
                                                                        height: '32px',
                                                                        color: '#fff',
                                                                        fontSize: '1rem',
                                                                        fontWeight: 'bold',
                                                                        '& fieldset': {
                                                                            borderColor: 'transparent',
                                                                        },
                                                                        '&:hover fieldset': {
                                                                            borderColor: 'rgba(221, 237, 0, 0.5)',
                                                                        },
                                                                        '&.Mui-focused fieldset': {
                                                                            borderColor: '#dded00',
                                                                        },
                                                                        '& input': {
                                                                            textAlign: 'center',
                                                                            padding: '6px',
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>

                                                    {/* Remove Set Button */}
                                                    {(exercise.sets && exercise.sets.length > 1) && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveSet(exercise.id, setIndex)}
                                                            sx={{
                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                ml: 1,
                                                                '&:hover': {
                                                                    color: '#f44336',
                                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                                }
                                                            }}
                                                        >
                                                            <MdRemove size={14} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            ))}

                                            {/* Add Set Button */}
                                            <Button
                                                size="small"
                                                startIcon={<MdAdd size={14} />}
                                                fullWidth
                                                onClick={() => handleAddSet(exercise.id)}
                                                sx={{
                                                    color: '#dded00',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'none',
                                                    fontWeight: 'medium',
                                                    border: '1px solid rgba(221, 237, 0, 0.3)',
                                                    borderRadius: '6px',
                                                    py: 0.5,
                                                    mt: 1,
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                                        borderColor: '#dded00'
                                                    }
                                                }}
                                            >
                                                Add Set
                                            </Button>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Create New Workout
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <MdClose />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{
                p: { xs: 2, md: 3 },
                height: { xs: 'calc(100vh - 120px)', md: 'auto' },
                overflowY: 'auto'
            }}>
                {/* Stepper */}
                <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel sx={{ color: '#fff' }}>
                                <Typography sx={{ color: activeStep >= index ? '#dded00' : 'rgba(255, 255, 255, 0.6)' }}>
                                    {index + 1}. {label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </StyledStepper>

                {/* Step Content */}
                {renderStepContent(activeStep)}
            </DialogContent>

            <DialogActions sx={{
                p: { xs: 2, md: 3 },
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
            }}>
                {activeStep === 0 ? (
                    <Button onClick={handleClose} sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        width: { xs: '100%', sm: 'auto' }
                    }}>
                        Cancel
                    </Button>
                ) : (
                    <Button onClick={handleBack} sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        width: { xs: '100%', sm: 'auto' }
                    }}>
                        Back
                    </Button>
                )}

                {activeStep === steps.length - 1 ? (
                    <Button
                        onClick={handleCreateWorkout}
                        disabled={loading || !workoutData.name || selectedExercises.length === 0}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                            },
                            '&:disabled': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Workout'}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        disabled={!workoutData.name || !workoutData.category}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                            },
                            '&:disabled': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.3)',
                            },
                        }}
                    >
                        Next: Add Exercises
                    </Button>
                )}
            </DialogActions>
        </StyledDialog>
    );
};

CreateWorkoutModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onWorkoutCreated: PropTypes.func.isRequired,
};

export default CreateWorkoutModal;
