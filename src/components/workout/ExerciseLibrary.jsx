import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
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
    Grid
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
    const navigate = useNavigate();

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

    const handleExerciseClick = (exercise) => {
        navigate(`/workout/exercise/${exercise.id}`, { state: { exercise } });
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
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </StyledCard>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && (
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
                                    {filteredExercises.map((exercise) => (
                                        <TableRow
                                            key={exercise.id}
                                            onClick={() => handleExerciseClick(exercise)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
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
                                                    label={exercise.difficulty}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: exercise.difficulty === 'beginner' ? 'rgba(76, 175, 80, 0.2)' :
                                                                        exercise.difficulty === 'intermediate' ? 'rgba(255, 193, 7, 0.2)' :
                                                                        'rgba(244, 67, 54, 0.2)',
                                                        color: exercise.difficulty === 'beginner' ? '#4caf50' :
                                                               exercise.difficulty === 'intermediate' ? '#ffc107' :
                                                               '#f44336',
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </StyledCard>
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