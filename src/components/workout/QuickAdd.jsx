import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ListSubheader,
    TextField,
    InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdAdd, MdSave, MdFavorite, MdSearch } from 'react-icons/md';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchExercises } from '../../services/exerciseAPI';
import { initializeExerciseDatabase, getAllExercises, checkExerciseDatabase } from '../../services/exerciseInitializer';
import ExerciseListSkeleton from '../common/ExerciseListSkeleton';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTextField = styled('input')({
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    '&:focus': {
        outline: 'none',
        borderColor: '#00ff9f',
    },
    '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.5)',
    },
});

export default function QuickAdd() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [exercise, setExercise] = useState({
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
    });
    const [apiExercises, setApiExercises] = useState([]);
    const [savedExercises, setSavedExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [loadingExercises, setLoadingExercises] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Add this effect to preload exercises
    useEffect(() => {
        const preloadExercises = async () => {
            try {
                const cachedExercises = localStorage.getItem('cachedExercises');
                const cachedTimestamp = localStorage.getItem('exercisesCacheTimestamp');
                const cacheAge = cachedTimestamp ? Date.now() - parseInt(cachedTimestamp) : null;

                // Use cache if it's less than 24 hours old
                if (cachedExercises && cacheAge && cacheAge < 24 * 60 * 60 * 1000) {
                    const parsed = JSON.parse(cachedExercises);
                    setApiExercises(parsed);
                    setLoadingExercises(false);
                    console.log('Loaded exercises from cache');
                } else {
                    await loadAllExercises();
                }
            } catch (error) {
                console.error('Error preloading exercises:', error);
            } finally {
                setIsInitialLoad(false);
            }
        };

        preloadExercises();
    }, []);

    const loadAllExercises = async () => {
        setLoadingExercises(true);
        try {
            const apiData = await fetchExercises(0, 0);

            const uniqueApiExercises = [...new Set(apiData.map(ex => ex.name))].map(name => {
                const exercise = apiData.find(ex => ex.name === name);
                return {
                    id: `api-${exercise.id}`,
                    name: exercise.name,
                    type: 'api',
                    equipment: exercise.equipment,
                    target: exercise.target
                };
            });

            // Cache the exercises
            localStorage.setItem('cachedExercises', JSON.stringify(uniqueApiExercises));
            localStorage.setItem('exercisesCacheTimestamp', Date.now().toString());

            setApiExercises(uniqueApiExercises);

            // Load saved exercises
            if (currentUser) {
                const q = query(
                    collection(db, 'exerciseLibrary'),
                    where("userId", "==", currentUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const savedData = querySnapshot.docs.map(doc => ({
                    id: `saved-${doc.id}`,
                    ...doc.data(),
                    type: 'saved'
                }));
                setSavedExercises(savedData);
            }
        } catch (error) {
            console.error("Error loading exercises:", error);
            setError("Failed to load exercises");
        } finally {
            setLoadingExercises(false);
        }
    };

    const handleExerciseSelect = (event) => {
        const selectedValue = event.target.value;
        setSelectedExercise(selectedValue);

        if (selectedValue) {
            let selected;
            if (selectedValue.startsWith('api-')) {
                selected = apiExercises.find(ex => ex.id === selectedValue);
            } else {
                selected = savedExercises.find(ex => ex.id === selectedValue);
            }

            if (selected) {
                setExercise(prev => ({
                    ...prev,
                    exerciseName: selected.name,
                    weight: selected.defaultWeight || '',
                    reps: selected.defaultReps || '',
                    sets: selected.defaultSets || '',
                    notes: selected.type === 'api' ?
                        `Target: ${selected.target}, Equipment: ${selected.equipment}` :
                        selected.notes || ''
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await addDoc(collection(db, 'exercises'), {
                ...exercise,
                userId: currentUser.uid,
                timestamp: new Date().toISOString(),
            });

            setSuccess('Exercise added successfully!');
            setExercise({
                exerciseName: '',
                weight: '',
                reps: '',
                sets: '',
                notes: ''
            });

            // Automatically clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (error) {
            setError('Failed to add exercise: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExercise(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear selected exercise if user modifies the exercise name
        if (name === 'exerciseName') {
            setSelectedExercise('');
        }
    };

    // Optimize filtering for larger datasets
    const filteredExercises = {
        saved: savedExercises.filter(ex =>
            !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        api: apiExercises.filter(ex =>
            !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 100) // Show first 100 matches from API exercises when searching
    };

    // Update the Select MenuProps to handle larger lists
    const menuProps = {
        PaperProps: {
            style: {
                maxHeight: 400,
                backgroundColor: '#1e1e1e',
            },
        },
        // Improve performance for long lists
        anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
        },
        transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
        },
        getContentAnchorEl: null,
        // Virtualization for better performance with large lists
        MenuListProps: {
            style: {
                paddingTop: 0,
                paddingBottom: 0,
            },
        },
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
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
                    Quick Add Exercise
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444'
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                            color: '#00ff9f'
                        }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                <StyledCard>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <Select
                                            value={selectedExercise}
                                            onChange={handleExerciseSelect}
                                            disabled={loadingExercises}
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return (
                                                        <InputAdornment position="start">
                                                            <MdSearch style={{ color: '#00ff9f', marginRight: 8 }} />
                                                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                                Search exercises...
                                                            </Typography>
                                                        </InputAdornment>
                                                    );
                                                }
                                                const exercise = [...savedExercises, ...apiExercises].find(ex => ex.id === selected);
                                                return exercise ? exercise.name : '';
                                            }}
                                            onOpen={() => setSearchTerm('')}
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
                                            MenuProps={menuProps}
                                        >
                                            <MenuItem>
                                                <TextField
                                                    autoFocus
                                                    fullWidth
                                                    placeholder="Search exercises..."
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    variant="standard"
                                                    sx={{
                                                        '& .MuiInput-input': {
                                                            color: '#fff',
                                                        },
                                                        '& .MuiInput-underline:before': {
                                                            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                                                        },
                                                        '& .MuiInput-underline:hover:before': {
                                                            borderBottomColor: 'rgba(0, 255, 159, 0.5)',
                                                        },
                                                        '& .MuiInput-underline:after': {
                                                            borderBottomColor: '#00ff9f',
                                                        },
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <MdSearch style={{ color: '#00ff9f' }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => {
                                                        if (e.key !== 'Escape') {
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                />
                                            </MenuItem>

                                            <MenuItem value="">
                                                <em>Custom Exercise</em>
                                            </MenuItem>

                                            {loadingExercises ? (
                                                <MenuItem disabled>
                                                    {isInitialLoad ? (
                                                        <ExerciseListSkeleton />
                                                    ) : (
                                                        <>
                                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                                            Loading exercises...
                                                        </>
                                                    )}
                                                </MenuItem>
                                            ) : (
                                                <>
                                                    {filteredExercises.saved.length > 0 && [
                                                        <ListSubheader
                                                            key="saved-header"
                                                            sx={{
                                                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                                color: '#00ff9f',
                                                                lineHeight: '32px'
                                                            }}
                                                        >
                                                            Your Saved Exercises ({filteredExercises.saved.length})
                                                        </ListSubheader>,
                                                        ...filteredExercises.saved.map((ex) => (
                                                            <MenuItem key={ex.id} value={ex.id}>
                                                                <MdFavorite style={{ marginRight: 8, color: '#00ff9f' }} />
                                                                {ex.name}
                                                            </MenuItem>
                                                        ))
                                                    ]}

                                                    {filteredExercises.api.length > 0 && [
                                                        <ListSubheader
                                                            key="api-header"
                                                            sx={{
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                color: '#fff',
                                                                lineHeight: '32px'
                                                            }}
                                                        >
                                                            Exercise Database ({apiExercises.length} total, showing {filteredExercises.api.length})
                                                        </ListSubheader>,
                                                        ...filteredExercises.api.map((ex) => (
                                                            <MenuItem key={ex.id} value={ex.id}>
                                                                {ex.name}
                                                            </MenuItem>
                                                        ))
                                                    ]}

                                                    {filteredExercises.saved.length === 0 &&
                                                        filteredExercises.api.length === 0 && (
                                                            <MenuItem disabled>
                                                                No exercises found matching "{searchTerm}"
                                                            </MenuItem>
                                                        )}
                                                </>
                                            )}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <StyledTextField
                                        type="text"
                                        name="exerciseName"
                                        placeholder="Exercise Name"
                                        value={exercise.exerciseName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="weight"
                                        placeholder="Weight (kg)"
                                        value={exercise.weight}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="reps"
                                        placeholder="Reps"
                                        value={exercise.reps}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <StyledTextField
                                        type="number"
                                        name="sets"
                                        placeholder="Sets"
                                        value={exercise.sets}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <StyledTextField
                                        as="textarea"
                                        name="notes"
                                        placeholder="Notes (optional)"
                                        value={exercise.notes}
                                        onChange={handleChange}
                                        style={{ minHeight: '100px' }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
                                        sx={{
                                            mt: 2,
                                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                            },
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Exercise'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </StyledCard>

                <Button
                    onClick={() => navigate('/workout')}
                    sx={{
                        mt: 3,
                        color: 'text.secondary',
                        '&:hover': {
                            color: '#00ff9f',
                        },
                    }}
                >
                    Back to Workout
                </Button>
            </div>
        </Box>
    );
}