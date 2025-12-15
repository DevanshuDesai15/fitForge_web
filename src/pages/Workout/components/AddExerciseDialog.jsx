import { useState, useEffect } from 'react';
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
    useMediaQuery,
    useTheme
} from '@mui/material';
import { MdClose, MdSearch, MdFilterList, MdTimer, MdFitnessCenter } from 'react-icons/md';
import { Target, Dumbbell } from 'lucide-react';
import { fetchExercises, fetchExercisesByBodyPart } from '../../../services/localExerciseService';
import PropTypes from 'prop-types';

const AddExerciseDialog = ({ open, onClose, onAddExercise }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');

    const muscleGroups = [
        'all',
        'Chest',
        'Back',
        'Shoulders',
        'Arms',
        'Legs',
        'Core',
        'Glutes',
        'Hamstrings',
        'Quadriceps',
        'Calves'
    ];

    const difficultyLevels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    // Load exercises when dialog opens
    useEffect(() => {
        if (open) {
            loadExercises();
        }
    }, [open]);

    // Filter exercises based on search and filters
    useEffect(() => {
        let filtered = exercises;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by difficulty
        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(ex =>
                ex.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
            );
        }

        // Filter by muscle group
        if (selectedMuscleGroup !== 'all') {
            filtered = filtered.filter(ex =>
                ex.primaryMuscles?.some(m => m.toLowerCase().includes(selectedMuscleGroup.toLowerCase())) ||
                ex.muscles?.toLowerCase().includes(selectedMuscleGroup.toLowerCase())
            );
        }

        setFilteredExercises(filtered);
    }, [searchQuery, selectedDifficulty, selectedMuscleGroup, exercises]);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const data = await fetchExercises(50, 0);
            setExercises(data);
            setFilteredExercises(data);
        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExercise = (exercise) => {
        // Add exercise with default sets/reps
        const exerciseData = {
            name: exercise.name,
            difficulty: exercise.difficulty || 'Intermediate',
            muscles: exercise.primaryMuscles?.join(', ') || exercise.muscles || 'Various',
            muscleGroups: exercise.primaryMuscles?.join(', ') || exercise.muscles || 'Various',
            equipment: exercise.equipment || 'Bodyweight',
            targetSets: 3,
            targetReps: '8-12',
            sets: [
                { weight: '', reps: '', completed: false },
                { weight: '', reps: '', completed: false },
                { weight: '', reps: '', completed: false }
            ]
        };
        onAddExercise(exerciseData);
        onClose();
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'beginner':
                return '#4caf50';
            case 'intermediate':
                return '#dded00';
            case 'advanced':
                return '#f44336';
            default:
                return '#dded00';
        }
    };

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
                        <Typography variant={isMobile ? "h6" : "h5"} sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
                            Add Exercises to Workout
                        </Typography>
                        <Typography
                            variant={isMobile ? "caption" : "body2"}
                            sx={{
                                color: 'text.secondary',
                                display: isMobile ? 'none' : 'block'
                            }}
                        >
                            Browse and select exercises to add to your current workout session.
                            Use filters to find exercises by muscle group, equipment, or difficulty level.
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                        <MdClose />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
                {/* Search and Filters */}
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
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
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
                            '&:hover': {
                                borderColor: '#dded00',
                                backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            }
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
                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                                Difficulty
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <Select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    sx={{
                                        color: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#dded00',
                                        },
                                    }}
                                >
                                    {difficultyLevels.map(level => (
                                        <MenuItem key={level} value={level}>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                                Muscle Group
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    value={selectedMuscleGroup}
                                    onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                                    sx={{
                                        color: '#fff',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#dded00',
                                        },
                                    }}
                                >
                                    {muscleGroups.map(group => (
                                        <MenuItem key={group} value={group}>
                                            {group.charAt(0).toUpperCase() + group.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Menu>
                </Box>

                {/* Exercise List */}
                <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress sx={{ color: '#dded00' }} />
                        </Box>
                    ) : filteredExercises.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                No exercises found
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {filteredExercises.map((exercise, index) => (
                                <Card
                                    key={index}
                                    onClick={() => handleAddExercise(exercise)}
                                    sx={{
                                        background: 'rgba(40, 40, 40, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
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
                                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                                                    {exercise.name}
                                                </Typography>

                                                {/* Muscle Groups */}
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

                                                {/* Stats Row */}
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Target size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            3 sets
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdFitnessCenter size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            10-15 reps
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <MdTimer size={14} color="rgba(255, 255, 255, 0.6)" />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            60s rest
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Right Side - Difficulty & Equipment */}
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
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

AddExerciseDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddExercise: PropTypes.func.isRequired
};

export default AddExerciseDialog;
