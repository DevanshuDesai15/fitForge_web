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
    IconButton,
    Grid2,
    Chip,
    Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdEdit,
    MdPlayArrow,
    MdFitnessCenter,
    MdSave,
    MdCancel
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchExercisesByTarget, fetchTargetList, fetchExercisesByBodyPart, fetchBodyPartList } from '../../services/exerciseAPI';
import ExerciseSelector from '../common/ExerciseSelector';

const StyledCard = styled(Card)(() => ({
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
    // eslint-disable-next-line no-unused-vars
    const [selectedExercises, setSelectedExercises] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [availableExercises, setAvailableExercises] = useState([]);
    const [muscleGroupExercises, setMuscleGroupExercises] = useState({});
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

    // Updated muscle groups mapped to wger API target muscles and body parts
    const muscleGroups = [
        { id: 'abs', name: 'Abs', type: 'bodyPart', apiName: 'Abs' },
        { id: 'biceps', name: 'Biceps', type: 'target', apiName: 'Biceps' },
        { id: 'triceps', name: 'Triceps', type: 'target', apiName: 'Triceps' },
        { id: 'chest', name: 'Chest', type: 'bodyPart', apiName: 'Chest' },
        { id: 'shoulders', name: 'Shoulders', type: 'target', apiName: 'Shoulders' },
        { id: 'back', name: 'Back', type: 'bodyPart', apiName: 'Back' },
        { id: 'lats', name: 'Lats', type: 'target', apiName: 'Lats' },
        { id: 'legs', name: 'Legs', type: 'bodyPart', apiName: 'Legs' },
        { id: 'quads', name: 'Quadriceps', type: 'target', apiName: 'Quads' },
        { id: 'glutes', name: 'Glutes', type: 'target', apiName: 'Glutes' },
        { id: 'hamstrings', name: 'Hamstrings', type: 'target', apiName: 'Hamstrings' },
        { id: 'calves', name: 'Calves', type: 'bodyPart', apiName: 'Calves' },
        { id: 'arms', name: 'Arms', type: 'bodyPart', apiName: 'Arms' },
        { id: 'cardio', name: 'Cardio', type: 'bodyPart', apiName: 'Cardio' }
    ];

    const [workoutDays, setWorkoutDays] = useState([
        { id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }
    ]);

    useEffect(() => {
        loadTemplates();
        // Verify wger API muscle groups
        checkAvailableTargets();
    }, [currentUser]);

    // Debug function to check available target muscle names from wger API
    const checkAvailableTargets = async () => {
        try {
            console.log('🔍 Checking available wger API targets...');

            // Test both target muscles and body parts
            const [targets, bodyParts] = await Promise.all([
                fetchTargetList(),
                fetchBodyPartList()
            ]);

            console.log('🎯 Available target muscles from wger:', targets);
            console.log('🏋️ Available body parts from wger:', bodyParts);

            // Verify our muscle group mappings
            const ourTargets = muscleGroups.filter(mg => mg.type === 'target').map(mg => mg.apiName);
            const ourBodyParts = muscleGroups.filter(mg => mg.type === 'bodyPart').map(mg => mg.apiName);

            console.log('✅ Our target mappings:', ourTargets);
            console.log('✅ Our body part mappings:', ourBodyParts);

            // Check which of our mappings are available
            const availableTargets = ourTargets.filter(target =>
                targets.some(t => t.toLowerCase().includes(target.toLowerCase()))
            );
            const availableBodyParts = ourBodyParts.filter(bodyPart =>
                bodyParts.some(bp => bp.toLowerCase() === bodyPart.toLowerCase())
            );

            console.log('🎯 Working target mappings:', availableTargets);
            console.log('🏋️ Working body part mappings:', availableBodyParts);

        } catch (error) {
            console.error('❌ Error checking wger API targets:', error);
        }
    };

    // Test all muscle groups function for wger API
    // eslint-disable-next-line no-unused-vars
    const testAllMuscleGroups = async () => {
        console.log('🧪 Testing ALL wger muscle group mappings...');
        const results = [];

        for (const muscleGroup of muscleGroups) {
            try {
                let exercises;
                if (muscleGroup.type === 'target') {
                    exercises = await fetchExercisesByTarget(muscleGroup.apiName);
                } else {
                    exercises = await fetchExercisesByBodyPart(muscleGroup.apiName);
                }

                const result = {
                    name: muscleGroup.name,
                    apiName: muscleGroup.apiName,
                    type: muscleGroup.type,
                    success: true,
                    count: exercises?.length || 0
                };
                results.push(result);
                console.log(`✅ ${muscleGroup.name} (${muscleGroup.type}: ${muscleGroup.apiName}): ${result.count} exercises`);
            } catch (error) {
                const result = {
                    name: muscleGroup.name,
                    apiName: muscleGroup.apiName,
                    type: muscleGroup.type,
                    success: false,
                    error: error.message
                };
                results.push(result);
                console.log(`❌ ${muscleGroup.name} (${muscleGroup.type}: ${muscleGroup.apiName}): ${error.message}`);
            }
            // Add delay to prevent overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('📊 Final wger API Results:', results);
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Working: ${successCount}/${muscleGroups.length} muscle groups`);

        return results;
    };

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

    const handleExerciseSelect = (dayId, exerciseData) => {
        if (!exerciseData) return;

        console.log('🏋️ Template: Adding exercise to day', dayId, ':', exerciseData);

        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                // Check if exercise already exists
                const isAlreadySelected = day.exercises.some(ex => ex.id === exerciseData.id || ex.name === exerciseData.name);

                if (isAlreadySelected) {
                    console.log('⚠️ Exercise already selected for this day');
                    return day;
                }

                // Add new exercise with default values
                const newExercise = {
                    id: exerciseData.id || `custom-${Date.now()}`,
                    name: exerciseData.name,
                    target: exerciseData.target || 'Unknown',
                    equipment: exerciseData.equipment || 'Unknown',
                    bodyPart: exerciseData.bodyPart || 'Unknown',
                    sets: exerciseData.defaultSets || 3,
                    reps: exerciseData.defaultReps || 10,
                    weight: exerciseData.defaultWeight || 0,
                    type: exerciseData.type || 'custom'
                };

                console.log('✅ Adding exercise to template:', newExercise);
                return { ...day, exercises: [...day.exercises, newExercise] };
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
        // console.log('🎯 Selecting muscle group:', muscleGroup);

        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                const isAlreadySelected = day.muscleGroups.some(mg => mg.id === muscleGroup.id);

                // Ensure we're using the complete muscle group object with apiName
                const completeMuscleGroup = muscleGroups.find(mg => mg.id === muscleGroup.id) || muscleGroup;
                // console.log('🔧 Complete muscle group object:', completeMuscleGroup);

                const updatedMuscleGroups = isAlreadySelected
                    ? day.muscleGroups.filter(mg => mg.id !== muscleGroup.id)
                    : [...day.muscleGroups, completeMuscleGroup];

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


    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setNewTemplate({
            name: template.name,
            description: template.description || ''
        });

        // Ensure muscle groups have complete data with apiName
        setWorkoutDays((template.workoutDays || []).map(day => ({
            ...day,
            muscleGroups: (day.muscleGroups || []).map(mg => {
                // Find the complete muscle group object from our main array
                const completeMuscleGroup = muscleGroups.find(mainMg => mainMg.id === mg.id);
                if (completeMuscleGroup) {
                    // console.log(`🔧 Restored complete muscle group: ${mg.name} -> ${completeMuscleGroup.apiName}`);
                    return completeMuscleGroup;
                }
                // console.warn(`⚠️ Could not find complete muscle group for: ${mg.name} (${mg.id})`);
                return mg;
            }),
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
                    name: mg.name,
                    apiName: mg.apiName
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
                    name: mg.name,
                    apiName: mg.apiName
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

            await addDoc(collection(db, 'workoutTemplates'), templateData);

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

                {/* Debug Section - Remove in production */}
                {/* {process.env.NODE_ENV === 'development' && (
                    <StyledCard sx={{ mb: 3, border: '2px dashed #ffc107' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                                🔧 Debug Tools (Development Only)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={checkAvailableTargets}
                                    sx={{ color: '#ffc107', borderColor: '#ffc107' }}
                                >
                                    Check API Target Names
                                </Button>

                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={testAllMuscleGroups}
                                    sx={{ color: '#ff4444', borderColor: '#ff4444' }}
                                >
                                    Test ALL Muscle Groups
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        console.log('🔍 Current workout days:', workoutDays);
                                        workoutDays.forEach(day => {
                                            console.log(`Day ${day.id}:`, day.muscleGroups.map(mg => ({
                                                name: mg.name,
                                                id: mg.id,
                                                hasApiName: !!mg.apiName,
                                                apiName: mg.apiName
                                            })));
                                        });
                                    }}
                                    sx={{ color: '#00e676', borderColor: '#00e676' }}
                                >
                                    Check Muscle Group Integrity
                                </Button>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                                Open browser console (F12) to see detailed test results
                            </Typography>
                        </CardContent>
                    </StyledCard>
                )} */}

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

                <Grid2 container spacing={3}>
                    {Array.isArray(templates) && templates.length > 0 ? (
                        templates.map((template) => (
                            <Grid2 xs={12} md={6} key={template.id}>
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
                            </Grid2>
                        ))
                    ) : (
                        <Grid2 xs={12}>
                            <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                No workout templates found. Create one to get started!
                            </Typography>
                        </Grid2>
                    )}
                </Grid2>

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

                                        <Grid2 container spacing={1}>
                                            {muscleGroups.map((muscleGroup) => (
                                                <Grid2 key={muscleGroup.id}>
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
                                                </Grid2>
                                            ))}
                                        </Grid2>

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

                                        {/* Exercise Selection Section */}
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle2" sx={{ color: '#00ff9f', mb: 2 }}>
                                                Add Exercises:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                                Search the entire exercise database or type a custom exercise name.
                                                {day.muscleGroups.length > 0 && (
                                                    <> Selected muscle groups: {day.muscleGroups.map(mg => mg.name).join(', ')}</>
                                                )}
                                            </Typography>

                                            <ExerciseSelector
                                                onExerciseSelect={(exerciseData) => handleExerciseSelect(day.id, exerciseData)}
                                                placeholder="Search all exercises or type custom name..."
                                                includeHistory={true}
                                                sx={{ mb: 2 }}
                                            />

                                            {day.exercises.length > 0 && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="subtitle2" sx={{ color: '#00ff9f', mb: 1 }}>
                                                        Selected Exercises ({day.exercises.length}):
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {day.exercises.map((exercise) => (
                                                            <Chip
                                                                key={exercise.id}
                                                                label={`${exercise.name} (${exercise.sets}×${exercise.reps})`}
                                                                onDelete={() => handleExerciseToggle(day.id, exercise)}
                                                                sx={{
                                                                    backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                    color: '#00ff9f',
                                                                    '& .MuiChip-deleteIcon': {
                                                                        color: '#00ff9f'
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
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