import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    CircularProgress,
    InputAdornment,
    Menu,
    MenuItem,
    FormControl,
    Select,
    Collapse,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    X as MdClose,
    Search as MdSearch,
    Filter as MdFilterList,
    Timer as MdTimer,
    Dumbbell as MdFitnessCenter,
    Target,
    Plus,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { fetchExercises } from '../../../services/localExerciseService';
import { useCustomExercises } from '../../../hooks/useCustomExercises';
import PropTypes from 'prop-types';

const MUSCLE_GROUPS = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core',
    'Glutes', 'Hamstrings', 'Quadriceps', 'Calves'
];

const CustomExerciseForm = ({ initialName, onAdd, compact = false }) => {
    const [name, setName] = useState(initialName || '');
    const [muscleGroup, setMuscleGroup] = useState('');

    useEffect(() => {
        setName(initialName || '');
    }, [initialName]);

    const handleSubmit = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd({ name: trimmed, muscleGroup });
        setName('');
        setMuscleGroup('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
                fullWidth
                placeholder="Exercise name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                size={compact ? 'small' : 'medium'}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                        '&:hover fieldset': { borderColor: '#dded00' },
                        '&.Mui-focused fieldset': { borderColor: '#dded00' },
                    },
                }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl size={compact ? 'small' : 'medium'} sx={{ flex: 1 }}>
                    <Select
                        displayEmpty
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value)}
                        renderValue={(v) => v || <span style={{ color: 'rgba(255,255,255,0.4)' }}>Muscle group (optional)</span>}
                        sx={{
                            color: '#fff',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                        }}
                    >
                        <MenuItem value=""><em>None / Other</em></MenuItem>
                        {MUSCLE_GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    disabled={!name.trim()}
                    onClick={handleSubmit}
                    size={compact ? 'small' : 'medium'}
                    sx={{
                        backgroundColor: '#dded00',
                        color: '#000',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': { backgroundColor: '#c8d800' },
                        '&:disabled': { backgroundColor: 'rgba(221, 237, 0, 0.3)', color: 'rgba(0,0,0,0.4)' },
                    }}
                >
                    Add to Workout
                </Button>
            </Box>
            {muscleGroup && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: -0.5 }}>
                    Muscle group helps the AI track your progression after the first completed workout.
                </Typography>
            )}
        </Box>
    );
};

CustomExerciseForm.propTypes = {
    initialName: PropTypes.string,
    onAdd: PropTypes.func.isRequired,
    compact: PropTypes.bool,
};

const SwapExerciseDialog = ({ open, onClose, onSwapExercise, exerciseName }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { customExercises, saveCustomExercise } = useCustomExercises();

    const [searchQuery, setSearchQuery] = useState('');
    const [libraryExercises, setLibraryExercises] = useState([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');
    const [showCustomForm, setShowCustomForm] = useState(false);

    const muscleGroupOptions = ['all', ...MUSCLE_GROUPS];
    const difficultyLevels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setSelectedDifficulty('all');
            setSelectedMuscleGroup('all');
            setShowCustomForm(false);
            loadLibrary();
        }
    }, [open]);

    const loadLibrary = async () => {
        setLibraryLoading(true);
        try {
            const data = await fetchExercises(50, 0);
            setLibraryExercises(data);
        } catch (err) {
            console.error('Error loading exercise library:', err);
        } finally {
            setLibraryLoading(false);
        }
    };

    // Merge custom (Supabase-backed) + library, custom exercises shown first.
    const allExercises = useMemo(() => {
        const libraryNames = new Set(libraryExercises.map(e => e.name.toLowerCase()));
        const uniqueCustom = customExercises.filter(e => !libraryNames.has(e.name.toLowerCase()));
        return [...uniqueCustom, ...libraryExercises];
    }, [customExercises, libraryExercises]);

    const filteredExercises = useMemo(() => {
        let result = allExercises;
        if (searchQuery) {
            result = result.filter(ex =>
                ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedDifficulty !== 'all') {
            result = result.filter(ex =>
                ex.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
            );
        }
        if (selectedMuscleGroup !== 'all') {
            result = result.filter(ex =>
                ex.primaryMuscles?.some(m => m.toLowerCase().includes(selectedMuscleGroup.toLowerCase())) ||
                ex.muscles?.toLowerCase().includes(selectedMuscleGroup.toLowerCase())
            );
        }
        return result;
    }, [allExercises, searchQuery, selectedDifficulty, selectedMuscleGroup]);

    const handleSelect = (exercise) => {
        onSwapExercise(exercise);
        onClose();
    };

    const handleAddCustom = async ({ name, muscleGroup }) => {
        const exercise = {
            name,
            difficulty: 'Intermediate',
            primaryMuscles: muscleGroup ? [muscleGroup] : [],
            muscles: muscleGroup || 'Various',
            muscleGroups: muscleGroup || 'Various',
            equipment: 'Various',
            isCustom: true,
        };
        // Persist to Supabase + localStorage cache
        await saveCustomExercise({ name, muscleGroup });
        onSwapExercise(exercise);
        onClose();
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner': return '#4caf50';
            case 'intermediate': return '#dded00';
            case 'advanced': return '#f44336';
            default: return '#dded00';
        }
    };

    const noResults = !libraryLoading && filteredExercises.length === 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    background: '#1a1a1a',
                    borderRadius: isMobile ? 0 : '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }
            }}
        >
            <DialogTitle sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 1.5 : 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
                            Swap Exercise
                        </Typography>
                        {exerciseName && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Replacing: <span style={{ color: '#dded00' }}>{exerciseName}</span>
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                        <MdClose />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
                {/* Search + Filters */}
                <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, mb: isMobile ? 2 : 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MdSearch style={{ color: '#dded00' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                fontSize: isMobile ? '0.9rem' : '1rem',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                '&:hover fieldset': { borderColor: '#dded00' },
                                '&.Mui-focused fieldset': { borderColor: '#dded00' },
                            },
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={!isMobile && <MdFilterList />}
                        onClick={(e) => setFilterAnchor(e.currentTarget)}
                        sx={{
                            color: '#dded00',
                            borderColor: '#dded00',
                            minWidth: isMobile ? '48px' : '120px',
                            borderRadius: '12px',
                            textTransform: 'none',
                            px: isMobile ? 1 : 2,
                            '&:hover': { borderColor: '#dded00', backgroundColor: 'rgba(221, 237, 0, 0.1)' }
                        }}
                    >
                        {isMobile ? <MdFilterList /> : 'Filters'}
                    </Button>
                    <Menu
                        anchorEl={filterAnchor}
                        open={Boolean(filterAnchor)}
                        onClose={() => setFilterAnchor(null)}
                        PaperProps={{
                            sx: {
                                backgroundColor: '#282828',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                minWidth: '250px'
                            }
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Difficulty</Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <Select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    sx={{
                                        color: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                                    }}
                                >
                                    {difficultyLevels.map(level => (
                                        <MenuItem key={level} value={level}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Muscle Group</Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={selectedMuscleGroup}
                                    onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                                    sx={{
                                        color: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                                    }}
                                >
                                    {muscleGroupOptions.map(group => (
                                        <MenuItem key={group} value={group}>
                                            {group.charAt(0).toUpperCase() + group.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Menu>
                </Box>

                {/* Exercise list */}
                <Box sx={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {libraryLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress sx={{ color: '#dded00' }} />
                        </Box>
                    ) : noResults ? (
                        /* Empty state — auto-show custom form */
                        <Box sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}>
                                No exercises found{searchQuery ? ` for "${searchQuery}"` : ''}.
                            </Typography>
                            <Box sx={{
                                p: 2.5,
                                borderRadius: '12px',
                                border: '1px dashed rgba(221, 237, 0, 0.4)',
                                backgroundColor: 'rgba(221, 237, 0, 0.04)',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Plus size={16} color="#dded00" />
                                    <Typography variant="subtitle2" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                                        Add as custom exercise
                                    </Typography>
                                </Box>
                                <CustomExerciseForm initialName={searchQuery} onAdd={handleAddCustom} />
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {filteredExercises.map((exercise, index) => (
                                <Card
                                    key={index}
                                    onClick={() => handleSelect(exercise)}
                                    sx={{
                                        background: exercise.isCustom
                                            ? 'rgba(221, 237, 0, 0.04)'
                                            : 'rgba(40, 40, 40, 0.6)',
                                        border: exercise.isCustom
                                            ? '1px solid rgba(221, 237, 0, 0.25)'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: '#dded00',
                                            backgroundColor: 'rgba(221, 237, 0, 0.05)',
                                            transform: 'translateY(-2px)',
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                        {exercise.name}
                                                    </Typography>
                                                    {exercise.isCustom && (
                                                        <Chip
                                                            label="Custom"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(221, 237, 0, 0.15)',
                                                                color: '#dded00',
                                                                fontSize: '0.7rem',
                                                                height: '20px',
                                                                fontWeight: 'bold',
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                                    {exercise.primaryMuscles?.slice(0, 3).map((muscle, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={muscle}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                color: '#fff',
                                                                fontSize: '0.75rem',
                                                                height: '24px'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Target size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>3 sets</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdFitnessCenter size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>10-15 reps</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdTimer size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>60s rest</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                                <Chip
                                                    label={exercise.difficulty || 'Beginner'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: getDifficultyColor(exercise.difficulty),
                                                        color: exercise.difficulty?.toLowerCase() === 'intermediate' ? '#000' : '#fff',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {exercise.equipment || 'Bodyweight'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Always-available custom creator at the bottom */}
                            <Card sx={{
                                background: 'rgba(221, 237, 0, 0.03)',
                                border: '1px dashed rgba(221, 237, 0, 0.3)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                            }}>
                                <CardContent
                                    onClick={() => setShowCustomForm(v => !v)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        '&:last-child': { pb: showCustomForm ? 1 : 2 },
                                        '&:hover': { backgroundColor: 'rgba(221, 237, 0, 0.05)' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Plus size={16} color="#dded00" />
                                        <Typography variant="body2" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                                            Can&apos;t find it? Add custom exercise
                                        </Typography>
                                    </Box>
                                    {showCustomForm
                                        ? <ChevronUp size={16} color="#dded00" />
                                        : <ChevronDown size={16} color="#dded00" />
                                    }
                                </CardContent>
                                <Collapse in={showCustomForm}>
                                    <Box sx={{ px: 2, pb: 2 }}>
                                        <CustomExerciseForm
                                            initialName={searchQuery}
                                            onAdd={handleAddCustom}
                                            compact
                                        />
                                    </Box>
                                </Collapse>
                            </Card>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

SwapExerciseDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSwapExercise: PropTypes.func.isRequired,
    exerciseName: PropTypes.string,
};

export default SwapExerciseDialog;
