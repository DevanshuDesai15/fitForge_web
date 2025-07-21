import { useState, useEffect } from 'react';
import {
    Box,
    Autocomplete,
    TextField,
    Typography,
    CircularProgress
} from '@mui/material';
import { MdFavorite } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllExercises } from '../../services/exerciseAPI';

export default function ExerciseSelector({
    onExerciseSelect,
    selectedExercise = '',
    placeholder = "Select or type exercise name...",
    includeHistory = true,
    includeTemplates = false,
    templateExercises = [],
    sx = {}
}) {
    const [apiExercises, setApiExercises] = useState([]);
    const [savedExercises, setSavedExercises] = useState([]);
    const [historyExercises, setHistoryExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(true);
    const { currentUser } = useAuth();

    // Load all exercise data
    useEffect(() => {
        if (currentUser) {
            loadAllExercises();
        }
    }, [currentUser]);

    const loadAllExercises = async () => {
        setLoadingExercises(true);
        try {
            // Load API exercises (with caching)
            const cachedExercises = localStorage.getItem('cachedExercises');
            const cachedTimestamp = localStorage.getItem('exercisesCacheTimestamp');
            const cacheAge = cachedTimestamp ? Date.now() - parseInt(cachedTimestamp) : null;

            if (cachedExercises && cacheAge && cacheAge < 24 * 60 * 60 * 1000) {
                const parsed = JSON.parse(cachedExercises);
                setApiExercises(parsed);
            } else {
                const apiData = await fetchAllExercises();
                const uniqueApiExercises = [...new Set(apiData.map(ex => ex.name))].map(name => {
                    const exercise = apiData.find(ex => ex.name === name);
                    return {
                        id: `api-${exercise.id}`,
                        name: exercise.name,
                        type: 'api',
                        equipment: exercise.equipment,
                        target: exercise.target,
                        bodyPart: exercise.bodyPart
                    };
                });

                localStorage.setItem('cachedExercises', JSON.stringify(uniqueApiExercises));
                localStorage.setItem('exercisesCacheTimestamp', Date.now().toString());
                setApiExercises(uniqueApiExercises);
            }

            // Load saved exercises from exercise library
            const savedQuery = query(
                collection(db, 'exerciseLibrary'),
                where("userId", "==", currentUser.uid)
            );
            const savedSnapshot = await getDocs(savedQuery);
            const savedData = savedSnapshot.docs.map(doc => ({
                id: `saved-${doc.id}`,
                ...doc.data(),
                type: 'saved'
            }));
            setSavedExercises(savedData);

            // Load exercise history if requested
            if (includeHistory) {
                const historyQuery = query(
                    collection(db, 'exercises'),
                    where('userId', '==', currentUser.uid)
                );
                const historySnapshot = await getDocs(historyQuery);
                const historyData = historySnapshot.docs.map(doc => ({
                    id: `history-${doc.id}`,
                    ...doc.data(),
                    type: 'history'
                }));

                // Get unique exercises with their latest data
                const uniqueHistory = historyData.reduce((acc, exercise) => {
                    const name = exercise.exerciseName;
                    if (!acc[name] || new Date(exercise.timestamp) > new Date(acc[name].timestamp)) {
                        acc[name] = {
                            id: `history-${name}`,
                            name: exercise.exerciseName,
                            type: 'history',
                            lastWeight: exercise.weight,
                            lastReps: exercise.reps,
                            lastSets: exercise.sets,
                            lastNotes: exercise.notes,
                            timestamp: exercise.timestamp
                        };
                    }
                    return acc;
                }, {});

                setHistoryExercises(Object.values(uniqueHistory));
            }
        } catch (error) {
            console.error("Error loading exercises:", error);
        } finally {
            setLoadingExercises(false);
        }
    };



    // Create a flat list of all exercises for Autocomplete
    const allExercises = [
        // Saved exercises first (highest priority)
        ...savedExercises.map(ex => ({
            ...ex,
            label: ex.name,
            group: 'Your Saved Exercises',
            priority: 1
        })),
        // History exercises second
        ...(includeHistory ? historyExercises.map(ex => ({
            ...ex,
            label: `${ex.name} (Last: ${ex.lastWeight}kg × ${ex.lastReps} reps)`,
            group: 'Recent Exercises',
            priority: 2
        })) : []),
        // Template exercises third
        ...(includeTemplates ? templateExercises.map((ex, index) => ({
            ...ex,
            id: `template-${index}`,
            label: ex.defaultWeight ? `${ex.name} (${ex.defaultWeight}kg × ${ex.defaultReps} reps)` : ex.name,
            group: 'Template Exercises',
            priority: 3,
            type: 'template'
        })) : []),
        // API exercises last (full database for searching)
        ...apiExercises.map(ex => ({
            ...ex,
            label: ex.name,
            group: 'Exercise Database',
            priority: 4
        }))
    ];

    const [inputValue, setInputValue] = useState('');
    const [selectedValue, setSelectedValue] = useState(null);

    const handleAutocompleteChange = (event, newValue, reason) => {
        console.log('🔍 ExerciseSelector: Autocomplete change:', { newValue, reason });

        if (newValue && typeof newValue === 'object') {
            // User selected an existing exercise
            const exerciseData = {
                id: newValue.id,
                name: newValue.name,
                type: newValue.type,
                defaultWeight: newValue.defaultWeight || newValue.lastWeight || '',
                defaultReps: newValue.defaultReps || newValue.lastReps || '',
                defaultSets: newValue.defaultSets || newValue.lastSets || '',
                notes: newValue.notes || newValue.lastNotes ||
                    (newValue.type === 'api' ? `Target: ${newValue.target}, Equipment: ${newValue.equipment}` : ''),
                target: newValue.target,
                equipment: newValue.equipment,
                bodyPart: newValue.bodyPart
            };
            console.log('✅ ExerciseSelector: Calling onExerciseSelect with selected exercise:', exerciseData);
            onExerciseSelect(exerciseData);
        } else if (typeof newValue === 'string' && newValue.trim()) {
            // User typed a custom exercise name
            const customExercise = {
                id: 'custom-new',
                name: newValue.trim(),
                type: 'custom',
                defaultWeight: '',
                defaultReps: '',
                defaultSets: '',
                notes: ''
            };
            console.log('✅ ExerciseSelector: Calling onExerciseSelect with custom exercise:', customExercise);
            onExerciseSelect(customExercise);
        } else {
            // Clear selection
            console.log('🧹 ExerciseSelector: Clearing selection');
            onExerciseSelect(null);
        }

        setSelectedValue(newValue);
    };

    const handleInputChange = (event, newInputValue, reason) => {
        console.log('🔍 ExerciseSelector: Input change:', { newInputValue, reason });
        setInputValue(newInputValue);
    };

    return (
        <Box sx={sx}>
            <Autocomplete
                value={selectedValue}
                inputValue={inputValue}
                onChange={handleAutocompleteChange}
                onInputChange={handleInputChange}
                options={allExercises}
                groupBy={(option) => option.group}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.name || option.label || '';
                }}
                renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            {option.group === 'Your Saved Exercises' && (
                                <MdFavorite style={{ color: '#00ff9f', fontSize: '16px' }} />
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                                    {option.name}
                                </Typography>
                                {(option.lastWeight || option.defaultWeight) && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                                        {option.lastWeight ? `Last: ${option.lastWeight}kg × ${option.lastReps} reps` :
                                            option.defaultWeight ? `${option.defaultWeight}kg × ${option.defaultReps} reps` : ''}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        variant="outlined"
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 255, 159, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#00ff9f',
                                    borderWidth: '2px',
                                },
                                '& input': {
                                    color: '#fff',
                                    fontSize: '16px',
                                },
                                '& input::placeholder': {
                                    color: 'rgba(255, 255, 255, 0.5)',
                                },
                            },
                        }}
                    />
                )}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                loading={loadingExercises}
                filterOptions={(options, { inputValue }) => {
                    if (!inputValue) {
                        // When no input, show limited results for performance
                        return [
                            ...options.filter(option => option.group !== 'Exercise Database'),
                            ...options.filter(option => option.group === 'Exercise Database').slice(0, 50)
                        ];
                    }

                    // When user types, search through ALL exercises
                    const filtered = options.filter(option =>
                        option.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.target?.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.bodyPart?.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.equipment?.toLowerCase().includes(inputValue.toLowerCase())
                    );

                    // Sort by relevance: exact matches first, then starts with, then contains
                    const sorted = filtered.sort((a, b) => {
                        const aName = a.name?.toLowerCase() || '';
                        const bName = b.name?.toLowerCase() || '';
                        const input = inputValue.toLowerCase();

                        // Exact match
                        if (aName === input) return -1;
                        if (bName === input) return 1;

                        // Starts with
                        if (aName.startsWith(input) && !bName.startsWith(input)) return -1;
                        if (bName.startsWith(input) && !aName.startsWith(input)) return 1;

                        // Priority order (saved > history > template > api)
                        return a.priority - b.priority;
                    });

                    // Limit results for performance (but show more when searching)
                    return sorted.slice(0, 200);
                }}
                loadingText={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <CircularProgress size={20} sx={{ color: '#00ff9f' }} />
                        <Typography sx={{ color: '#fff' }}>Loading exercises...</Typography>
                    </Box>
                }
                noOptionsText={
                    <Typography sx={{ color: 'text.secondary', p: 2 }}>
                        No exercises found. Type to add a new exercise.
                    </Typography>
                }
                sx={{
                    '& .MuiAutocomplete-paper': {
                        backgroundColor: '#1e1e1e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    '& .MuiAutocomplete-listbox': {
                        maxHeight: '400px',
                    },
                    '& .MuiAutocomplete-groupLabel': {
                        backgroundColor: 'rgba(0, 255, 159, 0.1)',
                        color: '#00ff9f',
                        fontWeight: '600',
                        fontSize: '12px',
                        padding: '8px 16px',
                    },
                }}
            />
        </Box>
    );
} 