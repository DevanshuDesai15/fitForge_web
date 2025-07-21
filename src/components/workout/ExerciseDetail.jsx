import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Grid2,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdArrowBack,
    MdFitnessCenter,
    MdGpsFixed,
    MdBuild,
    MdSignalCellular1Bar,
    MdSignalCellular2Bar,
    MdSignalCellular4Bar,
    MdList
} from 'react-icons/md';
import { fetchExerciseImage } from '../../services/exerciseAPI';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

export default function ExerciseDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const exercise = location.state?.exercise;
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const loadExerciseImage = async () => {
            if (exercise?.id) {
                try {
                    setImageLoading(true);
                    setImageError(false);
                    const url = await fetchExerciseImage(exercise.id, '720');
                    setImageUrl(url);
                } catch (error) {
                    console.error('Failed to load exercise image:', error);
                    setImageError(true);
                } finally {
                    setImageLoading(false);
                }
            }
        };

        loadExerciseImage();

        // Cleanup function to revoke object URL
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [exercise?.id]);

    if (!exercise) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Typography variant="h6" sx={{ color: '#ff4444' }}>
                    Exercise not found
                </Typography>
            </Box>
        );
    }

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return <MdSignalCellular1Bar />;
            case 'intermediate':
                return <MdSignalCellular2Bar />;
            case 'expert':
                return <MdSignalCellular4Bar />;
            default:
                return <MdSignalCellular1Bar />;
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return '#4caf50';
            case 'intermediate':
                return '#ffc107';
            case 'expert':
                return '#f44336';
            default:
                return '#4caf50';
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Button
                    startIcon={<MdArrowBack />}
                    onClick={() => navigate('/workout/library')}
                    sx={{
                        mb: 3,
                        color: '#00ff9f',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                        },
                    }}
                >
                    Back to Exercise Library
                </Button>

                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <MdFitnessCenter size={32} color="#00ff9f" />
                            <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                {exercise.name}
                            </Typography>
                        </Box>

                        <Grid2 container spacing={3}>
                            <Grid2 xs={12} md={8}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdGpsFixed /> Exercise Details
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', minWidth: '100px' }}>
                                                Body Part:
                                            </Typography>
                                            <Chip
                                                label={exercise.bodyPart}
                                                sx={{
                                                    backgroundColor: 'rgba(0, 255, 159, 0.2)',
                                                    color: '#00ff9f',
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', minWidth: '100px' }}>
                                                Target:
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                                                {exercise.target}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', minWidth: '100px' }}>
                                                Equipment:
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <MdBuild color="#00ff9f" />
                                                <Typography variant="body1" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                                                    {exercise.equipment}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', minWidth: '100px' }}>
                                                Difficulty:
                                            </Typography>
                                            <Chip
                                                icon={getDifficultyIcon(exercise.difficulty)}
                                                label={exercise.difficulty}
                                                sx={{
                                                    backgroundColor: `${getDifficultyColor(exercise.difficulty)}20`,
                                                    color: getDifficultyColor(exercise.difficulty),
                                                    textTransform: 'capitalize',
                                                    '& .MuiChip-icon': {
                                                        color: getDifficultyColor(exercise.difficulty)
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', minWidth: '100px' }}>
                                                Category:
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                                                {exercise.category}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid2>

                            <Grid2 xs={12} md={4}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                        Exercise Demonstration
                                    </Typography>
                                    <Box sx={{
                                        width: '100%',
                                        height: '300px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        overflow: 'hidden'
                                    }}>
                                        {imageLoading ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <CircularProgress sx={{ color: '#00ff9f' }} />
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Loading demonstration...
                                                </Typography>
                                            </Box>
                                        ) : imageError ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <MdFitnessCenter size={48} color="rgba(255, 255, 255, 0.3)" />
                                                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                                                    Demonstration not available
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <img
                                                src={imageUrl}
                                                alt={`${exercise.name} demonstration`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '12px'
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                            Secondary Muscles
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {exercise.secondaryMuscles.map((muscle, index) => (
                                                <Chip
                                                    key={index}
                                                    label={muscle}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        color: '#fff',
                                                        textTransform: 'capitalize'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Grid2>
                        </Grid2>

                        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

                        {exercise.description && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2 }}>
                                    Description
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                    {exercise.description}
                                </Typography>
                            </Box>
                        )}

                        {exercise.instructions && exercise.instructions.length > 0 && (
                            <Box>
                                <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdList /> Instructions
                                </Typography>
                                <List>
                                    {exercise.instructions.map((instruction, index) => (
                                        <ListItem key={index} sx={{ pl: 0 }}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#00ff9f',
                                                                fontWeight: 'bold',
                                                                minWidth: '30px'
                                                            }}
                                                        >
                                                            {index + 1}.
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                                            {instruction}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
}