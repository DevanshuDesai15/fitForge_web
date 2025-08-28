import { useState, useEffect, useCallback } from 'react';
import {
    TextField,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Chip,
    CircularProgress,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Divider
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    MdSearch,
    MdFavorite,
    MdHistory,
    MdClose,
    MdArrowDropDown
} from 'react-icons/md';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { fetchExercisesByName } from '../../services/localExerciseService';

const SearchContainer = styled(Box)(() => ({
    position: 'relative',
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        backgroundColor: theme.palette.surface.transparent,
        borderRadius: '12px',
        '& fieldset': {
            borderColor: theme.palette.border.main,
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: theme.palette.border.primary,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px',
        },
        '& input': {
            color: theme.palette.text.primary,
            fontSize: '16px',
        },
        '& .MuiInputAdornment-root': {
            color: theme.palette.primary.main,
        },
    },
    '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
        '&.Mui-focused': {
            color: theme.palette.primary.main,
        },
    },
}));

const SuggestionsList = styled(Paper)(({ theme }) => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 99999, // Much higher z-index to appear above all dialogs and modals
    minHeight: '60px', // Ensure minimum height
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: theme.palette.background?.paper || '#2a2a2a', // Solid background color
    borderRadius: '12px',
    border: `1px solid ${theme.palette.border?.main || 'rgba(255, 255, 255, 0.2)'}`,
    boxShadow: `0 16px 60px rgba(0, 0, 0, 0.4)`,
    marginTop: '4px', // Small gap between input and dropdown
    // Ensure it doesn't get clipped by parent containers
    willChange: 'transform',
    transform: 'translateZ(0)',
    // Add backdrop blur and solid background to prevent see-through
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    // Ensure completely opaque background
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.palette.background?.paper || '#2a2a2a',
        borderRadius: '12px',
        zIndex: -1,
    }
}));

const SuggestionItem = styled(ListItem)(({ theme }) => ({
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '4px 8px',
    minHeight: '60px', // Ensure each item has sufficient height
    backgroundColor: 'transparent',
    '&:hover': {
        backgroundColor: theme.palette.surface?.primary || 'rgba(255, 255, 255, 0.08)',
    },
    '&.MuiListItem-root': {
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
    },
}));

export default function ExerciseSelector({
    onExerciseSelect,
    placeholder = "Search exercises...",
    includeHistory = false,
    multiSelect = false,
    open = false,
    onClose,
    sx = {}
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentExercises, setRecentExercises] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]);

    const { currentUser } = useAuth();
    const theme = useTheme();

    const loadRecentExercises = useCallback(async () => {
        if (!currentUser) return;

        try {
            const q = query(
                collection(db, 'exercises'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            const exercises = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'recent'
            }));
            setRecentExercises(exercises);
        } catch (error) {
            console.error('Error loading recent exercises:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        if (includeHistory && currentUser) {
            loadRecentExercises();
        }
    }, [includeHistory, currentUser, loadRecentExercises]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 2 && isDropdownOpen) {
                searchExercises(searchTerm);
            } else if (searchTerm.length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isDropdownOpen]);

    const searchExercises = async (term) => {
        console.log('🔍 Searching exercises for term:', term);
        setLoading(true);
        try {
            const results = await fetchExercisesByName(term);
            console.log('📋 Search results:', results.length, 'exercises found');
            const formattedResults = results.map(exercise => ({
                id: exercise.id,
                name: exercise.name,
                target: exercise.target,
                equipment: exercise.equipment,
                bodyPart: exercise.bodyPart,
                type: 'api'
            }));
            setSuggestions(formattedResults);
            setShowSuggestions(true);
            console.log('✅ Showing suggestions, count:', formattedResults.length);
        } catch (error) {
            console.error('❌ Error searching exercises:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExerciseSelect = (exercise) => {
        console.log('🏋️ Exercise selected:', exercise.name);
        if (multiSelect) {
            if (!selectedExercises.find(ex => ex.id === exercise.id)) {
                setSelectedExercises(prev => [...prev, exercise]);
            }
        } else {
            setSearchTerm(exercise.name);
            setShowSuggestions(false);
            setIsDropdownOpen(false);
            onExerciseSelect(exercise);
        }
    };

    const removeSelectedExercise = (exerciseId) => {
        setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    };

    const handleSubmitSelected = () => {
        selectedExercises.forEach(exercise => onExerciseSelect(exercise));
        setSelectedExercises([]);
        if (onClose) onClose();
    };

    const renderSuggestions = () => {
        console.log('🎭 renderSuggestions called:', {
            showSuggestions,
            suggestionsCount: suggestions.length,
            loading,
            searchTerm
        });

        if ((!showSuggestions || !isDropdownOpen) && !includeHistory) {
            console.log('❌ Not showing suggestions: showSuggestions =', showSuggestions, 'isDropdownOpen =', isDropdownOpen);
            return null;
        }

        if (!isDropdownOpen) {
            console.log('❌ Dropdown not open');
            return null;
        }

        const allSuggestions = [
            ...(includeHistory ? recentExercises : []),
            ...suggestions
        ];

        if (allSuggestions.length === 0) {
            console.log('❌ No suggestions to show, total count:', allSuggestions.length);
            return null;
        }

        console.log('✅ Rendering suggestions dropdown with', allSuggestions.length, 'items');

        return (
            <SuggestionsList>
                <List>
                    {includeHistory && recentExercises.length > 0 && (
                        <>
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
                                    Recent Exercises
                                </Typography>
                            </Box>
                            {recentExercises.map((exercise) => (
                                <SuggestionItem
                                    key={`recent-${exercise.id}`}
                                    onClick={() => handleExerciseSelect({
                                        id: exercise.id,
                                        name: exercise.exerciseName,
                                        type: 'recent'
                                    })}
                                >
                                    <MdHistory style={{ color: theme.palette.primary.main, marginRight: '12px' }} />
                                    <ListItemText
                                        primary={exercise.exerciseName}
                                        secondary={`${exercise.sets} sets × ${exercise.reps} reps`}
                                        primaryTypographyProps={{ color: theme.palette.text.primary }}
                                        secondaryTypographyProps={{ color: theme.palette.text.secondary }}
                                    />
                                </SuggestionItem>
                            ))}
                            {suggestions.length > 0 && <Divider sx={{ my: 1, bgcolor: theme.palette.border.main }} />}
                        </>
                    )}

                    {suggestions.length > 0 && (
                        <>
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
                                    Exercise Database
                                </Typography>
                            </Box>
                            {suggestions.map((exercise) => (
                                <SuggestionItem
                                    key={`api-${exercise.id}`}
                                    onClick={() => handleExerciseSelect(exercise)}
                                    onMouseDown={(e) => {
                                        // Prevent the input from losing focus when clicking the suggestion
                                        e.preventDefault();
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                                                {exercise.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                <Chip
                                                    size="small"
                                                    label={exercise.target}
                                                    sx={{
                                                        backgroundColor: theme.palette.surface.secondary,
                                                        color: theme.palette.primary.main,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={exercise.equipment}
                                                    sx={{
                                                        backgroundColor: theme.palette.surface.transparent,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                        <MdFavorite style={{ color: theme.palette.primary.main, fontSize: '16px' }} />
                                    </Box>
                                </SuggestionItem>
                            ))}
                        </>
                    )}

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                        </Box>
                    )}
                </List>
            </SuggestionsList>
        );
    };

    const mainContent = (
        <SearchContainer sx={sx}>
            <StyledTextField
                fullWidth
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={() => {
                    console.log('🎯 Search field clicked, opening dropdown');
                    setIsDropdownOpen(true);
                    if (searchTerm.length >= 2 || recentExercises.length > 0) {
                        setShowSuggestions(true);
                    }
                }}
                onFocus={() => {
                    console.log('🎯 Search field focused');
                    // Don't automatically show suggestions on focus anymore
                }}
                onBlur={() => {
                    // Delay hiding suggestions to allow for selection
                    console.log('🔍 Search field blurred, hiding suggestions in 500ms');
                    setTimeout(() => {
                        console.log('⏱️ Hiding suggestions now');
                        setShowSuggestions(false);
                        setIsDropdownOpen(false);
                    }, 500);
                }}
                InputProps={{
                    startAdornment: <MdSearch style={{ marginRight: '8px', color: theme.palette.primary.main }} />,
                    endAdornment: (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                color: theme.palette.primary.main
                            }
                        }}>
                            <MdArrowDropDown />
                        </Box>
                    )
                }}
            />
            {renderSuggestions()}
        </SearchContainer>
    );

    if (multiSelect && open) {
        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '16px',
                        // Ensure dropdown can overflow the dialog boundaries
                        overflow: 'visible',
                    }
                }}
                sx={{
                    // Allow content to overflow dialog boundaries for dropdowns
                    '& .MuiDialog-container': {
                        overflow: 'visible',
                    },
                    '& .MuiDialog-paper': {
                        overflow: 'visible',
                    }
                }}
            >
                <DialogTitle sx={{ color: theme.palette.primary.main, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Select Exercises
                    <IconButton onClick={onClose} sx={{ color: theme.palette.primary.main }}>
                        <MdClose />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{
                    // Ensure dropdown can overflow dialog content area
                    overflow: 'visible',
                    position: 'relative'
                }}>
                    {mainContent}

                    {selectedExercises.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" sx={{ color: theme.palette.primary.main, mb: 2 }}>
                                Selected Exercises ({selectedExercises.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {selectedExercises.map((exercise) => (
                                    <Chip
                                        key={exercise.id}
                                        label={exercise.name}
                                        onDelete={() => removeSelectedExercise(exercise.id)}
                                        sx={{
                                            backgroundColor: theme.palette.surface.secondary,
                                            color: theme.palette.primary.main,
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitSelected}
                        disabled={selectedExercises.length === 0}
                        sx={{
                            background: theme.palette.background.gradient.button,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                background: theme.palette.background.gradient.buttonHover,
                            },
                        }}
                    >
                        Add Selected ({selectedExercises.length})
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return mainContent;
} 