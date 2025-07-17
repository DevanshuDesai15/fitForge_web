import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Tabs,
    Tab,
    IconButton,
    Dialog,
    Card,
    CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdAdd, MdFavorite, MdFavoriteBorder, MdFitnessCenter } from 'react-icons/md';
import { fetchExercises, fetchExercisesByBodyPart } from '../../services/exerciseAPI';
import { useAuth } from '../../contexts/AuthContext';

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

export default function ExerciseLibrary() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 10;
    const { currentUser } = useAuth();

    const bodyParts = [
        'all',
        'back',
        'cardio',
        'chest',
        'lower arms',
        'lower legs',
        'neck',
        'shoulders',
        'upper arms',
        'upper legs',
        'waist'
    ];

    useEffect(() => {
        loadExercises();
    }, [activeTab]);

    useEffect(() => {
        if (page > 0) {
            loadExercises();
        }
    }, [page]);

    const loadExercises = async () => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (activeTab === 'all') {
                data = await fetchExercises(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
            } else {
                data = await fetchExercisesByBodyPart(activeTab, ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
            }
            console.log('Fetched exercises:', data);
            console.log('Sample exercise with gifUrl:', data[0]);

            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }

            if (page === 0) {
                setExercises(data);
            } else {
                setExercises(prev => [...prev, ...data]);
            }
        } catch (err) {
            console.error('API Error:', err);
            setError('Error loading exercises. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const handleTabChange = (e, newValue) => {
        setActiveTab(newValue);
        setPage(0);
        setHasMore(true);
        setSearchTerm(''); // Clear search when changing tabs
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
                    </Box>
                ) : error ? (
                    <Typography variant="body1" sx={{ color: '#ff4444' }}>
                        {error}
                    </Typography>
                ) : (
                    <Grid container spacing={3}>
                        {filteredExercises.map((exercise) => (
                            <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                                <StyledCard>
                                    <CardContent>
                                        <Box sx={{ position: 'relative' }}>
                                            {exercise.gifUrl && (
                                                <img
                                                    src={exercise.gifUrl}
                                                    alt={exercise.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '200px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        marginBottom: '1rem'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.parentNode.innerHTML = `
                                                            <div style="
                                                                width: 100%;
                                                                height: 200px;
                                                                background-color: rgba(255, 255, 255, 0.1);
                                                                border-radius: 8px;
                                                                margin-bottom: 1rem;
                                                                display: flex;
                                                                align-items: center;
                                                                justify-content: center;
                                                                flex-direction: column;
                                                                gap: 8px;
                                                            ">
                                                                <div style="font-size: 48px; color: rgba(255, 255, 255, 0.3);">💪</div>
                                                                <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">${exercise.category || 'Exercise'}</div>
                                                            </div>
                                                        `;
                                                    }}
                                                                width: 100%;
                                                                height: 200px;
                                                                background-color: rgba(255, 255, 255, 0.1);
                                                                border-radius: 8px;
                                                                margin-bottom: 1rem;
                                                                display: flex;
                                                                align-items: center;
                                                                justify-content: center;
                                                                flex-direction: column;
                                                                gap: 8px;
                                                            ">
                                                                <div style="font-size: 48px; color: rgba(255, 255, 255, 0.3);">💪</div>
                                                                <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">${exercise.category || 'Exercise'}</div>
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                            )}
                                            {!exercise.gifUrl && (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '200px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px',
                                                        marginBottom: '1rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexDirection: 'column',
                                                        gap: 1
                                                    }}
                                                >
                                                    <MdFitnessCenter size={48} color="rgba(255, 255, 255, 0.3)" />
                                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                        {exercise.category || 'Exercise'}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {exercise.name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                            Category: {exercise.category}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                            Target: {exercise.target}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Equipment: {exercise.equipment}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Difficulty: {exercise.difficulty}
                                        </Typography>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<MdAdd />}
                                            sx={{
                                                mt: 2,
                                                borderColor: '#00ff9f',
                                                color: '#00ff9f',
                                                '&:hover': {
                                                    borderColor: '#00e676',
                                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                },
                                            }}
                                        >
                                            Add to Library
                                        </Button>
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && hasMore && (
                    <Button
                        onClick={loadMore}
                        fullWidth
                        sx={{
                            mt: 3,
                            color: '#00ff9f',
                            borderColor: '#00ff9f',
                            '&:hover': {
                                borderColor: '#00ff9f',
                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                            },
                        }}
                        variant="outlined"
                    >
                        Load More
                    </Button>
                )}
            </div>
        </Box>
    );
}