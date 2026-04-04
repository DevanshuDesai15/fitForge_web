import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    List,
    ListItem,
    CircularProgress,
    Alert
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdFitnessCenter,
    MdPlayArrow,
    MdLibraryBooks,
    MdClose
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import ExerciseSelector from '../common/ExerciseSelector';
import { useWorkoutPrograms } from '../../pages/Workout/hooks/useWorkoutPrograms';
import {
    syncProgramTemplateIds,
    useWorkoutMutations,
} from '../../pages/Workout/hooks/useWorkoutMutations';

const StyledCard = styled(Card)(({ theme }) => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${theme.palette.surface.secondary}`,
        border: `1px solid ${theme.palette.border.primary}`,
    },
}));

const TemplateCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
    background: isSelected
        ? `linear-gradient(135deg, ${theme.palette.surface.tertiary} 0%, ${theme.palette.surface.secondary} 100%)`
        : '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: isSelected
        ? `1px solid ${theme.palette.primary.main}`
        : `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-2px)',
        border: `1px solid ${theme.palette.border.primary}`,
    },
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 12,
    fontWeight: 'bold',
    padding: '10px 24px',
    ...(variant === 'primary' && {
        background: theme.palette.background.gradient.button,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            background: theme.palette.background.gradient.buttonHover,
        },
    }),
}));

const DayCard = styled(Card)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.surface.primary} 0%, ${theme.palette.surface.transparent} 100%)`,
    border: `1px solid ${theme.palette.border.main}`,
    borderRadius: '12px',
    marginBottom: '16px',
    overflow: 'visible', // Allow dropdown to extend outside card
}));

const MuscleGroupChip = styled(Chip)(({ theme, selected }) => ({
    margin: '4px',
    backgroundColor: selected ? theme.palette.primary.main : theme.palette.surface.transparent,
    color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
    borderColor: theme.palette.primary.main,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.light : theme.palette.surface.primary,
    },
}));

export default function WorkoutTemplates() {
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateName, setTemplateName] = useState('');
    const [workoutDays, setWorkoutDays] = useState([
        { id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }
    ]);

    const navigate = useNavigate();
    const theme = useTheme();
    const { programs: templates, loading, loadPrograms } = useWorkoutPrograms();
    const {
        createTemplate,
        updateTemplate,
        deleteTemplate,
        createProgram,
        updateProgram,
        deleteProgram,
    } = useWorkoutMutations();

    // Muscle groups with better organization and colors
    const muscleGroups = [
        { id: 'chest', name: 'Chest', icon: '💪', color: theme.palette.status.error },
        { id: 'back', name: 'Back', icon: '🔙', color: theme.palette.status.info },
        { id: 'shoulders', name: 'Shoulders', icon: '🏔️', color: theme.palette.status.warning },
        { id: 'biceps', name: 'Biceps', icon: '💪', color: theme.palette.actions.library },
        { id: 'triceps', name: 'Triceps', icon: '🔱', color: theme.palette.actions.templates },
        { id: 'legs', name: 'Legs', icon: '🦵', color: theme.palette.actions.quickAdd },
        { id: 'glutes', name: 'Glutes', icon: '🍑', color: theme.palette.actions.progress },
        { id: 'abs', name: 'Abs', icon: '🔥', color: theme.palette.primary.main },
        { id: 'cardio', name: 'Cardio', icon: '❤️', color: theme.palette.status.error },
    ];

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setTemplateName(template.name);
        setWorkoutDays(template.days || [{ id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }]);
        setDialogOpen(true);
    };

    const handleDeleteTemplate = async (template) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await deleteProgram(template.id);
                for (const templateId of template.templateIds || []) {
                    await deleteTemplate(templateId);
                }
                loadPrograms();
            } catch (error) {
                console.error('Error deleting template:', error);
                setError('Failed to delete template');
            }
        }
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
        if (workoutDays.length > 1) {
            setWorkoutDays(prev => prev.filter(day => day.id !== dayId));
        }
    };

    const handleMuscleGroupToggle = (dayId, muscleGroup) => {
        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                const isSelected = day.muscleGroups.some(mg => mg.id === muscleGroup.id);
                const updatedMuscleGroups = isSelected
                    ? day.muscleGroups.filter(mg => mg.id !== muscleGroup.id)
                    : [...day.muscleGroups, muscleGroup];
                return { ...day, muscleGroups: updatedMuscleGroups };
            }
            return day;
        }));
    };



    const removeExercise = (dayId, exerciseIndex) => {
        setWorkoutDays(prev => prev.map(day => {
            if (day.id === dayId) {
                return { ...day, exercises: day.exercises.filter((_, index) => index !== exerciseIndex) };
            }
            return day;
        }));
    };



    const handleSaveTemplate = async () => {
        let syncResult;
        let programSaved = false;
        try {
            if (!templateName.trim()) {
                setError('Template name is required');
                return;
            }

            syncResult = await syncProgramTemplateIds({
                days: workoutDays,
                existingTemplateIds: editingTemplate?.templateIds || [],
                createTemplate,
                updateTemplate,
                deleteTemplate,
                defaults: {
                    isCustom: true,
                },
                removeMissing: Boolean(editingTemplate),
            });

            const programPayload = {
                name: templateName,
                description: '',
                templateIds: syncResult.templateIds,
            };

            if (editingTemplate) {
                await updateProgram(editingTemplate.id, programPayload);
            } else {
                await createProgram(programPayload);
            }
            programSaved = true;

            try {
                await syncResult.commitRemovals();
            } catch (cleanupError) {
                console.error('Error deleting removed workout template days:', cleanupError);
            }

            resetForm();
            loadPrograms();
            setDialogOpen(false);
        } catch (error) {
            if (syncResult && !programSaved) {
                await syncResult.rollback();
            }
            console.error('Error saving template:', error);
            setError('Failed to save template');
        }
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setTemplateName('');
        setWorkoutDays([{ id: 1, name: 'Day 1', muscleGroups: [], exercises: [] }]);
        setError('');
    };

    const getMuscleGroupColor = (muscleGroup) => {
        const knownMuscleGroup = muscleGroups.find(group => group.id === muscleGroup.id);
        return muscleGroup.color || knownMuscleGroup?.color || theme.palette.primary.main;
    };

    const renderTemplateCard = (template) => {
        const days = template.days || [];
        const totalExercises = days.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
        const firstDay = days[0];

        return (
            <TemplateCard key={template.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                            {template.name}
                        </Typography>
                        <Box>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplate(template);
                                }}
                                sx={{ color: theme.palette.status.warning, mr: 1 }}
                            >
                                <MdEdit />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template);
                                }}
                                sx={{ color: theme.palette.status.error }}
                            >
                                <MdDelete />
                            </IconButton>
                        </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        {days.length || 0} days • {totalExercises} total exercises
                    </Typography>

                    {/* Display workout days */}
                    {days.slice(0, 2).map((day) => (
                        <Box key={day.id} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                                {day.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {day.muscleGroups?.slice(0, 4).map((mg) => {
                                    const muscleGroupColor = getMuscleGroupColor(mg);
                                    return (
                                    <Chip
                                        key={mg.id}
                                        label={mg.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${muscleGroupColor}20`,
                                            color: muscleGroupColor,
                                            fontSize: '0.7rem',
                                            height: '20px'
                                        }}
                                    />
                                    );
                                })}
                                {day.muscleGroups?.length > 4 && (
                                    <Chip
                                        label={`+${day.muscleGroups.length - 4}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: theme.palette.surface.secondary,
                                            color: theme.palette.text.secondary,
                                            fontSize: '0.7rem',
                                            height: '20px'
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="caption" sx={{ color: theme.palette.text.muted }}>
                                {day.exercises?.length || 0} exercises
                            </Typography>
                        </Box>
                    ))}

                    {days.length > 2 && (
                        <Typography variant="caption" sx={{ color: theme.palette.text.muted }}>
                            +{days.length - 2} more days
                        </Typography>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <ActionButton
                            variant="primary"
                            size="small"
                            startIcon={<MdPlayArrow />}
                            onClick={() => {
                                if (!firstDay) {
                                    navigate('/workout/start');
                                    return;
                                }

                                navigate('/workout/start', {
                                    state: {
                                        templateId: firstDay.templateId || firstDay.id || template.id,
                                        dayId: firstDay.templateId || firstDay.id || template.id,
                                        workout: {
                                            name: `${template.name} - ${firstDay.name}`,
                                            programName: template.name,
                                            dayName: firstDay.name,
                                            exercises: firstDay.exercises || [],
                                        },
                                    },
                                });
                            }}
                        >
                            Start Workout
                        </ActionButton>
                    </Box>
                </CardContent>
            </TemplateCard>
        );
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
            paddingBottom: '100px',
        }}>
            <div className="max-w-4xl mx-auto">
                {error && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: `${theme.palette.status.error}20`, color: theme.palette.status.error }}>
                        {error}
                    </Alert>
                )}

                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                        Workout Templates
                    </Typography>
                    <ActionButton
                        variant="primary"
                        startIcon={<MdAdd />}
                        onClick={() => setDialogOpen(true)}
                        sx={{
                            background: theme.palette.background.gradient.button,
                            color: theme.palette.primary.contrastText,
                        }}
                    >
                        Create Template
                    </ActionButton>
                </Box>

                {/* Empty State */}
                {!loading && templates.length === 0 && (
                    <StyledCard sx={{ mb: 3, border: `2px dashed ${theme.palette.primary.main}`, opacity: 0.8 }}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2 }}>
                                No workout templates yet!
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                                Create your first template with multiple days and muscle groups
                            </Typography>
                            <ActionButton
                                variant="primary"
                                startIcon={<MdAdd />}
                                onClick={() => setDialogOpen(true)}
                                sx={{
                                    background: theme.palette.background.gradient.button,
                                    color: theme.palette.primary.contrastText,
                                    mr: 2
                                }}
                            >
                                Create Template
                            </ActionButton>
                            <Button
                                variant="outlined"
                                startIcon={<MdFitnessCenter />}
                                onClick={() => navigate('/workout/start')}
                                sx={{ mr: 2, color: theme.palette.status.error, borderColor: theme.palette.status.error }}
                            >
                                Start Custom Workout
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<MdLibraryBooks />}
                                onClick={() => navigate('/workout/library')}
                                sx={{ color: theme.palette.primary.light, borderColor: theme.palette.primary.light }}
                            >
                                Browse Exercises
                            </Button>
                        </CardContent>
                    </StyledCard>
                )}

                {/* Templates List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : (
                    <Box>
                        {templates.map(renderTemplateCard)}
                    </Box>
                )}

                {/* Create/Edit Template Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: {
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{
                        color: theme.palette.primary.main,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {editingTemplate ? 'Edit Template' : 'Create New Template'}
                        <IconButton onClick={() => setDialogOpen(false)} sx={{ color: theme.palette.primary.main }}>
                            <MdClose />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ overflow: 'visible' }}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Template Name"
                            fullWidth
                            variant="outlined"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    color: theme.palette.text.primary,
                                    '& fieldset': { borderColor: theme.palette.border.main },
                                    '&:hover fieldset': { borderColor: theme.palette.border.primary },
                                },
                                '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                            }}
                        />

                        {/* Workout Days */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                Workout Split
                            </Typography>
                            <ActionButton
                                size="small"
                                startIcon={<MdAdd />}
                                onClick={handleAddDay}
                                sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
                                variant="outlined"
                            >
                                Add Day
                            </ActionButton>
                        </Box>

                        {workoutDays.map((day) => (
                            <DayCard key={day.id}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                                            {day.name}
                                        </Typography>
                                        {workoutDays.length > 1 && (
                                            <IconButton
                                                onClick={() => handleRemoveDay(day.id)}
                                                sx={{ color: theme.palette.status.error }}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 1 }}>
                                        Target Muscle Groups:
                                    </Typography>
                                    <Box sx={{ mb: 3 }}>
                                        {muscleGroups.map((muscleGroup) => (
                                            <MuscleGroupChip
                                                key={muscleGroup.id}
                                                label={`${muscleGroup.icon} ${muscleGroup.name}`}
                                                selected={day.muscleGroups.some(mg => mg.id === muscleGroup.id)}
                                                onClick={() => handleMuscleGroupToggle(day.id, muscleGroup)}
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                                        Exercises ({day.exercises.length}):
                                    </Typography>

                                    {/* Inline Exercise Selector */}
                                    <Box sx={{ mb: 2 }}>
                                        <ExerciseSelector
                                            onExerciseSelect={(exercise) => {
                                                console.log('🏋️ Exercise selected:', exercise, 'for day:', day.id);
                                                const newExercise = {
                                                    id: exercise.id || Date.now(),
                                                    name: exercise.name,
                                                    target: exercise.target,
                                                    equipment: exercise.equipment,
                                                    notes: ''
                                                };

                                                setWorkoutDays(prev => prev.map(workoutDay => {
                                                    if (workoutDay.id === day.id) {
                                                        console.log(`📅 Adding exercise to ${workoutDay.name}`);
                                                        return { ...workoutDay, exercises: [...workoutDay.exercises, newExercise] };
                                                    }
                                                    return workoutDay;
                                                }));
                                            }}
                                            placeholder={`Search exercises for ${day.name}...`}
                                            sx={{ width: '100%' }}
                                        />
                                    </Box>

                                    {day.exercises.length > 0 && (
                                        <List>
                                            {day.exercises.map((exercise, exerciseIndex) => (
                                                <ListItem
                                                    key={exerciseIndex}
                                                    sx={{
                                                        bgcolor: theme.palette.surface.transparent,
                                                        borderRadius: 1,
                                                        mb: 1,
                                                        border: `1px solid ${theme.palette.border.main}`
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                                                            {exercise.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                            {exercise.target && `Target: ${exercise.target}`}
                                                            {exercise.equipment && ` • Equipment: ${exercise.equipment}`}
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        onClick={() => removeExercise(day.id, exerciseIndex)}
                                                        sx={{ color: theme.palette.status.error }}
                                                    >
                                                        <MdDelete />
                                                    </IconButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </CardContent>
                            </DayCard>
                        ))}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setDialogOpen(false)} sx={{
                            color: theme.palette.text.secondary, backgroundColor: theme.palette.background.gradient.button, '&:hover': {
                                background: theme.palette.background.gradient.buttonHover,
                                color: theme.palette.primary.contrastText,
                            },
                        }}>
                            Cancel
                        </Button>
                        <ActionButton
                            variant="primary"
                            onClick={handleSaveTemplate}
                            // disabled={!templateName.trim()}
                            sx={{
                                background: theme.palette.background.gradient.button,
                                color: theme.palette.primary.contrastText,
                            }}
                        >
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </ActionButton>
                    </DialogActions>
                </Dialog>


            </div>
        </Box>
    );
}
