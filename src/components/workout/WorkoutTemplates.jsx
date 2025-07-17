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
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdEdit,
    MdContentCopy,
    MdPlayArrow,
    MdFitnessCenter,
    MdExpandMore,
    MdSave,
    MdCancel
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchExercisesByTarget } from '../../services/exerciseAPI';

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
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [availableExercises, setAvailableExercises] = useState([]);
    const [muscleGroupExercises, setMuscleGroupExercises] = useState({});
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        workoutDays: []
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const muscleGroups = [
        { id: 'back', name: 'Back', apiName: 'back' },
        { id: 'chest', name: 'Chest', apiName: 'chest' },
        { id: 'shoulders', name: 'Shoulders', apiName: 'shoulders' },
        { id: 'upper_arms', name: 'Upper Arms', apiName: 'upper arms' },
        { id: 'lower_arms', name: 'Lower Arms', apiName: 'lower arms' },
        { id: 'upper_legs', name: 'Upper Legs', apiName: 'upper legs' },
        { id: 'lower_legs', name: 'Lower Legs', apiName: 'lower legs' },
        { id: 'waist', name: 'Abs/Core', apiName: 'waist' },
        { id: 'cardio', name: 'Cardio', apiName: 'cardio' }
    ];

    const [workoutDays, setWorkoutDays] = useState([
        { id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }
    ]);

    useEffect(() => {
        loadTemplates();
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
                ...doc.data(),
                workoutDays: (doc.data().workoutDays || []).map(day => ({
                    ...day,
                    muscleGroups: day.muscleGroups || [],
                    exercises: day.exercises || []
                }))
            }));
            setTemplates(templateData);
        } catch (error) {
            console.error("Error loading templates:", error);
            setError("Failed to load templates");
            setTemplates([]);
        }
    };

    const loadExercisesForMuscleGroup = async (muscleGroup) => {
        if (muscleGroupExercises[muscleGroup.id]) {
            return muscleGroupExercises[muscleGroup.id];
        }

        setLoadingExercises(true);
        try {
            const exercises = await fetchExercisesByTarget(muscleGroup.apiName);
            const exerciseArray = Array.isArray(exercises) ? exercises : [];
            const exerciseList = exerciseArray.slice(0, 20).map(ex => ({
                id: ex.id,
                name: ex.name,
                target: ex.target,
                equipment: ex.equipment
            }));
            
            setMuscleGroupExercises(prev => ({
                ...prev,
                [muscleGroup.id]: exerciseList
            }));
            
            return exerciseList;
        } catch (error) {
            console.error("Error loading exercises for muscle group:", error);
            return [];
        } finally {
            setLoadingExercises(false);
        }
    };

    const handleExerciseToggle = (dayId, exercise) => {
        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                const isSelected = day.exercises.some(ex => ex.id === exercise.id);
                const updatedExercises = isSelected
                    ? day.exercises.filter(ex => ex.id !== exercise.id)
                    : [...day.exercises, { ...exercise, sets: 3, reps: 10, weight: 0 }];
                return { ...day, exercises: updatedExercises };
            }
            return day;
        }));
    };

    const handleAddDay = () => {
        setWorkoutDays(prev => [
            ...prev,
            {
                id: prev.length + 1,
                name: `Day ${prev.length + 1}`,
                muscleGroups: [],
                exercises: []
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
                
                // If removing muscle group, also remove its exercises
                const updatedExercises = isAlreadySelected
                    ? day.exercises.filter(ex => {
                        const exerciseList = muscleGroupExercises[muscleGroup.id] || [];
                        return !exerciseList.some(mgEx => mgEx.id === ex.id);
                    })
                    : day.exercises;
                
                return { ...day, muscleGroups: updatedMuscleGroups, exercises: updatedExercises };
            }
            return day;
        }));
        
        // Load exercises for newly selected muscle group
        const day = workoutDays.find(d => d.id === dayId);
        const isAlreadySelected = day.muscleGroups.some(mg => mg.id === muscleGroup.id);
        if (!isAlreadySelected) {
            loadExercisesForMuscleGroup(muscleGroup);
        }
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setNewTemplate({
            name: template.name,
            description: template.description || ''
        });
        setWorkoutDays((template.workoutDays || []).map(day => ({
            ...day,
            muscleGroups: day.muscleGroups || [],
            exercises: day.exercises || []
        })));
        setOpenDialog(true);
    };

    const handleUpdateTemplate = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!newTemplate.name.trim()) {
            setError('Template name is required');
            setLoading(false);
            return;
        }

        try {
            const sanitizedWorkoutDays = workoutDays.map(day => ({
                id: day.id,
                name: day.name,
                muscleGroups: day.muscleGroups.map(mg => ({
                    id: mg.id,
                    name: mg.name
                })),
                exercises: day.exercises.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    target: ex.target,
                    equipment: ex.equipment,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight
                }))
            }));

            const templateData = {
                name: newTemplate.name,
                description: newTemplate.description || '',
                workoutDays: sanitizedWorkoutDays,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'workoutTemplates', editingTemplate.id), templateData);

            setSuccess('Template updated successfully!');
            resetForm();
            loadTemplates();
            setOpenDialog(false);
        } catch (error) {
            console.error('Error updating template:', error);
            setError(`Failed to update template: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setNewTemplate({
            name: '',
            description: ''
        });
        setWorkoutDays([{ id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }]);
        setMuscleGroupExercises({});
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

        try {
            const sanitizedWorkoutDays = workoutDays.map(day => ({
                id: day.id,
                name: day.name,
                muscleGroups: day.muscleGroups.map(mg => ({
                    id: mg.id,
                    name: mg.name
                })),
                exercises: day.exercises.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    target: ex.target,
                    equipment: ex.equipment,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight
                }))
            }));

            const templateData = {
                name: newTemplate.name,
                description: newTemplate.description || '',
                workoutDays: sanitizedWorkoutDays,
                userId: currentUser.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'workoutTemplates'), templateData);

            setSuccess('Template created successfully!');
            resetForm();
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
                                                    onClick={() => handleEditTemplate(template)}
                                                    sx={{ color: '#ffc107' }}
                                                >
                                                    <MdEdit />
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
                                        {(Array.isArray(template.workoutDays) ? template.workoutDays : []).map((day, index) => (
                                            <Box key={day.id || index} sx={{ mt: 2 }}>
                                                <Typography variant="subtitle1" sx={{ color: '#00ff9f' }}>
                                                    {day.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {(Array.isArray(day.muscleGroups) ? day.muscleGroups : []).map((mg, mgIndex) => (
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
                                                {Array.isArray(day.exercises) && day.exercises.length > 0 && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            {day.exercises.length} exercises selected
                                                        </Typography>
                                                    </Box>
                                                )}
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
                    onClose={() => {
                        setOpenDialog(false);
                        resetForm();
                    }}
                    PaperProps={{
                        sx: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                            maxWidth: '800px',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>
                        {editingTemplate ? 'Edit Workout Template' : 'Create Workout Template'}
                    </DialogTitle>
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

                                        {day.muscleGroups.length > 0 &&
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: '#00ff9f', mb: 1 }}>
                                                    Select Exercises:
                                                </Typography>
                                                {day.muscleGroups.map((muscleGroup) => (
                                                    <Accordion
                                                        key={muscleGroup.id}
                                                        sx={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                            mb: 1,
                                                            '&:before': { display: 'none' }
                                                        }}
                                                    >
                                                        <AccordionSummary
                                                            expandIcon={<MdExpandMore style={{ color: '#00ff9f' }} />}
                                                            onClick={() => loadExercisesForMuscleGroup(muscleGroup)}
                                                        >
                                                            <Typography sx={{ color: '#00ff9f' }}>
                                                                {muscleGroup.name} Exercises
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            {loadingExercises ? (
                                                                <Typography sx={{ color: 'text.secondary' }}>
                                                                    Loading exercises...
                                                                </Typography>
                                                            ) : (
                                                                <Grid container spacing={1}>
                                                                    {(muscleGroupExercises[muscleGroup.id] || []).map((exercise) => (
                                                                        <Grid item xs={12} sm={6} key={exercise.id}>
                                                                            <FormControlLabel
                                                                                control={
                                                                                    <Checkbox
                                                                                        checked={day.exercises.some(ex => ex.id === exercise.id)}
                                                                                        onChange={() => handleExerciseToggle(day.id, exercise)}
                                                                                        sx={{
                                                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                                                            '&.Mui-checked': {
                                                                                                color: '#00ff9f',
                                                                                            },
                                                                                        }}
                                                                                    />
                                                                                }
                                                                                label={
                                                                                    <Box>
                                                                                        <Typography variant="body2" sx={{ color: '#fff' }}>
                                                                                            {exercise.name}
                                                                                        </Typography>
                                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                            {exercise.target} • {exercise.equipment}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                }
                                                                                sx={{ width: '100%', alignItems: 'flex-start' }}
                                                                            />
                                                                        </Grid>
                                                                    ))}
                                                                </Grid>
                                                            )}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                ))}
                                                
                                                {day.exercises.length > 0 && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ color: '#00ff9f', mb: 1 }}>
                                                            Selected Exercises ({day.exercises.length}):
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {day.exercises.map((exercise) => (
                                                                <Chip
                                                                    key={exercise.id}
                                                                    label={exercise.name}
                                                                    onDelete={() => handleExerciseToggle(day.id, exercise)}
                                                                    sx={{
                                                                        backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                        color: '#00ff9f',
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => {
                                setOpenDialog(false);
                                resetForm();
                            }} 
                            sx={{ color: 'text.secondary' }}
                            startIcon={<MdCancel />}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                },
                            }}
                            startIcon={<MdSave />}
                        >
                            {loading ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}