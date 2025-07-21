import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Tab,
    Tabs,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    LinearProgress,
    Divider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdShowChart,
    MdEmojiEvents,
    MdTrackChanges,
    MdAdd,
    MdEdit,
    MdDelete,
    MdTrendingUp,
    MdTrendingDown,
    MdTrendingFlat,
    MdClose,
    MdSave,
    MdFitnessCenter
} from 'react-icons/md';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { getWeightUnit, getWeightLabel } from '../utils/weightUnit';
import { format, subDays, subWeeks, subMonths, isWithinInterval } from 'date-fns';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StatCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(0, 255, 159, 0.1) 0%, rgba(0, 229, 118, 0.1) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 255, 159, 0.2)',
    padding: '1rem',
}));

const ProgressChart = styled(Box)(({ progress }) => ({
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${Math.min(progress, 100)}%`,
        background: progress >= 100 ?
            'linear-gradient(90deg, #00ff9f, #00e676)' :
            'linear-gradient(90deg, #ff9800, #ffc107)',
        transition: 'width 0.3s ease',
    }
}));

export default function Progress() {
    const [activeTab, setActiveTab] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnitState] = useState('kg');

    // Weight Progress states
    const [selectedExercise, setSelectedExercise] = useState('');
    const [timeRange, setTimeRange] = useState('3months');
    const [progressData, setProgressData] = useState([]);

    // Personal Records states
    const [personalRecords, setPersonalRecords] = useState([]);
    const [showOnlyRecent, setShowOnlyRecent] = useState(false);

    // Goals states
    const [goalDialog, setGoalDialog] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        exerciseName: '',
        targetWeight: '',
        targetReps: '',
        targetSets: '',
        deadline: ''
    });
    const [availableExercises, setAvailableExercises] = useState([]);
    const [customExerciseName, setCustomExerciseName] = useState('');

    const { currentUser } = useAuth();

    useEffect(() => {
        loadData();
    }, [activeTab, currentUser]);

    useEffect(() => {
        // Load weight unit preference
        setWeightUnitState(getWeightUnit());

        // Listen for weight unit changes (for multi-tab sync)
        const handleStorageChange = (e) => {
            if (e.key === 'weightUnit') {
                setWeightUnitState(e.newValue || 'kg');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            // Load exercises
            const exercisesQuery = query(
                collection(db, 'exercises'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc')
            );
            const exerciseDocs = await getDocs(exercisesQuery);
            const exerciseData = exerciseDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExercises(exerciseData);

            // Extract unique exercise names for goal setting
            const uniqueExercises = [...new Set(exerciseData.map(ex => ex.exerciseName))].sort();
            setAvailableExercises(uniqueExercises);

            if (activeTab === 0) {
                processWeightProgress(exerciseData);
            } else if (activeTab === 1) {
                processPersonalRecords(exerciseData);
            } else if (activeTab === 2) {
                await loadGoals();
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error loading progress data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const processWeightProgress = (exerciseData) => {
        // Group exercises by name and sort by date
        const exerciseGroups = exerciseData.reduce((groups, exercise) => {
            const name = exercise.exerciseName;
            if (!groups[name]) groups[name] = [];
            groups[name].push({
                ...exercise,
                date: new Date(exercise.timestamp),
                weight: parseFloat(exercise.weight) || 0
            });
            return groups;
        }, {});

        // Sort each group by date (oldest first)
        Object.keys(exerciseGroups).forEach(name => {
            exerciseGroups[name].sort((a, b) => a.date.getTime() - b.date.getTime());

            // Debug logging for merged exercises
            if (import.meta.env.DEV && name === selectedExercise) {
                console.log(`📊 ${name} progress data:`, exerciseGroups[name].map(item => ({
                    date: item.date.toISOString(),
                    weight: item.weight,
                    timestamp: item.timestamp
                })));
            }
        });

        setProgressData(exerciseGroups);

        // Set default selected exercise
        if (!selectedExercise && Object.keys(exerciseGroups).length > 0) {
            setSelectedExercise(Object.keys(exerciseGroups)[0]);
        }
    };

    const processPersonalRecords = (exerciseData) => {
        const records = exerciseData.reduce((acc, exercise) => {
            const name = exercise.exerciseName;
            const weight = parseFloat(exercise.weight) || 0;

            if (!acc[name] || weight > acc[name].weight) {
                acc[name] = {
                    exerciseName: name,
                    weight: weight,
                    reps: exercise.reps,
                    sets: exercise.sets,
                    date: new Date(exercise.timestamp),
                    timestamp: exercise.timestamp
                };
            }
            return acc;
        }, {});

        const recordsArray = Object.values(records).sort((a, b) => b.weight - a.weight);
        setPersonalRecords(recordsArray);
    };

    const loadGoals = async () => {
        try {
            const goalsQuery = query(
                collection(db, 'goals'),
                where('userId', '==', currentUser.uid)
            );
            const goalDocs = await getDocs(goalsQuery);
            const goalData = goalDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort in JavaScript instead of Firestore query
            goalData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setGoals(goalData);
        } catch (err) {
            console.error('Error loading goals:', err);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getTimeRangeData = (data) => {
        if (!data || data.length === 0) return [];

        const now = new Date();
        let startDate;

        switch (timeRange) {
            case '1week':
                startDate = subWeeks(now, 1);
                break;
            case '1month':
                startDate = subMonths(now, 1);
                break;
            case '3months':
                startDate = subMonths(now, 3);
                break;
            case '6months':
                startDate = subMonths(now, 6);
                break;
            case '1year':
                startDate = subMonths(now, 12);
                break;
            default:
                return data;
        }

        return data.filter(item =>
            isWithinInterval(item.date, { start: startDate, end: now })
        );
    };

    const getTrendIcon = (data) => {
        if (data.length < 2) return <MdTrendingFlat style={{ color: '#ffc107' }} />;

        const recent = data.slice(-3);
        const avgRecent = recent.reduce((sum, item) => sum + item.weight, 0) / recent.length;
        const older = data.slice(-6, -3);

        if (older.length === 0) return <MdTrendingFlat style={{ color: '#ffc107' }} />;

        const avgOlder = older.reduce((sum, item) => sum + item.weight, 0) / older.length;

        if (avgRecent > avgOlder) return <MdTrendingUp style={{ color: '#00ff9f' }} />;
        if (avgRecent < avgOlder) return <MdTrendingDown style={{ color: '#ff4444' }} />;
        return <MdTrendingFlat style={{ color: '#ffc107' }} />;
    };

    const handleGoalSave = async () => {
        try {
            if (editingGoal) {
                await updateDoc(doc(db, 'goals', editingGoal.id), {
                    ...newGoal,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await addDoc(collection(db, 'goals'), {
                    ...newGoal,
                    userId: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    completed: false
                });
            }

            setGoalDialog(false);
            setEditingGoal(null);
            setNewGoal({
                exerciseName: '',
                targetWeight: '',
                targetReps: '',
                targetSets: '',
                deadline: ''
            });

            await loadGoals();
        } catch (err) {
            setError('Error saving goal: ' + err.message);
        }
    };

    const handleGoalDelete = async (goalId) => {
        try {
            await deleteDoc(doc(db, 'goals', goalId));
            await loadGoals();
        } catch (err) {
            setError('Error deleting goal: ' + err.message);
        }
    };

    const calculateGoalProgress = (goal) => {
        const exerciseRecords = exercises.filter(ex => ex.exerciseName === goal.exerciseName);
        if (exerciseRecords.length === 0) return 0;

        const latestRecord = exerciseRecords.reduce((latest, current) =>
            new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
        );

        const weightProgress = goal.targetWeight ?
            (parseFloat(latestRecord.weight) / parseFloat(goal.targetWeight)) * 100 : 100;
        const repsProgress = goal.targetReps ?
            (parseFloat(latestRecord.reps) / parseFloat(goal.targetReps)) * 100 : 100;
        const setsProgress = goal.targetSets ?
            (parseFloat(latestRecord.sets) / parseFloat(goal.targetSets)) * 100 : 100;

        return Math.min((weightProgress + repsProgress + setsProgress) / 3, 100);
    };

    const renderWeightProgress = () => {
        const exerciseNames = Object.keys(progressData);
        const currentExerciseData = selectedExercise ? progressData[selectedExercise] || [] : [];
        const filteredData = getTimeRangeData(currentExerciseData);

        return (
            <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Select Exercise
                            </InputLabel>
                            <Select
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                sx={{
                                    color: '#fff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                {exerciseNames.map(name => (
                                    <MenuItem key={name} value={name}>{name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Time Range
                            </InputLabel>
                            <Select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                sx={{
                                    color: '#fff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <MenuItem value="1week">Last Week</MenuItem>
                                <MenuItem value="1month">Last Month</MenuItem>
                                <MenuItem value="3months">Last 3 Months</MenuItem>
                                <MenuItem value="6months">Last 6 Months</MenuItem>
                                <MenuItem value="1year">Last Year</MenuItem>
                                <MenuItem value="all">All Time</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {selectedExercise && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getTrendIcon(filteredData)}
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {filteredData.length > 0 ? `${filteredData[filteredData.length - 1].weight}${weightUnit}` : 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Latest Weight
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdShowChart style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {filteredData.length > 0 ? Math.max(...filteredData.map(d => d.weight)) : 0}{weightUnit}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Period Max
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdFitnessCenter style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {filteredData.length}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Sessions
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: '#00ff9f' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {(() => {
                                                if (filteredData.length < 2) return '0%';

                                                const firstWeight = filteredData[0].weight;
                                                const latestWeight = filteredData[filteredData.length - 1].weight;

                                                // Debug logging
                                                if (import.meta.env.DEV) {
                                                    console.log(`📈 Progress calculation for ${selectedExercise}:`, {
                                                        firstWeight,
                                                        latestWeight,
                                                        firstDate: filteredData[0].date,
                                                        latestDate: filteredData[filteredData.length - 1].date,
                                                        totalEntries: filteredData.length
                                                    });
                                                }

                                                if (firstWeight === 0) return '0%';

                                                const progressPercent = ((latestWeight - firstWeight) / firstWeight * 100);
                                                return `${progressPercent >= 0 ? '+' : ''}${progressPercent.toFixed(1)}%`;
                                            })()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Progress
                                        </Typography>
                                    </Box>
                                </Box>
                            </StatCard>
                        </Grid>
                    </Grid>
                )}

                {/* Simple Progress Timeline */}
                {filteredData.length > 0 && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                Weight Progress Timeline
                            </Typography>
                            <List>
                                {filteredData.slice(-10).reverse().map((entry, index) => (
                                    <ListItem key={index} sx={{ py: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography sx={{ color: '#fff' }}>
                                                        {entry.weight}{weightUnit} × {entry.reps} reps × {entry.sets} sets
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {format(entry.date, 'MMM dd, yyyy')}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </StyledCard>
                )}
            </Box>
        );
    };

    const renderPersonalRecords = () => {
        const filteredRecords = showOnlyRecent ?
            personalRecords.filter(record =>
                isWithinInterval(record.date, {
                    start: subMonths(new Date(), 3),
                    end: new Date()
                })
            ) : personalRecords;

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                        Personal Records ({filteredRecords.length})
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showOnlyRecent}
                                onChange={(e) => setShowOnlyRecent(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#00ff9f',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#00ff9f',
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography sx={{ color: 'text.secondary' }}>
                                Recent only (3 months)
                            </Typography>
                        }
                    />
                </Box>

                <Grid container spacing={2}>
                    {filteredRecords.map((record, index) => (
                        <Grid item xs={12} sm={6} md={4} key={record.exerciseName}>
                            <StyledCard>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <MdEmojiEvents style={{ color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00ff9f' }} />
                                        <Typography variant="h6" sx={{ color: '#fff' }}>
                                            {record.exerciseName}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{ color: '#00ff9f', mb: 1 }}>
                                        {record.weight}{weightUnit}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                        {record.reps} reps × {record.sets} sets
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {format(record.date, 'MMM dd, yyyy')}
                                    </Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>

                {filteredRecords.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: 'text.secondary' }}>
                            No personal records found for the selected time period.
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    const renderGoals = () => {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                        Fitness Goals ({goals.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => {
                            setGoalDialog(true);
                            setCustomExerciseName('');
                        }}
                        sx={{
                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            color: '#000',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                            },
                        }}
                    >
                        Add Goal
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    {goals.map((goal) => {
                        const progress = calculateGoalProgress(goal);
                        const isCompleted = progress >= 100;

                        return (
                            <Grid item xs={12} md={6} key={goal.id}>
                                <StyledCard>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#fff' }}>
                                                {goal.exerciseName}
                                            </Typography>
                                            <Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingGoal(goal);
                                                        setNewGoal(goal);
                                                        setGoalDialog(true);
                                                    }}
                                                    sx={{ color: '#00ff9f', mr: 1 }}
                                                >
                                                    <MdEdit />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleGoalDelete(goal.id)}
                                                    sx={{ color: '#ff4444' }}
                                                >
                                                    <MdDelete />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            {goal.targetWeight && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Target Weight: {goal.targetWeight}{weightUnit}
                                                </Typography>
                                            )}
                                            {goal.targetReps && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Target Reps: {goal.targetReps}
                                                </Typography>
                                            )}
                                            {goal.targetSets && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Target Sets: {goal.targetSets}
                                                </Typography>
                                            )}
                                            {goal.deadline && (
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Progress
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: isCompleted ? '#00ff9f' : '#fff' }}>
                                                    {progress.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <ProgressChart progress={progress} />
                                        </Box>

                                        {isCompleted && (
                                            <Chip
                                                label="Goal Achieved!"
                                                sx={{
                                                    backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                    color: '#00ff9f',
                                                    mt: 1
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        );
                    })}
                </Grid>

                {goals.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                            No goals set yet. Start by adding your first fitness goal!
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<MdAdd />}
                            onClick={() => setGoalDialog(true)}
                            sx={{
                                borderColor: '#00ff9f',
                                color: '#00ff9f',
                                '&:hover': {
                                    borderColor: '#00e676',
                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                },
                            }}
                        >
                            Add Your First Goal
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: '#00ff9f',
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Progress Tracking
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff4444' }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#00ff9f !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#00ff9f' },
                        }}
                    >
                        <Tab icon={<MdShowChart />} label="Weight Progress" />
                        <Tab icon={<MdEmojiEvents />} label="Personal Records" />
                        <Tab icon={<MdTrackChanges />} label="Goals" />
                    </Tabs>
                </StyledCard>

                <StyledCard>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress sx={{ color: '#00ff9f' }} />
                            </Box>
                        ) : (
                            <>
                                {activeTab === 0 && renderWeightProgress()}
                                {activeTab === 1 && renderPersonalRecords()}
                                {activeTab === 2 && renderGoals()}
                            </>
                        )}
                    </CardContent>
                </StyledCard>

                {/* Goal Dialog */}
                <Dialog
                    open={goalDialog}
                    onClose={() => {
                        setGoalDialog(false);
                        setEditingGoal(null);
                        setNewGoal({
                            exerciseName: '',
                            targetWeight: '',
                            targetReps: '',
                            targetSets: '',
                            deadline: ''
                        });
                        setCustomExerciseName('');
                    }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 255, 159, 0.2)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>
                        {editingGoal ? 'Edit Goal' : 'Add New Goal'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Exercise Name
                                    </InputLabel>
                                    <Select
                                        value={newGoal.exerciseName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewGoal({ ...newGoal, exerciseName: value });
                                            if (value === 'custom') {
                                                setCustomExerciseName('');
                                            }
                                        }}
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
                                        <MenuItem value="">
                                            <em>Select an exercise</em>
                                        </MenuItem>
                                        {availableExercises.map(exerciseName => (
                                            <MenuItem key={exerciseName} value={exerciseName}>
                                                {exerciseName}
                                            </MenuItem>
                                        ))}
                                        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                        <MenuItem value="custom">
                                            <em>Custom Exercise Name</em>
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Custom Exercise Name Field */}
                                {newGoal.exerciseName === 'custom' && (
                                    <TextField
                                        fullWidth
                                        label="Custom Exercise Name"
                                        value={customExerciseName}
                                        onChange={(e) => {
                                            setCustomExerciseName(e.target.value);
                                            setNewGoal({ ...newGoal, exerciseName: e.target.value });
                                        }}
                                        sx={{
                                            mt: 2,
                                            '& .MuiOutlinedInput-root': {
                                                color: '#fff',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(0, 255, 159, 0.5)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#00ff9f',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                            },
                                        }}
                                        placeholder="Enter new exercise name"
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label={getWeightLabel(weightUnit).replace('Weight', 'Target Weight')}
                                    type="number"
                                    value={newGoal.targetWeight}
                                    onChange={(e) => setNewGoal({ ...newGoal, targetWeight: e.target.value })}
                                    helperText={weightUnit === 'kg' ? 'Enter target weight in kilograms' : 'Enter target weight in pounds'}
                                    FormHelperTextProps={{
                                        sx: { color: 'text.secondary' }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(0, 255, 159, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#00ff9f',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Target Reps"
                                    type="number"
                                    value={newGoal.targetReps}
                                    onChange={(e) => setNewGoal({ ...newGoal, targetReps: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(0, 255, 159, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#00ff9f',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Target Sets"
                                    type="number"
                                    value={newGoal.targetSets}
                                    onChange={(e) => setNewGoal({ ...newGoal, targetSets: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(0, 255, 159, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#00ff9f',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Deadline"
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: '#fff',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(0, 255, 159, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#00ff9f',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setGoalDialog(false);
                                setEditingGoal(null);
                                setNewGoal({
                                    exerciseName: '',
                                    targetWeight: '',
                                    targetReps: '',
                                    targetSets: '',
                                    deadline: ''
                                });
                                setCustomExerciseName('');
                            }}
                            sx={{ color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGoalSave}
                            variant="contained"
                            startIcon={<MdSave />}
                            disabled={!newGoal.exerciseName}
                            sx={{
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                },
                            }}
                        >
                            {editingGoal ? 'Update Goal' : 'Save Goal'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}