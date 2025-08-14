import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    CircularProgress,
    Tabs,
    Tab,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
    Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdFitnessCenter } from 'react-icons/md';
import { fetchExercises, fetchExercisesByBodyPart } from '../../services/exerciseAPI';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
        },
        '&:hover fieldset': {
            borderColor: '#00ff9f',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00ff9f',
        },
    },
    '& label.Mui-focused': {
        color: '#00ff9f',
    },
});

// Loading indicator component for infinite scroll
const InfiniteScrollLoader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
    background: 'rgba(0, 255, 159, 0.05)',
    borderRadius: '12px',
    margin: '1rem 0',
    backdropFilter: 'blur(5px)',
}));

export default function ExerciseLibrary() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 20; // Increased for better infinite scroll experience
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Ref for the intersection observer target
    const loadMoreRef = useRef(null);
    const observerRef = useRef(null);

    const bodyParts = [
        'all',
        'Abs',
        'Arms',
        'Back',
        'Calves',
        'Cardio',
        'Chest',
        'Legs',
        'Shoulders'
    ];

    // Memoized load function to prevent infinite loops
    const loadExercises = useCallback(async (pageNum = page, isInitial = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        setError('');

        try {
            let data;
            if (activeTab === 'all') {
                data = await fetchExercises(ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
            } else {
                data = await fetchExercisesByBodyPart(activeTab, ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE);
            }

            console.log(`📦 Loaded ${data.length} exercises for page ${pageNum}`);

            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
                console.log('🔚 No more exercises to load');
            }

            if (pageNum === 0) {
                setExercises(data);
            } else {
                setExercises(prev => [...prev, ...data]);
            }
        } catch (err) {
            console.error('API Error:', err);
            setError('Error loading exercises. Please try again later.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, page]);

    // Intersection Observer callback
    const handleObserver = useCallback((entries) => {
        const [target] = entries;
        if (target.isIntersecting && !loading && !loadingMore && hasMore) {
            console.log('🚀 Loading more exercises via infinite scroll...');
            setPage(prev => prev + 1);
        }
    }, [loading, loadingMore, hasMore]);

    // Initialize intersection observer
    useEffect(() => {
        const element = loadMoreRef.current;
        const option = {
            root: null,
            rootMargin: '100px', // Start loading when 100px away from bottom
            threshold: 0
        };

        observerRef.current = new IntersectionObserver(handleObserver, option);

        if (element) {
            observerRef.current.observe(element);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    // Load initial exercises when tab changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        loadExercises(0, true);
    }, [activeTab]);

    // Load more exercises when page changes (triggered by intersection)
    useEffect(() => {
        if (page > 0) {
            loadExercises(page, false);
        }
    }, [page, loadExercises]);

    const handleTabChange = (e, newValue) => {
        setActiveTab(newValue);
        setSearchTerm(''); // Clear search when changing tabs
    };

    const handleExerciseClick = (exercise) => {
        // Ensure images are unique and ordered: main first, then others
        const normalized = { ...exercise };
        if (Array.isArray(normalized.images)) {
            const ordered = normalized.images
                .slice()
                .sort((a, b) => (b.is_main === true) - (a.is_main === true));
            normalized.images = ordered;
        }
        navigate(`/workout/exercise/${exercise.id}`, { state: { exercise: normalized } });
    };

    const filteredExercises = Array.isArray(exercises) ? exercises.filter(exercise =>
        exercise?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise?.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise?.equipment?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold', mb: 3 }}>
                    Exercise Library
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', ml: 2 }}>
                        ({filteredExercises.length} exercises)
                    </Typography>
                </Typography>

                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        <TextField
                            fullWidth
                            placeholder="Search exercises..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                '& .MuiInputBase-input': {
                                    color: '#fff',
                                },
                            }}
                        />
                    </CardContent>
                </StyledCard>

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#00ff9f !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#00ff9f' },
                        }}
                    >
                        {bodyParts.map((part) => (
                            <Tab key={part} label={part} value={part} />
                        ))}
                    </Tabs>
                </StyledCard>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress sx={{ color: '#00ff9f' }} />
                        <Typography sx={{ color: '#fff', ml: 2 }}>
                            Loading exercises...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Typography variant="body1" sx={{ color: '#ff4444' }}>
                        {error}
                    </Typography>
                ) : (
                    <>
                        <StyledCard>
                            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                                Exercise Name
                                            </TableCell>
                                            <TableCell sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                                Body Part
                                            </TableCell>
                                            <TableCell sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                                Target
                                            </TableCell>
                                            <TableCell sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                                Equipment
                                            </TableCell>
                                            <TableCell sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                                Difficulty
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredExercises.map((exercise, index) => (
                                            <Fade
                                                key={exercise.id}
                                                in={true}
                                                timeout={300}
                                                style={{ transitionDelay: `${index % 20 * 50}ms` }}
                                            >
                                                <TableRow
                                                    onClick={() => handleExerciseClick(exercise)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                            transform: 'scale(1.01)',
                                                            transition: 'all 0.2s ease-in-out',
                                                        },
                                                        '& td': {
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                                            color: '#fff',
                                                        }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <MdFitnessCenter size={20} color="#00ff9f" />
                                                            <Typography sx={{ color: '#fff' }}>
                                                                {exercise.name}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={exercise.bodyPart}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                                color: '#00ff9f',
                                                                textTransform: 'capitalize'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textTransform: 'capitalize' }}>
                                                        {exercise.target}
                                                    </TableCell>
                                                    <TableCell sx={{ textTransform: 'capitalize' }}>
                                                        {exercise.equipment}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={exercise.difficulty || 'Standard'}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: exercise.difficulty === 'beginner' ? 'rgba(76, 175, 80, 0.2)' :
                                                                    exercise.difficulty === 'intermediate' ? 'rgba(255, 193, 7, 0.2)' :
                                                                        exercise.difficulty === 'expert' ? 'rgba(244, 67, 54, 0.2)' :
                                                                            'rgba(158, 158, 158, 0.2)',
                                                                color: exercise.difficulty === 'beginner' ? '#4caf50' :
                                                                    exercise.difficulty === 'intermediate' ? '#ffc107' :
                                                                        exercise.difficulty === 'expert' ? '#f44336' :
                                                                            '#9e9e9e',
                                                                textTransform: 'capitalize'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            </Fade>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </StyledCard>

                        {/* Infinite Scroll Loading Indicator */}
                        {loadingMore && (
                            <Fade in={loadingMore}>
                                <InfiniteScrollLoader>
                                    <CircularProgress size={24} sx={{ color: '#00ff9f', mr: 2 }} />
                                    <Typography sx={{ color: '#00ff9f', fontWeight: 500 }}>
                                        Loading more exercises...
                                    </Typography>
                                </InfiniteScrollLoader>
                            </Fade>
                        )}

                        {/* Intersection Observer Target */}
                        {hasMore && !loadingMore && (
                            <div
                                ref={loadMoreRef}
                                style={{
                                    height: '20px',
                                    margin: '20px 0',
                                    background: 'transparent'
                                }}
                            />
                        )}

                        {/* End of Results Message */}
                        {!hasMore && exercises.length > 0 && (
                            <Fade in={!hasMore}>
                                <Box sx={{
                                    textAlign: 'center',
                                    py: 3,
                                    background: 'rgba(0, 255, 159, 0.05)',
                                    borderRadius: 2,
                                    mt: 2
                                }}>
                                    <Typography sx={{ color: '#00ff9f', fontWeight: 500 }}>
                                        🎉 You've reached the end! {exercises.length} exercises loaded.
                                    </Typography>
                                </Box>
                            </Fade>
                        )}
                    </>
                )}
            </div>
        </Box>
    );
}