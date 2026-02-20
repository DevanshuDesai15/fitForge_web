import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Chip,
    Divider,
    LinearProgress,
    Menu,
} from '@mui/material';
import {
    Target,
    CheckCircle,
    Clock,
    TrendingUp,
    Plus,
    MoreHorizontal,
    Dumbbell,
    Activity,
    Trophy,
    Flame,
    X,
    Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { calculateGoalProgress } from '../utils/progressUtils';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOAL_TYPES = [
    { value: 'personal_record', label: 'Personal Record' },
    { value: 'frequency', label: 'Frequency Goal' },
    { value: 'streak', label: 'Streak Goal' },
    { value: 'duration', label: 'Duration Goal' },
    { value: 'calories', label: 'Calorie Goal' },
    { value: 'custom', label: 'Custom Goal' },
];

const CATEGORIES = [
    { value: 'exercise', label: 'Exercise' },
    { value: 'workout', label: 'Workout' },
    { value: 'health', label: 'Health' },
    { value: 'body', label: 'Body' },
];

const GOAL_TEMPLATES = [
    {
        id: 'weekly_workouts',
        title: 'Weekly Workouts',
        description: 'Complete a certain number of workouts per week',
        category: 'workout',
        type: 'frequency',
        defaultTargetValue: '5',
        defaultUnit: 'workouts',
        isWeightBased: false,
        exerciseName: '',
        badge1: 'Workout',
        badge2: '5 workouts',
        icon: 'activity',
    },
    {
        id: 'bench_press_pr',
        title: 'Bench Press PR',
        description: 'Increase your bench press personal record',
        category: 'exercise',
        type: 'personal_record',
        defaultTargetValue: '200',
        defaultUnit: 'lbs',
        isWeightBased: true,
        exerciseName: 'Bench Press',
        badge1: 'Exercise',
        badge2: '200 lbs',
        icon: 'trophy',
    },
    {
        id: 'workout_streak',
        title: 'Workout Streak',
        description: 'Maintain a consecutive workout streak',
        category: 'workout',
        type: 'streak',
        defaultTargetValue: '30',
        defaultUnit: 'days',
        isWeightBased: false,
        exerciseName: '',
        badge1: 'Workout',
        badge2: '30 days',
        icon: 'flame',
    },
    {
        id: 'squat_pr',
        title: 'Squat PR',
        description: 'Reach a new squat personal record',
        category: 'exercise',
        type: 'personal_record',
        defaultTargetValue: '250',
        defaultUnit: 'lbs',
        isWeightBased: true,
        exerciseName: 'Squat',
        badge1: 'Exercise',
        badge2: '250 lbs',
        icon: 'trophy',
    },
    {
        id: 'deadlift_pr',
        title: 'Deadlift PR',
        description: 'Achieve a new deadlift personal record',
        category: 'exercise',
        type: 'personal_record',
        defaultTargetValue: '300',
        defaultUnit: 'lbs',
        isWeightBased: true,
        exerciseName: 'Deadlift',
        badge1: 'Exercise',
        badge2: '300 lbs',
        icon: 'trophy',
    },
    {
        id: 'monthly_calories',
        title: 'Monthly Calories',
        description: 'Burn a target number of calories this month',
        category: 'health',
        type: 'calories',
        defaultTargetValue: '10000',
        defaultUnit: 'calories',
        isWeightBased: false,
        exerciseName: '',
        badge1: 'Health',
        badge2: '10000 calories',
        icon: 'trending',
    },
    {
        id: 'weekly_exercise_time',
        title: 'Weekly Exercise Time',
        description: 'Achieve a total weekly exercise duration',
        category: 'workout',
        type: 'duration',
        defaultTargetValue: '300',
        defaultUnit: 'minutes',
        isWeightBased: false,
        exerciseName: '',
        badge1: 'Workout',
        badge2: '300 minutes',
        icon: 'clock',
    },
];

// ---------------------------------------------------------------------------
// Shared field styles
// ---------------------------------------------------------------------------

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(221, 237, 0, 0.5)' },
        '&.Mui-focused fieldset': { borderColor: '#dded00' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
};

const selectSx = {
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(221, 237, 0, 0.5)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
};

// ---------------------------------------------------------------------------
// Small reusable sub-components (defined outside to satisfy prop-types lint)
// ---------------------------------------------------------------------------

const FieldLabel = ({ children, required }) => (
    <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
    >
        {children}{required && ' *'}
    </Typography>
);

FieldLabel.propTypes = {
    children: PropTypes.node.isRequired,
    required: PropTypes.bool,
};

FieldLabel.defaultProps = {
    required: false,
};

const CustomizeSection = ({
    heading,
    newGoal,
    setNewGoal,
    availableExercises,
    customExerciseName,
    setCustomExerciseName,
}) => (
    <Box
        sx={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            p: 3,
            mt: 3,
        }}
    >
        {heading && (
            <Typography
                variant="subtitle2"
                sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}
            >
                {heading}
            </Typography>
        )}

        {/* Row 1: Title | Target Value + Unit */}
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                mb: 2,
            }}
        >
            <Box>
                <FieldLabel required>Goal Title</FieldLabel>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="e.g. Bench Press 100kg"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    sx={fieldSx}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                    <FieldLabel required>Target Value</FieldLabel>
                    <TextField
                        size="small"
                        fullWidth
                        type="number"
                        placeholder="100"
                        value={newGoal.targetValue}
                        onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                        sx={fieldSx}
                    />
                </Box>
                <Box sx={{ width: 90 }}>
                    <FieldLabel required>Unit</FieldLabel>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="kg"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                        sx={fieldSx}
                    />
                </Box>
            </Box>
        </Box>

        {/* Row 2: Description */}
        <Box sx={{ mb: 2 }}>
            <FieldLabel>Description</FieldLabel>
            <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="Describe your goal..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                sx={fieldSx}
            />
        </Box>

        {/* Row 3: Exercise dropdown (only for personal_record) */}
        {newGoal.type === 'personal_record' && (
            <Box sx={{ mb: 2 }}>
                <FieldLabel>Exercise</FieldLabel>
                <FormControl fullWidth size="small">
                    <Select
                        displayEmpty
                        value={newGoal.exerciseName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setNewGoal({ ...newGoal, exerciseName: value });
                            if (value === 'custom') setCustomExerciseName('');
                        }}
                        sx={selectSx}
                    >
                        <MenuItem value=""><em>Select an exercise</em></MenuItem>
                        {availableExercises && availableExercises.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <MenuItem value="custom"><em>Custom Exercise Name</em></MenuItem>
                    </Select>
                </FormControl>
                {newGoal.exerciseName === 'custom' && (
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter exercise name"
                        value={customExerciseName}
                        onChange={(e) => {
                            setCustomExerciseName(e.target.value);
                            setNewGoal({ ...newGoal, exerciseName: e.target.value });
                        }}
                        sx={{ mt: 1, ...fieldSx }}
                    />
                )}
            </Box>
        )}

        {/* Row 4: Priority | Deadline */}
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
            }}
        >
            <Box>
                <FieldLabel>Priority</FieldLabel>
                <FormControl fullWidth size="small">
                    <Select
                        value={newGoal.priority}
                        onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                        sx={selectSx}
                    >
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box>
                <FieldLabel>Deadline (Optional)</FieldLabel>
                <TextField
                    size="small"
                    fullWidth
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx}
                />
            </Box>
        </Box>
    </Box>
);

CustomizeSection.propTypes = {
    heading: PropTypes.string,
    newGoal: PropTypes.object.isRequired,
    setNewGoal: PropTypes.func.isRequired,
    availableExercises: PropTypes.arrayOf(PropTypes.string),
    customExerciseName: PropTypes.string.isRequired,
    setCustomExerciseName: PropTypes.func.isRequired,
};

CustomizeSection.defaultProps = {
    heading: '',
    availableExercises: [],
};

// ---------------------------------------------------------------------------
// GoalsSection component
// ---------------------------------------------------------------------------

const GoalsSection = ({
    goals,
    exercises,
    availableExercises,
    weightUnit = 'kg',
    onGoalsUpdate,
    setError,
}) => {
    const [activeFilter, setActiveFilter] = useState('active');
    const [goalDialog, setGoalDialog] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [dialogTab, setDialogTab] = useState('templates'); // 'templates' | 'custom'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newGoal, setNewGoal] = useState({
        title: '',
        category: 'exercise',
        type: 'personal_record',
        targetValue: '',
        unit: weightUnit,
        description: '',
        exerciseName: '',
        priority: 'medium',
        deadline: '',
    });
    const [customExerciseName, setCustomExerciseName] = useState('');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuGoal, setMenuGoal] = useState(null);

    const { currentUser } = useAuth();

    // -----------------------------------------------------------------------
    // Icon helper
    // -----------------------------------------------------------------------

    const getTemplateIcon = (iconName, size = 22) => {
        switch (iconName) {
            case 'activity': return <Activity size={size} />;
            case 'trophy': return <Trophy size={size} />;
            case 'flame': return <Flame size={size} />;
            case 'trending': return <TrendingUp size={size} />;
            case 'clock': return <Clock size={size} />;
            default: return <Dumbbell size={size} />;
        }
    };

    // -----------------------------------------------------------------------
    // Dialog open / close helpers
    // -----------------------------------------------------------------------

    const openNewGoalDialog = () => {
        setNewGoal({
            title: '',
            category: 'exercise',
            type: 'personal_record',
            targetValue: '',
            unit: weightUnit,
            description: '',
            exerciseName: '',
            priority: 'medium',
            deadline: '',
        });
        setSelectedTemplate(null);
        setDialogTab('templates');
        setCustomExerciseName('');
        setGoalDialog(true);
    };

    const closeDialog = () => {
        setGoalDialog(false);
        setEditingGoal(null);
        setSelectedTemplate(null);
        setDialogTab('templates');
        setNewGoal({
            title: '',
            category: 'exercise',
            type: 'personal_record',
            targetValue: '',
            unit: weightUnit,
            description: '',
            exerciseName: '',
            priority: 'medium',
            deadline: '',
        });
        setCustomExerciseName('');
    };

    // -----------------------------------------------------------------------
    // Template selection
    // -----------------------------------------------------------------------

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        const unit = template.isWeightBased ? weightUnit : template.defaultUnit;
        setNewGoal({
            title: template.title,
            category: template.category,
            type: template.type,
            targetValue: template.defaultTargetValue,
            unit,
            description: template.description,
            exerciseName: template.exerciseName,
            priority: 'medium',
            deadline: '',
        });
    };

    // -----------------------------------------------------------------------
    // Save / delete / complete handlers
    // -----------------------------------------------------------------------

    const handleGoalSave = async () => {
        try {
            const payload = {
                title: newGoal.title,
                exerciseName: newGoal.exerciseName || newGoal.title,
                targetValue: newGoal.targetValue,
                unit: newGoal.unit,
                category: newGoal.category,
                type: newGoal.type,
                description: newGoal.description,
                priority: newGoal.priority,
                deadline: newGoal.deadline,
                // backward compatibility fields
                targetWeight: ['lbs', 'kg'].includes(newGoal.unit) ? newGoal.targetValue : '',
                targetReps: '',
                targetSets: '',
            };

            if (editingGoal) {
                await updateDoc(doc(db, 'goals', editingGoal.id), {
                    ...payload,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                await addDoc(collection(db, 'goals'), {
                    ...payload,
                    userId: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    completed: false,
                });
            }
            closeDialog();
            onGoalsUpdate();
        } catch (err) {
            setError('Error saving goal: ' + err.message);
        }
    };

    const handleGoalDelete = async (goalId) => {
        try {
            await deleteDoc(doc(db, 'goals', goalId));
            setMenuAnchor(null);
            setMenuGoal(null);
            onGoalsUpdate();
        } catch (err) {
            setError('Error deleting goal: ' + err.message);
        }
    };

    const handleMarkComplete = async (goal) => {
        try {
            await updateDoc(doc(db, 'goals', goal.id), {
                completed: true,
                updatedAt: new Date().toISOString(),
            });
            setMenuAnchor(null);
            setMenuGoal(null);
            onGoalsUpdate();
        } catch (err) {
            setError('Error updating goal: ' + err.message);
        }
    };

    // -----------------------------------------------------------------------
    // Derived data
    // -----------------------------------------------------------------------

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);
    const goalsWithDeadlines = goals.filter(g => g.deadline);
    const almostDone = activeGoals.filter(g => {
        const p = calculateGoalProgress(g, exercises);
        return p >= 70 && p < 100;
    });
    const completedPct = goals.length > 0
        ? Math.round((completedGoals.length / goals.length) * 100)
        : 0;

    const filteredGoals = activeFilter === 'active' ? activeGoals : completedGoals;

    const isOverdue = (goal) => {
        if (!goal.deadline || goal.completed) return false;
        return new Date(goal.deadline) < new Date();
    };

    const getGoalDescription = (goal) => {
        if (goal.description) return goal.description;
        const parts = [];
        if (goal.targetValue) parts.push(`${goal.targetValue} ${goal.unit || ''} target`.trim());
        else if (goal.targetWeight) parts.push(`${goal.targetWeight}${weightUnit} target weight`);
        if (goal.targetReps) parts.push(`${goal.targetReps} reps`);
        if (goal.targetSets) parts.push(`${goal.targetSets} sets`);
        if (goal.deadline) parts.push(`by ${format(new Date(goal.deadline), 'MMM d, yyyy')}`);
        return parts.length > 0 ? parts.join(' · ') : 'No specific target set';
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'high': return { bg: 'rgba(244, 67, 54, 0.15)', text: '#f44336' };
            case 'low': return { bg: 'rgba(76, 175, 80, 0.15)', text: '#4caf50' };
            default: return { bg: 'rgba(255, 193, 7, 0.15)', text: '#ffc107' };
        }
    };

    const statCards = [
        {
            label: 'Active Goals',
            value: activeGoals.length,
            icon: <Target size={18} />,
            iconColor: '#dded00',
            bgColor: 'rgba(221, 237, 0, 0.1)',
        },
        {
            label: 'Completed',
            value: `${completedPct}%`,
            icon: <CheckCircle size={18} />,
            iconColor: '#4caf50',
            bgColor: 'rgba(76, 175, 80, 0.1)',
        },
        {
            label: 'With Deadlines',
            value: goalsWithDeadlines.length,
            icon: <Clock size={18} />,
            iconColor: '#2196f3',
            bgColor: 'rgba(33, 150, 243, 0.1)',
        },
        {
            label: 'Almost Done',
            value: almostDone.length,
            icon: <TrendingUp size={18} />,
            iconColor: '#ff9800',
            bgColor: 'rgba(255, 152, 0, 0.1)',
        },
    ];

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <Box>
            {/* Summary Stat Cards */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 3,
                }}
            >
                {statCards.map((card) => (
                    <Box
                        key={card.label}
                        sx={{
                            background: 'rgba(40, 40, 40, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', lineHeight: 1.3 }}
                            >
                                {card.label}
                            </Typography>
                            <Box
                                sx={{
                                    background: card.bgColor,
                                    p: '6px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    color: card.iconColor,
                                }}
                            >
                                {card.icon}
                            </Box>
                        </Box>
                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', lineHeight: 1 }}>
                            {card.value}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Filter Tabs + New Goal Button */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        background: '#1e1e1e',
                        borderRadius: '50px',
                        p: '4px',
                        gap: '4px',
                    }}
                >
                    {[
                        { key: 'active', label: `Active Goals (${activeGoals.length})` },
                        { key: 'completed', label: `Completed (${completedGoals.length})` },
                    ].map(tab => (
                        <Box
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            sx={{
                                px: 2,
                                py: '6px',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                background: activeFilter === tab.key ? '#2e2e2e' : 'transparent',
                                color: activeFilter === tab.key ? '#fff' : 'rgba(255,255,255,0.45)',
                                fontSize: '0.82rem',
                                fontWeight: activeFilter === tab.key ? 600 : 400,
                                transition: 'all 0.2s',
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tab.label}
                        </Box>
                    ))}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={openNewGoalDialog}
                    sx={{
                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                        color: '#000',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        px: 2.5,
                        py: 0.8,
                        fontSize: '0.82rem',
                        '&:hover': { background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)' },
                    }}
                >
                    New Goal
                </Button>
            </Box>

            {/* Goal Cards Grid */}
            {filteredGoals.length > 0 ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                        gap: 2,
                    }}
                >
                    {filteredGoals.map((goal) => {
                        const progress = calculateGoalProgress(goal, exercises);
                        const overdue = isOverdue(goal);
                        const priorityStyle = getPriorityStyle(goal.priority);
                        const clampedProgress = Math.min(progress, 100);
                        const goalTitle = goal.title || goal.exerciseName || 'Unnamed Goal';
                        const categoryLabel = goal.category
                            ? goal.category.charAt(0).toUpperCase() + goal.category.slice(1)
                            : 'Exercise';

                        return (
                            <Box
                                key={goal.id}
                                sx={{
                                    background: 'rgba(40, 40, 40, 0.8)',
                                    border: `1px solid ${overdue ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    borderRadius: '12px',
                                    p: 2.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    transition: 'border-color 0.2s',
                                    '&:hover': {
                                        borderColor: overdue
                                            ? 'rgba(244, 67, 54, 0.5)'
                                            : 'rgba(221, 237, 0, 0.25)',
                                    },
                                }}
                            >
                                {/* Top: icon + title + menu */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                background: 'rgba(100, 110, 20, 0.35)',
                                                borderRadius: '10px',
                                                p: '8px',
                                                display: 'flex',
                                                color: '#dded00',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Dumbbell size={18} />
                                        </Box>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '0.93rem',
                                                lineHeight: 1.3,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {goalTitle}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            setMenuAnchor(e.currentTarget);
                                            setMenuGoal(goal);
                                        }}
                                        sx={{
                                            color: 'rgba(255,255,255,0.35)',
                                            p: '4px',
                                            flexShrink: 0,
                                            '&:hover': { color: '#fff' },
                                        }}
                                    >
                                        <MoreHorizontal size={16} />
                                    </IconButton>
                                </Box>

                                {/* Description */}
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', lineHeight: 1.5 }}
                                >
                                    {getGoalDescription(goal)}
                                </Typography>

                                {/* Category + Exercise chips */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={categoryLabel}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                            color: '#ffc107',
                                            fontSize: '0.7rem',
                                            height: '22px',
                                            border: '1px solid rgba(255, 193, 7, 0.2)',
                                        }}
                                    />
                                    {goal.exerciseName && (
                                        <Chip
                                            label={`Exercise: ${goal.exerciseName}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                                color: '#2196f3',
                                                fontSize: '0.7rem',
                                                height: '22px',
                                                border: '1px solid rgba(33, 150, 243, 0.2)',
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Progress */}
                                <Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 0.75,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem' }}
                                        >
                                            Progress
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}
                                        >
                                            {(goal.targetValue || goal.targetWeight)
                                                ? `${clampedProgress.toFixed(0)}% / ${goal.targetValue || goal.targetWeight}${goal.unit || weightUnit}`
                                                : `${clampedProgress.toFixed(0)}%`}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={clampedProgress}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            '& .MuiLinearProgress-bar': {
                                                background: clampedProgress >= 100
                                                    ? '#4caf50'
                                                    : 'linear-gradient(90deg, #dded00, #e8f15d)',
                                                borderRadius: 3,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'rgba(255,255,255,0.35)',
                                            fontSize: '0.7rem',
                                            mt: 0.5,
                                            display: 'block',
                                        }}
                                    >
                                        {clampedProgress.toFixed(1)}% complete
                                    </Typography>
                                </Box>

                                {/* Bottom: priority + category + status */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        flexWrap: 'wrap',
                                        mt: 'auto',
                                    }}
                                >
                                    <Chip
                                        label={
                                            (goal.priority || 'Medium').charAt(0).toUpperCase() +
                                            (goal.priority || 'medium').slice(1)
                                        }
                                        size="small"
                                        sx={{
                                            backgroundColor: priorityStyle.bg,
                                            color: priorityStyle.text,
                                            fontSize: '0.68rem',
                                            height: '20px',
                                            fontWeight: 600,
                                        }}
                                    />
                                    <Chip
                                        icon={<Activity size={10} style={{ marginLeft: '6px' }} />}
                                        label={categoryLabel}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                            color: '#2196f3',
                                            fontSize: '0.68rem',
                                            height: '20px',
                                            '& .MuiChip-icon': { color: '#2196f3' },
                                        }}
                                    />
                                    {overdue && (
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#f44336', fontSize: '0.7rem', fontWeight: 600, ml: 'auto' }}
                                        >
                                            Overdue
                                        </Typography>
                                    )}
                                    {goal.completed && !overdue && (
                                        <Typography
                                            variant="caption"
                                            sx={{ color: '#4caf50', fontSize: '0.7rem', fontWeight: 600, ml: 'auto' }}
                                        >
                                            Completed
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ color: 'rgba(255,255,255,0.15)', mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <Target size={48} />
                    </Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', mb: 2 }}>
                        {activeFilter === 'active'
                            ? 'No active goals. Start by adding your first goal!'
                            : 'No completed goals yet.'}
                    </Typography>
                    {activeFilter === 'active' && (
                        <Button
                            variant="outlined"
                            startIcon={<Plus size={16} />}
                            onClick={openNewGoalDialog}
                            sx={{
                                borderColor: '#dded00',
                                color: '#dded00',
                                '&:hover': {
                                    borderColor: '#e8f15d',
                                    backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                },
                            }}
                        >
                            Add Your First Goal
                        </Button>
                    )}
                </Box>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => { setMenuAnchor(null); setMenuGoal(null); }}
                slotProps={{
                    paper: {
                        sx: {
                            background: '#2a2a2a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            minWidth: 150,
                        },
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        const goal = menuGoal;
                        setEditingGoal(goal);
                        setDialogTab('custom');
                        setNewGoal({
                            title: goal.title || goal.exerciseName || '',
                            category: goal.category || 'exercise',
                            type: goal.type || 'personal_record',
                            targetValue: goal.targetValue || goal.targetWeight || '',
                            unit: goal.unit || (goal.targetWeight ? weightUnit : 'reps'),
                            description: goal.description || '',
                            exerciseName: goal.exerciseName || '',
                            priority: goal.priority || 'medium',
                            deadline: goal.deadline || '',
                        });
                        setGoalDialog(true);
                        setMenuAnchor(null);
                    }}
                    sx={{ color: '#dded00', fontSize: '0.85rem' }}
                >
                    Edit
                </MenuItem>
                {!menuGoal?.completed && (
                    <MenuItem
                        onClick={() => handleMarkComplete(menuGoal)}
                        sx={{ color: '#4caf50', fontSize: '0.85rem' }}
                    >
                        Mark as Complete
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => handleGoalDelete(menuGoal?.id)}
                    sx={{ color: '#f44336', fontSize: '0.85rem' }}
                >
                    Delete
                </MenuItem>
            </Menu>

            {/* ----------------------------------------------------------------
                Goal Dialog
            ---------------------------------------------------------------- */}
            <Dialog
                open={goalDialog}
                onClose={closeDialog}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            background: '#1e1e1e',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            maxHeight: '90vh',
                        },
                    },
                }}
            >
                {/* Dialog Header */}
                <DialogTitle
                    sx={{
                        pb: 1,
                        pr: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#dded00', fontWeight: 700 }}>
                        {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
                        Set a new fitness goal to track your progress and stay motivated
                    </Typography>
                    <IconButton
                        onClick={closeDialog}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            color: 'rgba(255,255,255,0.4)',
                            '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.08)' },
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </DialogTitle>

                {/* Tabs (only when creating) */}
                {!editingGoal && (
                    <Box
                        sx={{
                            display: 'flex',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            px: 3,
                        }}
                    >
                        {[
                            { key: 'templates', label: 'Goal Templates' },
                            { key: 'custom', label: 'Custom Goal' },
                        ].map((tab) => (
                            <Box
                                key={tab.key}
                                onClick={() => setDialogTab(tab.key)}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: dialogTab === tab.key ? 600 : 400,
                                    color: dialogTab === tab.key ? '#dded00' : 'rgba(255,255,255,0.45)',
                                    borderBottom: dialogTab === tab.key
                                        ? '2px solid #dded00'
                                        : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    userSelect: 'none',
                                    mb: '-1px',
                                }}
                            >
                                {tab.label}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Dialog Content */}
                <DialogContent sx={{ pt: 2.5 }}>

                    {/* ---- Templates Tab ---- */}
                    {(!editingGoal && dialogTab === 'templates') && (
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontWeight: 600 }}
                            >
                                Choose a Goal Template
                            </Typography>

                            {/* 2-column template grid */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 1.5,
                                }}
                            >
                                {GOAL_TEMPLATES.map((template) => {
                                    const isSelected = selectedTemplate?.id === template.id;
                                    return (
                                        <Box
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            sx={{
                                                background: isSelected
                                                    ? 'rgba(221, 237, 0, 0.08)'
                                                    : 'rgba(255,255,255,0.03)',
                                                border: isSelected
                                                    ? '1px solid rgba(221, 237, 0, 0.5)'
                                                    : '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '10px',
                                                p: 2,
                                                cursor: 'pointer',
                                                transition: 'all 0.18s',
                                                '&:hover': {
                                                    border: '1px solid rgba(221, 237, 0, 0.3)',
                                                    background: 'rgba(221, 237, 0, 0.05)',
                                                },
                                            }}
                                        >
                                            {/* Icon */}
                                            <Box
                                                sx={{
                                                    background: 'rgba(100, 110, 20, 0.4)',
                                                    color: '#dded00',
                                                    borderRadius: '8px',
                                                    p: '8px',
                                                    display: 'inline-flex',
                                                    mb: 1.5,
                                                }}
                                            >
                                                {getTemplateIcon(template.icon)}
                                            </Box>

                                            {/* Title */}
                                            <Typography
                                                variant="body2"
                                                sx={{ color: '#fff', fontWeight: 700, mb: 0.5, fontSize: '0.85rem' }}
                                            >
                                                {template.title}
                                            </Typography>

                                            {/* Description */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.45)',
                                                    fontSize: '0.75rem',
                                                    lineHeight: 1.4,
                                                    display: 'block',
                                                    mb: 1.5,
                                                }}
                                            >
                                                {template.description}
                                            </Typography>

                                            {/* Chips */}
                                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={template.badge1}
                                                    size="small"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.68rem',
                                                        backgroundColor: 'rgba(221,237,0,0.1)',
                                                        color: '#dded00',
                                                        border: '1px solid rgba(221,237,0,0.2)',
                                                    }}
                                                />
                                                <Chip
                                                    label={template.badge2}
                                                    size="small"
                                                    sx={{
                                                        height: '20px',
                                                        fontSize: '0.68rem',
                                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                                        color: 'rgba(255,255,255,0.6)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* Customize section (appears after template selection) */}
                            {selectedTemplate && (
                                <CustomizeSection
                                    heading="Customize Your Goal"
                                    newGoal={newGoal}
                                    setNewGoal={setNewGoal}
                                    availableExercises={availableExercises}
                                    customExerciseName={customExerciseName}
                                    setCustomExerciseName={setCustomExerciseName}
                                />
                            )}
                        </Box>
                    )}

                    {/* ---- Custom Goal Tab (and Edit mode) ---- */}
                    {(editingGoal || dialogTab === 'custom') && (
                        <Box
                            sx={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                p: 3,
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{ color: '#fff', fontWeight: 700, mb: 2.5 }}
                            >
                                {editingGoal ? 'Edit Goal' : 'Create Custom Goal'}
                            </Typography>

                            {/* Row 1: Title | Category */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Goal Title *
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="e.g. Bench Press 100kg"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                        sx={fieldSx}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Category
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={newGoal.category}
                                            onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                                            sx={selectSx}
                                        >
                                            {CATEGORIES.map(c => (
                                                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            {/* Row 2: Description */}
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                >
                                    Description
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    placeholder="Describe your goal..."
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    sx={fieldSx}
                                />
                            </Box>

                            {/* Row 3: Goal Type */}
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                >
                                    Goal Type
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={newGoal.type}
                                        onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                                        sx={selectSx}
                                    >
                                        {GOAL_TYPES.map(t => (
                                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Row 4: Target Value | Unit | Priority */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr',
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Target Value *
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        type="number"
                                        placeholder="100"
                                        value={newGoal.targetValue}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                                        sx={fieldSx}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Unit *
                                    </Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="kg"
                                        value={newGoal.unit}
                                        onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                                        sx={fieldSx}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Priority
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={newGoal.priority}
                                            onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                                            sx={selectSx}
                                        >
                                            <MenuItem value="high">High</MenuItem>
                                            <MenuItem value="medium">Medium</MenuItem>
                                            <MenuItem value="low">Low</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            {/* Row 5: Exercise dropdown (personal_record only) */}
                            {newGoal.type === 'personal_record' && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                    >
                                        Exercise (for PR goals)
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            displayEmpty
                                            value={newGoal.exerciseName}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setNewGoal({ ...newGoal, exerciseName: value });
                                                if (value === 'custom') setCustomExerciseName('');
                                            }}
                                            sx={selectSx}
                                        >
                                            <MenuItem value=""><em>Select an exercise</em></MenuItem>
                                            {availableExercises && availableExercises.map(name => (
                                                <MenuItem key={name} value={name}>{name}</MenuItem>
                                            ))}
                                            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            <MenuItem value="custom"><em>Custom Exercise Name</em></MenuItem>
                                        </Select>
                                    </FormControl>
                                    {newGoal.exerciseName === 'custom' && (
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Enter exercise name"
                                            value={customExerciseName}
                                            onChange={(e) => {
                                                setCustomExerciseName(e.target.value);
                                                setNewGoal({ ...newGoal, exerciseName: e.target.value });
                                            }}
                                            sx={{ mt: 1, ...fieldSx }}
                                        />
                                    )}
                                </Box>
                            )}

                            {/* Row 6: Deadline */}
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5, display: 'block' }}
                                >
                                    Deadline (Optional)
                                </Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    sx={fieldSx}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                {/* Dialog Actions */}
                <DialogActions
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Left: required fields note */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Info size={14} color="rgba(255,255,255,0.3)" />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>
                            Fields marked with * are required
                        </Typography>
                    </Box>

                    {/* Right: Cancel + Save */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            onClick={closeDialog}
                            size="small"
                            sx={{
                                color: 'rgba(255,255,255,0.5)',
                                '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.06)' },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGoalSave}
                            variant="contained"
                            size="small"
                            disabled={
                                !newGoal.title ||
                                (!editingGoal && dialogTab === 'templates' && !selectedTemplate)
                            }
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                fontWeight: 700,
                                borderRadius: '8px',
                                px: 2.5,
                                '&:hover': { background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)' },
                                '&.Mui-disabled': { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' },
                            }}
                        >
                            {editingGoal ? 'Update Goal' : 'Create Goal'}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

GoalsSection.propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object).isRequired,
    exercises: PropTypes.arrayOf(PropTypes.object).isRequired,
    availableExercises: PropTypes.arrayOf(PropTypes.string).isRequired,
    weightUnit: PropTypes.string,
    onGoalsUpdate: PropTypes.func.isRequired,
    setError: PropTypes.func.isRequired,
};

GoalsSection.defaultProps = {
    weightUnit: 'kg',
};

export default GoalsSection;
