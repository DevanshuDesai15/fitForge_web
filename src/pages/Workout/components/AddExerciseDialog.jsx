import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, TextField, Button,
    Card, CardContent, Typography, Chip, IconButton, CircularProgress,
    InputAdornment, Menu, MenuItem, FormControl, Select,
    useMediaQuery, useTheme, Tabs, Tab
} from '@mui/material';
import {
    X as MdClose,
    Search as MdSearch,
    Filter as MdFilterList,
    Timer as MdTimer,
    Dumbbell as MdFitnessCenter,
    Target,
    Footprints,
    PersonStanding,
    Mountain,
    Bike,
    Waves,
    Zap,
    Anchor,
    Activity,
    TrendingUp,
} from 'lucide-react';
import { fetchExercises } from '../../../services/localExerciseService';
import PropTypes from 'prop-types';

export const CARDIO_ACTIVITIES = [
    { name: 'Running',       Icon: Footprints },
    { name: 'Jogging',       Icon: Footprints },
    { name: 'Walking',       Icon: PersonStanding },
    { name: 'Hiking',        Icon: Mountain },
    { name: 'Cycling',       Icon: Bike },
    { name: 'Swimming',      Icon: Waves },
    { name: 'Jump Rope',     Icon: Zap },
    { name: 'Rowing',        Icon: Anchor },
    { name: 'Elliptical',    Icon: Activity },
    { name: 'Stair Climber', Icon: TrendingUp },
];

export function buildCardioExercise(activityName) {
    return {
        name: activityName,
        exercise_type: 'cardio',
        cardio: { duration_minutes: null, distance_km: null, completed: false },
    };
}

const AddExerciseDialog = ({ open, onClose, onAddExercise }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeTab, setActiveTab] = useState('strength');
    const [searchQuery, setSearchQuery] = useState('');
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');

    const muscleGroups = [
        'all','Chest','Back','Shoulders','Arms',
        'Legs','Core','Glutes','Hamstrings','Quadriceps','Calves',
    ];
    const difficultyLevels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    useEffect(() => {
        if (open) loadExercises();
    }, [open]);

    useEffect(() => {
        let filtered = exercises;
        if (searchQuery) {
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(ex =>
                ex.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
            );
        }
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

    const handleAddStrengthExercise = (exercise) => {
        onAddExercise({
            name: exercise.name,
            exercise_type: 'strength',
            difficulty: exercise.difficulty || 'Intermediate',
            muscles: exercise.primaryMuscles?.join(', ') || exercise.muscles || 'Various',
            muscleGroups: exercise.primaryMuscles?.join(', ') || exercise.muscles || 'Various',
            equipment: exercise.equipment || 'Bodyweight',
            targetSets: 3,
            targetReps: '8-12',
            sets: [
                { weight: '', reps: '', completed: false },
                { weight: '', reps: '', completed: false },
                { weight: '', reps: '', completed: false },
            ],
        });
        onClose();
    };

    const handleAddCardioActivity = (activity) => {
        onAddExercise(buildCardioExercise(activity.name));
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
            <DialogTitle sx={{ p: isMobile ? 2 : 3, pb: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Add Exercise
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                        <MdClose />
                    </IconButton>
                </Box>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        '& .MuiTab-root': { color: 'text.secondary', textTransform: 'none', fontWeight: 600 },
                        '& .Mui-selected': { color: '#dded00' },
                        '& .MuiTabs-indicator': { backgroundColor: '#dded00' },
                    }}
                >
                    <Tab label="Strength" value="strength" />
                    <Tab label="Cardio" value="cardio" />
                </Tabs>
            </DialogTitle>

            <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
                {activeTab === 'strength' && (
                    <>
                        <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, mb: isMobile ? 2 : 3, mt: 2 }}>
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
                                    color: '#dded00', borderColor: '#dded00',
                                    minWidth: isMobile ? '48px' : '120px',
                                    borderRadius: '12px', textTransform: 'none',
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
                                PaperProps={{ sx: { backgroundColor: '#282828', border: '1px solid rgba(255, 255, 255, 0.1)', minWidth: '250px' } }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Difficulty</Typography>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <Select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}
                                            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                            {difficultyLevels.map(l => <MenuItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>Muscle Group</Typography>
                                    <FormControl fullWidth>
                                        <Select value={selectedMuscleGroup} onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                                            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' } }}>
                                            {muscleGroups.map(g => <MenuItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Menu>
                        </Box>

                        <Box sx={{ maxHeight: '450px', overflowY: 'auto' }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress sx={{ color: '#dded00' }} />
                                </Box>
                            ) : filteredExercises.length === 0 ? (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>No exercises found</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {filteredExercises.map((exercise, index) => (
                                        <Card key={index} onClick={() => handleAddStrengthExercise(exercise)}
                                            sx={{
                                                background: 'rgba(40, 40, 40, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                                '&:hover': { borderColor: '#dded00', backgroundColor: 'rgba(221, 237, 0, 0.05)', transform: 'translateY(-2px)' }
                                            }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>{exercise.name}</Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                                            {exercise.primaryMuscles?.slice(0, 3).map((muscle, idx) => (
                                                                <Chip key={idx} label={muscle} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem', height: '24px' }} />
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
                                                        <Chip label={exercise.difficulty || 'Beginner'} size="small"
                                                            sx={{ backgroundColor: getDifficultyColor(exercise.difficulty), color: exercise.difficulty?.toLowerCase() === 'intermediate' ? '#000' : '#fff', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{exercise.equipment || 'Bodyweight'}</Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </>
                )}

                {activeTab === 'cardio' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            Select a cardio activity to add to your workout.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2 }}>
                            {CARDIO_ACTIVITIES.map((activity) => (
                                <Card key={activity.name} onClick={() => handleAddCardioActivity(activity)}
                                    sx={{
                                        background: 'rgba(40, 40, 40, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                        '&:hover': { borderColor: '#dded00', backgroundColor: 'rgba(221, 237, 0, 0.05)', transform: 'translateY(-2px)' }
                                    }}>
                                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                        <activity.Icon size={28} style={{ color: '#dded00', marginBottom: '8px' }} />
                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                            {activity.name}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

AddExerciseDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddExercise: PropTypes.func.isRequired,
};

export default AddExerciseDialog;
