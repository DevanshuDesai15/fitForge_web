import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Fab,
    Grid,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdEdit,
    MdContentCopy,
    MdPlayArrow,
    MdFitnessCenter
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
    },
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

export default function WorkoutTemplates() {
    const [templates, setTemplates] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [availableExercises, setAvailableExercises] = useState([]);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        exercises: []
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const muscleGroups = [
        { id: 'back', name: 'Back', icon: <MdFitnessCenter /> },
        { id: 'chest', name: 'Chest', icon: <MdFitnessCenter /> },
        { id: 'biceps', name: 'Biceps', icon: <MdFitnessCenter /> },
        { id: 'triceps', name: 'Triceps', icon: <MdFitnessCenter /> },
        { id: 'shoulders', name: 'Shoulders', icon: <MdFitnessCenter /> },
        { id: 'legs', name: 'Legs', icon: <MdFitnessCenter /> },
        { id: 'abs', name: 'Abs', icon: <MdFitnessCenter /> },
        { id: 'forearms', name: 'Forearms', icon: <MdFitnessCenter /> },
        { id: 'calves', name: 'Calves', icon: <MdFitnessCenter /> },
        { id: 'cardio', name: 'Cardio', icon: <MdFitnessCenter /> }
    ];

    const [workoutDays, setWorkoutDays] = useState([
        { id: 1, name: 'Day 1', muscleGroups: [] }
    ]);

    useEffect(() => {
        loadTemplates();
        loadExerciseLibrary();
    }, [currentUser]);

    const loadTemplates = async () => {
        try {
            if (!currentUser) {
                setTemplates([]);
                return;
            }

            const q = query(
                collection(db, 'workoutTemplates'),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const templateData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(templateData);
        } catch (error) {
            console.error("Error loading templates:", error);
            setError("Failed to load templates");
            setTemplates([]);
        }
    };

    const loadExerciseLibrary = async () => {
        try {
            const q = query(
                collection(db, 'exerciseLibrary'),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            setAvailableExercises(querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error("Error loading exercise library:", error);
        }
    };

    const handleExerciseSelect = (exercise) => {
        setSelectedExercises([...selectedExercises, exercise]);
        setNewTemplate(prev => ({
            ...prev,
            exercises: [...prev.exercises, {
                name: exercise.name,
                sets: exercise.sets || 3,
                reps: exercise.reps || 10,
                weight: exercise.weight || 0
            }]
        }));
    };

    const handleRemoveExercise = (index) => {
        const updatedExercises = [...newTemplate.exercises];
        updatedExercises.splice(index, 1);
        setNewTemplate(prev => ({
            ...prev,
            exercises: updatedExercises
        }));
        const updatedSelected = [...selectedExercises];
        updatedSelected.splice(index, 1);
        setSelectedExercises(updatedSelected);
    };

    const handleAddDay = () => {
        setWorkoutDays(prev => [
            ...prev,
            {
                id: prev.length + 1,
                name: `Day ${prev.length + 1}`,
                muscleGroups: []
            }
        ]);
    };

    const handleRemoveDay = (dayId) => {
        setWorkoutDays(prev => prev.filter(day => day.id !== dayId));
    };

    const handleMuscleGroupSelect = (dayId, muscleGroup) => {
        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                const isAlreadySelected = day.muscleGroups.some(mg => mg.id === muscleGroup.id);
                const updatedMuscleGroups = isAlreadySelected
                    ? day.muscleGroups.filter(mg => mg.id !== muscleGroup.id)
                    : [...day.muscleGroups, muscleGroup];
                return { ...day, muscleGroups: updatedMuscleGroups };
            }
            return day;
        }));
    };

    const handleCreateTemplate = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!newTemplate.name.trim()) {
            setError('Template name is required');
            setLoading(false);
            return;
        }

        if (workoutDays.some(day => day.muscleGroups.length === 0)) {
            setError('Please select muscle groups for all days');
            setLoading(false);
            return;
        }

        try {
            // Sanitize the workout days data
            const sanitizedWorkoutDays = workoutDays.map(day => ({
                id: day.id,
                name: day.name,
                muscleGroups: day.muscleGroups.map(mg => ({
                    id: mg.id,
                    name: mg.name
                }))
            }));

            // Create a clean template object
            const templateData = {
                name: newTemplate.name,
                description: newTemplate.description || '',
                workoutDays: sanitizedWorkoutDays,
                userId: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            console.log('Creating template with data:', templateData);

            const docRef = await addDoc(collection(db, 'workoutTemplates'), templateData);
            console.log('Template created with ID:', docRef.id);

            setSuccess('Template created successfully!');
            setNewTemplate({
                name: '',
                description: '',
                exercises: []
            });
            setWorkoutDays([{ id: 1, name: 'Day 1', muscleGroups: [] }]);
            loadTemplates();
            setOpenDialog(false);
        } catch (error) {
            console.error('Error creating template:', error);
            setError(`Failed to create template: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        try {
            await deleteDoc(doc(db, 'workoutTemplates', templateId));
            setSuccess('Template deleted successfully!');
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            setError('Failed to delete template');
        }
    };

    const handleStartTemplate = (template) => {
        navigate('/workout/start', { state: { template } });
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                        Workout Templates
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                        }}
                    >
                        Create Template
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {Array.isArray(templates) && templates.length > 0 ? (
                        templates.map((template) => (
                            <Grid item xs={12} md={6} key={template.id}>
                                <StyledCard>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                                {template.name}
                                            </Typography>
                                            <Box>
                                                <IconButton
                                                    onClick={() => handleStartTemplate(template)}
                                                    sx={{ color: '#00ff9f' }}
                                                >
                                                    <MdPlayArrow />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    sx={{ color: '#ff4444' }}
                                                >
                                                    <MdDelete />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                            {template.description}
                                        </Typography>
                                        {template.workoutDays?.map((day, index) => (
                                            <Box key={day.id || index} sx={{ mt: 2 }}>
                                                <Typography variant="subtitle1" sx={{ color: '#00ff9f' }}>
                                                    {day.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {day.muscleGroups?.map((mg, mgIndex) => (
                                                        <Chip
                                                            key={mg.id || mgIndex}
                                                            label={mg.name}
                                                            icon={<MdFitnessCenter />}
                                                            sx={{
                                                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                                color: '#00ff9f',
                                                                '& .MuiChip-icon': { color: '#00ff9f' }
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        ))}
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                No workout templates found. Create one to get started!
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{
                        style: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                            maxWidth: '800px',
                            width: '100%'
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>Create Workout Template</DialogTitle>
                    <DialogContent>
                        <StyledTextField
                            autoFocus
                            margin="dense"
                            label="Template Name"
                            fullWidth
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <StyledTextField
                            margin="dense"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                            sx={{ mb: 3 }}
                        />

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: '#00ff9f' }}>
                                    Workout Split
                                </Typography>
                                <Button
                                    startIcon={<MdAdd />}
                                    onClick={handleAddDay}
                                    sx={{ color: '#00ff9f' }}
                                >
                                    Add Day
                                </Button>
                            </Box>

                            {workoutDays.map((day) => (
                                <Card
                                    key={day.id}
                                    sx={{
                                        mb: 2,
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                                {day.name}
                                            </Typography>
                                            {workoutDays.length > 1 && (
                                                <IconButton
                                                    onClick={() => handleRemoveDay(day.id)}
                                                    sx={{ color: '#ff4444' }}
                                                >
                                                    <MdDelete />
                                                </IconButton>
                                            )}
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                                            Select Muscle Groups:
                                        </Typography>

                                        <Grid container spacing={1}>
                                            {muscleGroups.map((muscleGroup) => (
                                                <Grid item key={muscleGroup.id}>
                                                    <Chip
                                                        icon={muscleGroup.icon}
                                                        label={muscleGroup.name}
                                                        onClick={() => handleMuscleGroupSelect(day.id, muscleGroup)}
                                                        sx={{
                                                            backgroundColor: day.muscleGroups.some(mg => mg.id === muscleGroup.id)
                                                                ? 'rgba(0, 255, 159, 0.2)'
                                                                : 'rgba(255, 255, 255, 0.1)',
                                                            color: day.muscleGroups.some(mg => mg.id === muscleGroup.id)
                                                                ? '#00ff9f'
                                                                : '#fff',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(0, 255, 159, 0.3)',
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>

                                        {day.muscleGroups.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#00ff9f', mb: 1 }}>
                                                    Selected:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {day.muscleGroups.map((mg) => (
                                                        <Chip
                                                            key={mg.id}
                                                            label={mg.name}
                                                            onDelete={() => handleMuscleGroupSelect(day.id, mg)}
                                                            sx={{
                                                                backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                color: '#00ff9f',
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTemplate}
                            disabled={loading}
                            sx={{ color: '#00ff9f' }}
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}