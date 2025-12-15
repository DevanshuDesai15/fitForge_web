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
    Grid,
    TextareaAutosize,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdClose, MdAdd, MdCalendarToday, MdDeleteOutline, MdFitnessCenter } from 'react-icons/md';
import { fetchAllExercises } from '../../../services/localExerciseService';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { programTemplates as defaultProgramTemplates } from './programTemplates';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        background: '#1a1a1a',
        border: '1px solid rgba(221, 237, 0, 0.2)',
        borderRadius: '16px',
        maxWidth: '900px',
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
}));

const TemplateCard = styled(Card)(({ selected }) => ({
    background: selected ? 'rgba(221, 237, 0, 0.1)' : 'rgba(40, 40, 40, 0.9)',
    border: selected ? '2px solid #dded00' : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.5)',
        transform: 'translateY(-2px)',
    },
}));

const CreateProgramModal = ({ open, onClose, onProgramCreated, editData }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [exercisesLoading, setExercisesLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [programTemplates, setProgramTemplates] = useState([]);
    const { currentUser } = useAuth();

    const [programData, setProgramData] = useState({
        name: '',
        description: '',
        duration: '8 days',
        frequency: '4x/week',
        category: 'Strength Training',
        difficulty: 'Intermediate',
        days: []
    });

    // Load exercises from JSON data and handle edit data
    useEffect(() => {
        const loadExercises = async () => {
            try {
                setExercisesLoading(true);
                const exerciseData = await fetchAllExercises();
                const transformedExercises = exerciseData.map(exercise => ({
                    id: exercise.id,
                    name: exercise.name || exercise.title,
                    muscleGroup: exercise.bodyPart || exercise.target || 'General',
                    equipment: exercise.equipment || 'Unknown',
                }));
                setExercises(transformedExercises);
            } catch (error) {
                console.error('Error loading exercises:', error);
                setExercises([]);
            } finally {
                setExercisesLoading(false);
            }
        };
        loadExercises();

        setProgramTemplates(defaultProgramTemplates);

        // Initialize with edit data if provided
        if (editData) {
            setProgramData({
                name: editData.name || '',
                description: editData.description || '',
                duration: editData.duration || '7 days',
                frequency: editData.frequency || '1x/week',
                category: editData.category || 'Strength Training',
                difficulty: editData.difficulty || 'Intermediate',
                days: editData.days || []
            });
            setActiveStep(1); // Skip template selection for editing
        }
    }, [editData]);

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const steps = ['Template', 'Details', 'Days'];

    const durationOptions = ['2 days', '3 days', '4 days', '5 days', '6 days', '7 days'];
    const frequencyOptions = ['1x/week', '2x/week', '3x/week', '4x/week', 'Daily'];
    const categoryOptions = [
        'Strength Training', 'Hypertrophy', 'Powerlifting', 'Bodybuilding',
        'Functional', 'Sports Specific', 'Beginner Friendly'
    ];
    const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];

    const handleNext = () => {
        if (activeStep === 0 && selectedTemplate && selectedTemplate !== 'scratch') {
            // Apply template data
            const template = programTemplates.find(t => t.id === selectedTemplate);
            if (template) {
                setProgramData(prev => ({
                    ...prev,
                    name: template.name,
                    description: template.description,
                    category: template.category,
                    difficulty: template.difficulty,
                    frequency: template.frequency,
                    duration: template.duration,
                    days: template.days || []
                }));
            }
        }
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleClose = () => {
        setActiveStep(0);
        setSelectedTemplate(null);
        setProgramData({
            name: '',
            description: '',
            duration: '7 days',
            frequency: '1x/week',
            category: 'Strength Training',
            difficulty: 'Intermediate',
            days: []
        });
        onClose();
    };

    const handleInputChange = (field, value) => {
        setProgramData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
    };

    const handleStartFromScratch = () => {
        setSelectedTemplate('scratch');
        setProgramData(prev => ({
            ...prev,
            days: []
        }));
    };

    const handleAddDay = () => {
        const newDay = {
            id: Date.now(),
            name: `Day ${programData.days.length + 1}`,
            focus: '',
            exercises: []
        };
        setProgramData(prev => ({
            ...prev,
            days: [...prev.days, newDay]
        }));
        setSelectedDayId(newDay.id);
    };

    const handleCreateProgram = async () => {
        setLoading(true);
        try {
            if (editData) {
                // Update existing program
                console.log('Updating program:', programData);

                const programToUpdate = {
                    ...programData,
                    updatedAt: serverTimestamp(),
                };

                await updateDoc(doc(db, 'workoutPrograms', editData.id), programToUpdate);
                console.log('Program updated successfully');
            } else {
                // Create new program
                console.log('Creating program:', programData);

                await addDoc(collection(db, 'workoutPrograms'), {
                    ...programData,
                    userId: currentUser.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    isTemplate: false,
                });
                console.log('Program created successfully');
            }

            onProgramCreated();
            handleClose();
        } catch (error) {
            console.error('Error saving program:', error);
            alert(`Failed to ${editData ? 'update' : 'create'} program. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDay = (dayId) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.filter(day => day.id !== dayId)
        }));
        if (selectedDayId === dayId) {
            setSelectedDayId(null);
        }
    };

    const handleDayDetailsChange = (field, value) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day =>
                day.id === selectedDayId
                    ? { ...day, [field]: value }
                    : day
            )
        }));
    };

    const handleAddExerciseToDay = (exercise) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day => {
                if (day.id === selectedDayId && !day.exercises.some(e => e.id === exercise.id)) {
                    const newExercise = {
                        ...exercise,
                        sets: [{ setNumber: 1, reps: '10' }],
                    };
                    return { ...day, exercises: [...day.exercises, newExercise] };
                }
                return day;
            })
        }));
    };

    const handleRemoveExerciseFromDay = (exerciseId) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day =>
                day.id === selectedDayId
                    ? { ...day, exercises: day.exercises.filter(e => e.id !== exerciseId) }
                    : day
            )
        }));
    };

    const handleSetChange = (exerciseId, setIndex, value) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day => {
                if (day.id === selectedDayId) {
                    return {
                        ...day,
                        exercises: day.exercises.map(ex => {
                            if (ex.id === exerciseId) {
                                const updatedSets = [...ex.sets];
                                updatedSets[setIndex] = { ...updatedSets[setIndex], reps: value };
                                return { ...ex, sets: updatedSets };
                            }
                            return ex;
                        })
                    };
                }
                return day;
            })
        }));
    };

    const handleAddSet = (exerciseId) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day => {
                if (day.id === selectedDayId) {
                    return {
                        ...day,
                        exercises: day.exercises.map(ex => {
                            if (ex.id === exerciseId) {
                                const newSet = { setNumber: ex.sets.length + 1, reps: '10' };
                                return { ...ex, sets: [...ex.sets, newSet] };
                            }
                            return ex;
                        })
                    };
                }
                return day;
            })
        }));
    };

    const handleRemoveSet = (exerciseId, setIndex) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day => {
                if (day.id === selectedDayId) {
                    return {
                        ...day,
                        exercises: day.exercises.map(ex => {
                            if (ex.id === exerciseId && ex.sets.length > 1) {
                                const updatedSets = ex.sets.filter((_, index) => index !== setIndex)
                                    .map((set, index) => ({ ...set, setNumber: index + 1 }));
                                return { ...ex, sets: updatedSets };
                            }
                            return ex;
                        })
                    };
                }
                return day;
            })
        }));
    };

    const handleExerciseDetailsChange = (exerciseId, field, value) => {
        setProgramData(prev => ({
            ...prev,
            days: prev.days.map(day => {
                if (day.id === selectedDayId) {
                    return {
                        ...day,
                        exercises: day.exercises.map(ex =>
                            ex.id === exerciseId
                                ? { ...ex, [field]: value }
                                : ex
                        )
                    };
                }
                return day;
            })
        }));
    };

    const selectedDay = programData.days.find(day => day.id === selectedDayId);

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                if (!programTemplates) {
                    return <Typography>Loading templates...</Typography>;
                }
                return (
                    <Box>
                        <Typography variant="h5" sx={{ color: '#fff', mb: 1, textAlign: 'center' }}>
                            Choose a Program Template
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
                            Start with a proven template or create from scratch
                        </Typography>

                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {programTemplates.map((template) => (
                                <Grid item xs={12} md={6} key={template.id}>
                                    <TemplateCard
                                        selected={selectedTemplate === template.id}
                                        onClick={() => handleTemplateSelect(template.id)}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>
                                                {template.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                {template.description}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={template.category}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                                        color: '#dded00',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Chip
                                                    label={template.difficulty}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                                                        color: '#ff9800',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Chip
                                                    label={template.frequency}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                                        color: '#4caf50',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Chip
                                                    label={template.duration}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                                        color: '#2196f3',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </Box>

                                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                                                Program Structure:
                                            </Typography>
                                            {template.days.map((day) => (
                                                <Typography key={day.id} variant="caption" sx={{ color: '#dded00', display: 'block' }}>
                                                    <strong>Day {day.id}:</strong> {day.name} ({day.focus})
                                                </Typography>
                                            ))}
                                        </CardContent>
                                    </TemplateCard>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Start from Scratch Option */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<MdAdd />}
                                onClick={handleStartFromScratch}
                                sx={{
                                    borderColor: selectedTemplate === 'scratch' ? '#dded00' : 'rgba(255, 255, 255, 0.3)',
                                    color: selectedTemplate === 'scratch' ? '#dded00' : '#fff',
                                    backgroundColor: selectedTemplate === 'scratch' ? 'rgba(221, 237, 0, 0.1)' : 'transparent',
                                    borderRadius: '50px',
                                    px: 4,
                                    py: 1.5,
                                    '&:hover': {
                                        borderColor: '#dded00',
                                        backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                    },
                                }}
                            >
                                Start from Scratch
                            </Button>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                Create a completely custom program tailored to your needs
                            </Typography>
                        </Box>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Grid container spacing={4}>
                            {/* Program Information */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
                                    Program Information
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Program Name"
                                    value={programData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            backgroundColor: 'rgba(40, 40, 40, 0.6)',
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

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                        Description
                                    </Typography>
                                    <TextareaAutosize
                                        minRows={4}
                                        placeholder="Describe your program goals and approach..."
                                        value={programData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: 'rgba(40, 40, 40, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            outline: 'none',
                                        }}
                                    />
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                                            <Select
                                                value={programData.category}
                                                onChange={(e) => handleInputChange('category', e.target.value)}
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(40, 40, 40, 0.6)',
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
                                                {categoryOptions.map((category) => (
                                                    <MenuItem key={category} value={category}>
                                                        {category}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Difficulty</InputLabel>
                                            <Select
                                                value={programData.difficulty}
                                                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(40, 40, 40, 0.6)',
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
                                                {difficultyOptions.map((difficulty) => (
                                                    <MenuItem key={difficulty} value={difficulty}>
                                                        {difficulty}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Program Structure */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
                                    Program Structure
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Duration</InputLabel>
                                            <Select
                                                value={programData.duration}
                                                onChange={(e) => handleInputChange('duration', e.target.value)}
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(40, 40, 40, 0.6)',
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
                                                {durationOptions.map((duration) => (
                                                    <MenuItem key={duration} value={duration}>
                                                        {duration}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Frequency</InputLabel>
                                            <Select
                                                value={programData.frequency}
                                                onChange={(e) => handleInputChange('frequency', e.target.value)}
                                                sx={{
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(40, 40, 40, 0.6)',
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
                                                {frequencyOptions.map((frequency) => (
                                                    <MenuItem key={frequency} value={frequency}>
                                                        {frequency}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{
                        display: 'flex',
                        gap: 4,
                        height: { xs: 'auto', md: '65vh' },
                        flexDirection: { xs: 'column', md: 'row' }
                    }}>
                        {/* Left Panel: Program Days List */}
                        <Box sx={{
                            width: { xs: '100%', md: '300px' },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            borderRight: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
                            pr: { xs: 0, md: 4 },
                            borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
                            pb: { xs: 2, md: 0 },
                            mb: { xs: 2, md: 0 }
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    Program Days
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<MdAdd />}
                                    onClick={handleAddDay}
                                    size="small"
                                    sx={{
                                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                        },
                                    }}
                                >
                                    Add Day
                                </Button>
                            </Box>

                            {programData.days.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 8, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <MdCalendarToday size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '16px' }} />
                                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                                        No days added yet
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Click &quot;Add Day&quot; to start
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ overflowY: 'auto', pr: 1 }}>
                                    {programData.days.map(day => (
                                        <Card
                                            key={day.id}
                                            onClick={() => setSelectedDayId(day.id)}
                                            sx={{
                                                p: 2,
                                                mb: 1.5,
                                                cursor: 'pointer',
                                                backgroundColor: selectedDayId === day.id ? 'rgba(221, 237, 0, 0.1)' : 'rgba(40, 40, 40, 0.6)',
                                                border: selectedDayId === day.id ? '1px solid #dded00' : '1px solid rgba(255, 255, 255, 0.1)',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(221, 237, 0, 0.05)',
                                                    borderColor: '#dded00'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>{day.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {day.exercises?.length || 0} exercises
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        '&:hover': { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                                                    }}
                                                >
                                                    <MdClose size={16} />
                                                </IconButton>
                                            </Box>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* Right Panel: Day Configuration */}
                        <Box sx={{ flex: 1, minHeight: '300px' }}>
                            {!selectedDay ? (
                                <Box sx={{ textAlign: 'center', py: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <MdCalendarToday size={64} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '16px' }} />
                                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                                        Select a Day
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Choose a day from the list to configure its exercises
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* Day Configuration Form */}
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={8}>
                                            <TextField
                                                fullWidth
                                                label="Day Name"
                                                value={selectedDay.name}
                                                onChange={(e) => handleDayDetailsChange('name', e.target.value)}
                                                variant="filled"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                fullWidth
                                                label="Estimated Duration (min)"
                                                type="number"
                                                value={selectedDay.duration}
                                                onChange={(e) => handleDayDetailsChange('duration', e.target.value)}
                                                variant="filled"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Day Description"
                                                value={selectedDay.description}
                                                onChange={(e) => handleDayDetailsChange('description', e.target.value)}
                                                variant="filled"
                                                size="small"
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                    </Grid>

                                    {/* Exercises Section */}
                                    <Box sx={{ display: 'flex', gap: 4, flex: 1, overflow: 'hidden' }}>
                                        {/* Added Exercises */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Exercises ({selectedDay.exercises?.length || 0})</Typography>
                                            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: '8px', p: 2 }}>
                                                {selectedDay.exercises?.length === 0 ? (
                                                    <Box sx={{ textAlign: 'center', color: 'text.secondary', pt: 4 }}>
                                                        <MdFitnessCenter size={40} />
                                                        <Typography>No exercises added</Typography>
                                                    </Box>
                                                ) : (
                                                    selectedDay.exercises.map(ex => (
                                                        <Card key={ex.id} sx={{ p: 1.5, mb: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box>
                                                                    <Typography sx={{ color: '#fff' }}>{ex.name}</Typography>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ex.muscleGroup}</Typography>
                                                                </Box>
                                                                <IconButton size="small" onClick={() => handleRemoveExerciseFromDay(ex.id)}>
                                                                    <MdDeleteOutline sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: '#f44336' } }} />
                                                                </IconButton>
                                                            </Box>
                                                            <Box sx={{ mt: 1.5 }}>
                                                                {ex.sets.map((set, setIndex) => (
                                                                    <Box key={setIndex} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                                                        <Typography sx={{ color: 'text.secondary', minWidth: '40px' }}>Set {set.setNumber}</Typography>
                                                                        <TextField
                                                                            label="Reps"
                                                                            value={set.reps}
                                                                            onChange={(e) => handleSetChange(ex.id, setIndex, e.target.value)}
                                                                            size="small"
                                                                            variant="filled"
                                                                            sx={{ flex: 1 }}
                                                                        />
                                                                        {ex.sets.length > 1 && (
                                                                            <IconButton size="small" onClick={() => handleRemoveSet(ex.id, setIndex)}>
                                                                                <MdDeleteOutline sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: '#f44336' } }} />
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                ))}
                                                                <Button
                                                                    size="small"
                                                                    onClick={() => handleAddSet(ex.id)}
                                                                    startIcon={<MdAdd />}
                                                                    sx={{ mt: 1, color: '#dded00', textTransform: 'none' }}
                                                                >
                                                                    Add Set
                                                                </Button>
                                                            </Box>
                                                        </Card>
                                                    ))
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Add Exercises Library */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Add Exercises</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="Search exercises..."
                                                variant="filled"
                                                size="small"
                                                sx={{ mb: 2 }}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                                                {exercisesLoading ? <Typography sx={{ color: 'text.secondary' }}>Loading...</Typography> :
                                                    filteredExercises.map(ex => (
                                                        <Card
                                                            key={ex.id}
                                                            onClick={() => handleAddExerciseToDay(ex)}
                                                            sx={{
                                                                p: 1.5,
                                                                mb: 1,
                                                                cursor: 'pointer',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                                                            }}
                                                        >
                                                            <Typography sx={{ color: '#fff' }}>{ex.name}</Typography>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                {ex.muscleGroup} • {ex.equipment}
                                                            </Typography>
                                                        </Card>
                                                    ))
                                                }
                                            </Box>
                                        </Box>
                                    </Box>
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
        <StyledDialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                pb: 2
            }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {editData ? 'Edit Workout Program' : 'Create Workout Program'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Design a structured multi-day workout program with progressive training
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <MdClose />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{
                p: { xs: 2, md: 3 },
                minHeight: '500px'
            }}>
                {/* Stepper */}
                <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel sx={{ color: '#fff' }}>
                                <Typography sx={{
                                    color: activeStep >= index ? '#dded00' : 'rgba(255, 255, 255, 0.6)',
                                    fontWeight: activeStep === index ? 'bold' : 'normal'
                                }}>
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
                        {activeStep === 2 ? 'Back to Details' : 'Back'}
                    </Button>
                )}

                {activeStep === steps.length - 1 ? (
                    <Button
                        onClick={handleCreateProgram}
                        disabled={loading || !programData.name}
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
                        {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Program' : 'Create Program')}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        disabled={activeStep === 0 && !selectedTemplate}
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
                        {activeStep === 1 ? 'Configure Days' : 'Continue'}
                    </Button>
                )}
            </DialogActions>
        </StyledDialog>
    );
};

CreateProgramModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onProgramCreated: PropTypes.func.isRequired,
    editData: PropTypes.object,
};

export default CreateProgramModal;
