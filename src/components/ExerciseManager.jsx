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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdExpandMore,
    MdMerge,
    MdEdit,
    MdDelete,
    MdWarning,
    MdCheckCircle,
    MdClose,
    MdSave,
    MdCleaningServices
} from 'react-icons/md';
import { collection, query, where, orderBy, getDocs, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { groupSimilarExercises, validateExerciseName, autoCorrectExerciseName } from '../utils/exerciseValidator';

const StyledCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(221, 237, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const SimilarityChip = styled(Chip)(({ similarity }) => ({
    backgroundColor: similarity > 0.9 ? 'rgba(255, 69, 58, 0.2)' :
        similarity > 0.8 ? 'rgba(255, 159, 10, 0.2)' :
            'rgba(255, 204, 0, 0.2)',
    color: similarity > 0.9 ? '#ff453a' :
        similarity > 0.8 ? '#ff9f0a' :
            '#ffcc00'
}));

export default function ExerciseManager() {
    const [exercises, setExercises] = useState([]);
    const [similarGroups, setSimilarGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mergeDialog, setMergeDialog] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [mergeTarget, setMergeTarget] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [editDialog, setEditDialog] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [newName, setNewName] = useState('');

    const { currentUser } = useAuth();

    useEffect(() => {
        loadExercises();
    }, [currentUser]);

    const loadExercises = async () => {
        setLoading(true);
        setError('');
        try {
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

            // Group similar exercises
            const groups = groupSimilarExercises(exerciseData, 0.75);
            setSimilarGroups(groups);

        } catch (err) {
            console.error('Error loading exercises:', err);
            setError('Error loading exercises: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMergeExercises = async () => {
        if (!selectedGroup || !mergeTarget || selectedExercises.length === 0) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);

            // Update all selected exercises to use the target name
            selectedExercises.forEach(exercise => {
                const exerciseRef = doc(db, 'exercises', exercise.id);
                batch.update(exerciseRef, { exerciseName: mergeTarget });
            });

            await batch.commit();

            // Debug: Log merged exercise details
            console.log('🔄 Merged exercises:', {
                target: mergeTarget,
                mergedCount: selectedExercises.length,
                exerciseDetails: selectedExercises.map(ex => ({
                    originalName: ex.exerciseName,
                    weight: ex.weight,
                    timestamp: ex.timestamp,
                    date: new Date(ex.timestamp).toLocaleString()
                })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            });

            setSuccess(`Successfully merged ${selectedExercises.length} exercises to "${mergeTarget}". Check progress tab to verify data.`);
            setMergeDialog(false);
            setSelectedGroup(null);
            setSelectedExercises([]);
            setMergeTarget('');

            // Reload data
            await loadExercises();

        } catch (err) {
            console.error('Error merging exercises:', err);
            setError('Error merging exercises: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRenameExercise = async () => {
        if (!editingExercise || !newName.trim()) return;

        setLoading(true);
        try {
            // Validate new name
            const validation = validateExerciseName(newName, exercises.filter(ex => ex.id !== editingExercise.id));

            if (validation.suggestions.length > 0) {
                setError(`Similar exercise "${validation.suggestions[0].original}" already exists. Consider merging instead.`);
                setLoading(false);
                return;
            }

            // Auto-correct the name
            const correctedName = autoCorrectExerciseName(newName);

            const exerciseRef = doc(db, 'exercises', editingExercise.id);
            await updateDoc(exerciseRef, { exerciseName: correctedName });

            setSuccess(`Exercise renamed to "${correctedName}"`);
            setEditDialog(false);
            setEditingExercise(null);
            setNewName('');

            // Reload data
            await loadExercises();

        } catch (err) {
            console.error('Error renaming exercise:', err);
            setError('Error renaming exercise: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExercise = async (exercise) => {
        if (!confirm(`Are you sure you want to delete "${exercise.exerciseName}"? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'exercises', exercise.id));
            setSuccess(`Exercise "${exercise.exerciseName}" deleted successfully`);
            await loadExercises();
        } catch (err) {
            console.error('Error deleting exercise:', err);
            setError('Error deleting exercise: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const autoCleanup = async () => {
        if (!confirm('This will automatically merge exercises with >90% similarity. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const batch = writeBatch(db);
            let mergedCount = 0;

            // Auto-merge exercises with very high similarity (>90%)
            similarGroups.forEach(group => {
                const highSimilarity = group.similar.filter(s => s.similarity > 0.9);
                if (highSimilarity.length > 0) {
                    const targetName = group.main.exerciseName;

                    highSimilarity.forEach(similar => {
                        const exerciseRef = doc(db, 'exercises', similar.exercise.id);
                        batch.update(exerciseRef, { exerciseName: targetName });
                        mergedCount++;
                    });
                }
            });

            if (mergedCount > 0) {
                await batch.commit();
                setSuccess(`Auto-cleanup completed! Merged ${mergedCount} exercises.`);
                await loadExercises();
            } else {
                setSuccess('No exercises needed automatic cleanup.');
            }

        } catch (err) {
            console.error('Error during auto-cleanup:', err);
            setError('Error during auto-cleanup: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getExerciseStats = (exerciseName) => {
        const exerciseEntries = exercises.filter(ex => ex.exerciseName === exerciseName);
        return {
            count: exerciseEntries.length,
            maxWeight: Math.max(...exerciseEntries.map(ex => parseFloat(ex.weight) || 0)),
            latestDate: new Date(Math.max(...exerciseEntries.map(ex => new Date(ex.timestamp))))
        };
    };

    if (loading && exercises.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress sx={{ color: '#dded00' }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: '#dded00',
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Exercise Data Manager
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

                {success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3, backgroundColor: 'rgba(221, 237, 0, 0.1)', color: '#dded00' }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                {/* Summary Stats */}
                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#dded00' }}>
                                Data Summary
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<MdCleaningServices />}
                                onClick={autoCleanup}
                                disabled={loading || similarGroups.length === 0}
                                sx={{
                                    background: 'linear-gradient(45deg, #ff9800 30%, #ffc107 90%)',
                                    color: '#000',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #ffc107 30%, #ff9800 90%)',
                                    },
                                }}
                            >
                                Auto Cleanup
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box>
                                <Typography variant="h4" sx={{ color: '#dded00' }}>
                                    {exercises.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Total Exercise Entries
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                                    {similarGroups.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Potential Duplicate Groups
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ color: '#fff' }}>
                                    {[...new Set(exercises.map(ex => ex.exerciseName))].length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Unique Exercise Names
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </StyledCard>

                {/* Similar Exercise Groups */}
                {similarGroups.length > 0 && (
                    <StyledCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                                <MdWarning style={{ marginRight: 8 }} />
                                Potential Duplicates ({similarGroups.length} groups)
                            </Typography>

                            {similarGroups.map((group, index) => (
                                <Accordion
                                    key={index}
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        mb: 1,
                                        '&:before': { display: 'none' }
                                    }}
                                >
                                    <AccordionSummary expandIcon={<MdExpandMore style={{ color: '#dded00' }} />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                {group.main.exerciseName}
                                            </Typography>
                                            <Chip
                                                label={`${group.totalCount} variants`}
                                                size="small"
                                                sx={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: '#ff9f0a' }}
                                            />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List>
                                            {/* Main exercise */}
                                            <ListItem>
                                                <ListItemText
                                                    primary={group.main.exerciseName}
                                                    secondary={`${getExerciseStats(group.main.exerciseName).count} entries`}
                                                    sx={{
                                                        '& .MuiListItemText-primary': { color: '#dded00', fontWeight: 'bold' },
                                                        '& .MuiListItemText-secondary': { color: 'text.secondary' }
                                                    }}
                                                />
                                                <Chip label="Main" size="small" sx={{ backgroundColor: 'rgba(221, 237, 0, 0.2)', color: '#dded00' }} />
                                            </ListItem>

                                            {/* Similar exercises */}
                                            {group.similar.map((similar, idx) => (
                                                <ListItem key={idx}>
                                                    <ListItemText
                                                        primary={similar.exercise.exerciseName}
                                                        secondary={`${getExerciseStats(similar.exercise.exerciseName).count} entries`}
                                                        sx={{
                                                            '& .MuiListItemText-primary': { color: '#fff' },
                                                            '& .MuiListItemText-secondary': { color: 'text.secondary' }
                                                        }}
                                                    />
                                                    <SimilarityChip
                                                        label={`${(similar.similarity * 100).toFixed(0)}% similar`}
                                                        size="small"
                                                        similarity={similar.similarity}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>

                                        <Button
                                            variant="contained"
                                            startIcon={<MdMerge />}
                                            onClick={() => {
                                                setSelectedGroup(group);
                                                setMergeTarget(group.main.exerciseName);
                                                setMergeDialog(true);
                                            }}
                                            sx={{
                                                mt: 2,
                                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                                color: '#000',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                                },
                                            }}
                                        >
                                            Merge Group
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </CardContent>
                    </StyledCard>
                )}

                {/* All Exercises List */}
                <StyledCard>
                    <CardContent>
                        <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                            All Exercises ({[...new Set(exercises.map(ex => ex.exerciseName))].length} unique)
                        </Typography>

                        <List>
                            {[...new Set(exercises.map(ex => ex.exerciseName))].map(exerciseName => {
                                const stats = getExerciseStats(exerciseName);
                                return (
                                    <ListItem key={exerciseName} divider>
                                        <ListItemText
                                            primary={exerciseName}
                                            secondary={`${stats.count} entries • Max: ${stats.maxWeight}kg • Latest: ${stats.latestDate.toLocaleDateString()}`}
                                            sx={{
                                                '& .MuiListItemText-primary': { color: '#fff' },
                                                '& .MuiListItemText-secondary': { color: 'text.secondary' }
                                            }}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const exercise = exercises.find(ex => ex.exerciseName === exerciseName);
                                                    setEditingExercise(exercise);
                                                    setNewName(exerciseName);
                                                    setEditDialog(true);
                                                }}
                                                sx={{ color: '#dded00', mr: 1 }}
                                            >
                                                <MdEdit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const exercise = exercises.find(ex => ex.exerciseName === exerciseName);
                                                    handleDeleteExercise(exercise);
                                                }}
                                                sx={{ color: '#ff4444' }}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </CardContent>
                </StyledCard>

                {/* Merge Dialog */}
                <Dialog
                    open={mergeDialog}
                    onClose={() => setMergeDialog(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: '#282828',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(221, 237, 0, 0.2)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#dded00' }}>
                        Merge Similar Exercises
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Target Exercise Name"
                            value={mergeTarget}
                            onChange={(e) => setMergeTarget(e.target.value)}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(221, 237, 0, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: '#dded00' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
                        />

                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Select exercises to merge:
                        </Typography>

                        {selectedGroup && (
                            <List>
                                {[selectedGroup.main, ...selectedGroup.similar.map(s => s.exercise)].map((exercise, index) => (
                                    <ListItem key={index}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={selectedExercises.some(ex => ex.id === exercise.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedExercises([...selectedExercises, exercise]);
                                                        } else {
                                                            setSelectedExercises(selectedExercises.filter(ex => ex.id !== exercise.id));
                                                        }
                                                    }}
                                                    sx={{ color: '#dded00' }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography sx={{ color: '#fff' }}>
                                                        {exercise.exerciseName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {getExerciseStats(exercise.exerciseName).count} entries
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setMergeDialog(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMergeExercises}
                            disabled={selectedExercises.length === 0 || !mergeTarget.trim()}
                            variant="contained"
                            startIcon={<MdSave />}
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                            }}
                        >
                            Merge {selectedExercises.length} Exercises
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog
                    open={editDialog}
                    onClose={() => setEditDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            background: '#282828',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(221, 237, 0, 0.2)',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#dded00' }}>
                        Rename Exercise
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="New Exercise Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            sx={{
                                mt: 2,
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(221, 237, 0, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: '#dded00' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialog(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRenameExercise}
                            disabled={!newName.trim()}
                            variant="contained"
                            startIcon={<MdSave />}
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                            }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
} 