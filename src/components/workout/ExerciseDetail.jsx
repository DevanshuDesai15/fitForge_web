import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Chip,
    Grid2
} from '@mui/material';
import {
    MdArrowBack,
    MdFitnessCenter,
    MdBuild,
    MdSignalCellular1Bar,
    MdSignalCellular2Bar,
    MdSignalCellular4Bar,
    MdPlayCircle,
    MdInfo,
    MdList
} from 'react-icons/md';
import { fetchExerciseImages } from '../../services/localExerciseService';
import { useTheme } from '@mui/material/styles';

export default function ExerciseDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const exercise = location.state?.exercise;
    // These are kept for compatibility with existing image loading logic
    // but not actively used in this simplified design
    const [, setImageUrl] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const intervalRef = useRef(null);
    const [, setCurrentFrame] = useState(0);
    const [, setImageLoading] = useState(true);
    const [, setImageError] = useState(false);

    // Load exercise images when component mounts or exercise changes
    useEffect(() => {
        let cancelled = false;

        const loadExerciseImage = async () => {
            if (!exercise?.id) {
                setImageLoading(false);
                return;
            }

            try {
                setImageLoading(true);
                setImageError(false);

                const inlineImages = Array.isArray(exercise.images) ? exercise.images : [];
                if (inlineImages.length > 0) {
                    const sorted = inlineImages
                        .slice()
                        .sort((a, b) => (b.is_main === true) - (a.is_main === true))
                        .map((img) => img.image)
                        .filter(Boolean);
                    if (!cancelled && sorted.length > 0) {
                        setImageUrls(sorted);
                        setImageUrl(sorted[0]);
                        setImageLoading(false);
                        return;
                    }
                }

                if (typeof exercise.id === 'string' && exercise.id.startsWith('wger-')) {
                    const results = await fetchExerciseImages(exercise.id);
                    const fetched = results.map((r) => r.url).filter(Boolean);
                    if (!cancelled) {
                        if (fetched.length > 0) {
                            setImageUrls(fetched);
                            const apiImage = results.find((img) => img.isMain)?.url || fetched[0] || null;
                            setImageUrl(apiImage);
                        } else {
                            setImageUrl(null);
                            setImageUrls([]);
                        }
                    }
                } else if (!cancelled) {
                    setImageUrl(null);
                    setImageUrls([]);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load exercise image:', error);
                    setImageError(true);
                }
            } finally {
                if (!cancelled) setImageLoading(false);
            }
        };

        loadExerciseImage();

        return () => {
            cancelled = true;
        };
    }, [exercise?.id, exercise?.images]);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (imageUrls && imageUrls.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentFrame((prev) => (prev + 1) % imageUrls.length);
            }, 900);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [imageUrls]);

    const getDifficultyIcon = (difficulty) => {
        const level = difficulty?.toLowerCase();
        switch (level) {
            case 'beginner':
                return <MdSignalCellular1Bar />;
            case 'intermediate':
                return <MdSignalCellular2Bar />;
            case 'expert':
            case 'advanced':
                return <MdSignalCellular4Bar />;
            default:
                return <MdSignalCellular1Bar />;
        }
    };

    const getDifficultyColor = (difficulty) => {
        const level = difficulty?.toLowerCase();
        switch (level) {
            case 'beginner':
                return theme.palette.difficulty?.beginner || '#dded00';
            case 'intermediate':
                return theme.palette.difficulty?.intermediate || '#edf377';
            case 'expert':
            case 'advanced':
                return theme.palette.difficulty?.expert || '#ef4444';
            default:
                return theme.palette.difficulty?.beginner || '#dded00';
        }
    };

    if (!exercise) {
        return (
            <Box sx={{
                minHeight: '100vh',
                background: '#121212',
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

    return (
        <Box sx={{
            minHeight: '100vh',
            background: theme.palette.background?.gradient?.primary || 'linear-gradient(135deg, #121212 0%, #282828 50%, #3f3f3f 100%)',
        }}>
            <Box sx={{ maxWidth: '100%', mx: 'auto', px: { xs: 2, sm: 3, md: 4, lg: 6 }, py: { xs: 2, sm: 3 } }}>
                {/* Back Button */}
                <Button
                    startIcon={<MdArrowBack />}
                    onClick={() => navigate('/workout/library')}
                    sx={{
                        mb: 2,
                        color: theme.palette.primary.main,
                        fontWeight: '500',
                        '&:hover': {
                            backgroundColor: theme.palette.surface?.primary || 'rgba(221, 237, 0, 0.06)',
                        },
                    }}
                >
                    Back to Exercise Library
                </Button>

                {/* Header Section */}
                <Box sx={{
                    borderRadius: '24px',
                    p: { xs: 3, sm: 4, md: 5 },
                    mb: 3,
                    // border: `1px solid ${theme.palette.border?.primary || 'rgba(221, 237, 0, 0.28)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Grid2 container spacing={{ xs: 3, md: 4 }} alignItems="center">
                        {/* Left Content */}
                        <Grid2 xs={12} lg={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    background: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MdFitnessCenter size={20} color="#121212" />
                                </Box>
                                <Typography variant="body2" sx={{
                                    color: '#c4c4c4',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    fontWeight: '600',
                                    fontSize: '0.75rem'
                                }}>
                                    {exercise.exercise_types?.join(' • ') || 'Strength Training'}
                                </Typography>
                            </Box>

                            <Typography variant="h1" sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                mb: 3,
                                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem', lg: '3rem' },
                                lineHeight: 1.1
                            }}>
                                {exercise.name}
                            </Typography>

                            {/* Quick Stats Row */}
                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: { xs: 1.5, sm: 2 },
                                mb: 4
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid rgba(255, 255, 255, 0.08)`
                                }}>
                                    <Typography variant="body2" sx={{ color: '#d6d6d6', fontWeight: '600' }}>
                                        Body Part:
                                    </Typography>
                                    <Chip
                                        label={exercise.bodyPart}
                                        size="small"
                                        sx={{
                                            backgroundColor: theme.palette.surface?.primary || 'rgba(221, 237, 0, 0.06)',
                                            color: theme.palette.primary.main,
                                            textTransform: 'capitalize',
                                            fontWeight: '600',
                                            height: '24px',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid rgba(255, 255, 255, 0.08)`
                                }}>
                                    <MdBuild color={theme.palette.primary.main} size={14} />
                                    <Typography variant="body2" sx={{
                                        color: '#ffffff',
                                        textTransform: 'capitalize',
                                        fontWeight: '500',
                                        fontSize: '0.8rem'
                                    }}>
                                        {exercise.equipment}
                                    </Typography>
                                </Box>

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid rgba(255, 255, 255, 0.08)`
                                }}>
                                    <Chip
                                        icon={getDifficultyIcon(exercise.difficulty)}
                                        label={exercise.difficulty}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${getDifficultyColor(exercise.difficulty)}20`,
                                            color: getDifficultyColor(exercise.difficulty),
                                            textTransform: 'capitalize',
                                            fontWeight: '600',
                                            height: '24px',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-icon': {
                                                color: getDifficultyColor(exercise.difficulty),
                                                fontSize: '16px'
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Target Muscle */}
                            <Box sx={{
                                p: { xs: 2.5, sm: 3 },
                                borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid rgba(255, 255, 255, 0.1)`
                            }}>
                                <Typography variant="body2" sx={{
                                    color: '#d6d6d6',
                                    mb: 1,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: '600',
                                    fontSize: '0.7rem'
                                }}>
                                    Primary Target
                                </Typography>
                                <Typography variant="body1" sx={{
                                    color: '#ffffff',
                                    textTransform: 'capitalize',
                                    fontWeight: '600',
                                    fontSize: { xs: '1rem', sm: '1.1rem' }
                                }}>
                                    {exercise.target}
                                </Typography>
                            </Box>
                        </Grid2>

                        {/* Right - Video */}
                        <Grid2 xs={12} lg={4}>
                            <Box sx={{
                                width: '100%',
                                height: { xs: '280px', sm: '320px', md: '380px', lg: '420px' },
                                backgroundColor: theme.palette.surface?.variants?.a10 || '#282828',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px solid ${theme.palette.border?.primary || 'rgba(221, 237, 0, 0.28)'}`,
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: `0 12px 40px ${theme.palette.surface?.primary || 'rgba(221, 237, 0, 0.15)'}`
                            }}>
                                {exercise.video_urls && (exercise.video_urls['720p'] || exercise.video_urls['480p']) ? (
                                    <>
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            zIndex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '8px',
                                            background: 'rgba(0, 0, 0, 0.7)',
                                        }}>
                                            <MdPlayCircle size={14} color={theme.palette.primary.main} />
                                            <Typography variant="body2" sx={{
                                                color: theme.palette.primary.main,
                                                fontSize: '0.7rem',
                                                fontWeight: '600'
                                            }}>
                                                HD
                                            </Typography>
                                        </Box>
                                        <video
                                            src={exercise.video_urls['720p'] || exercise.video_urls['480p']}
                                            controls
                                            loop
                                            muted
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                if (exercise.video_urls['480p'] && e.target.src !== exercise.video_urls['480p']) {
                                                    e.target.src = exercise.video_urls['480p'];
                                                }
                                            }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <MdFitnessCenter size={48} color="rgba(255, 255, 255, 0.3)" />
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                                            Video not available
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Muscle Groups */}
                            {((exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) ||
                                (exercise.muscles && exercise.muscles.length > 1) ||
                                (exercise.muscle_groups && exercise.muscle_groups.length > 1)) && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="body2" sx={{
                                            color: '#d6d6d6',
                                            mb: 2,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontWeight: '600',
                                            fontSize: '0.7rem'
                                        }}>
                                            All Muscles Targeted
                                        </Typography>
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                            {(exercise.muscle_groups || exercise.muscles || exercise.secondaryMuscles || []).map((muscle, index) => (
                                                <Chip
                                                    key={index}
                                                    label={muscle}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                        color: '#ffffff',
                                                        textTransform: 'capitalize',
                                                        fontWeight: '500',
                                                        fontSize: '0.7rem',
                                                        height: '24px'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                        </Grid2>
                    </Grid2>
                </Box>

                {/* Full-width Content Sections */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Description Section - Full Width */}
                    {exercise.description && (
                        <Box sx={{
                            p: { xs: 3, sm: 4, md: 5 },
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                            border: `1px solid ${theme.palette.border?.main || 'rgba(255, 255, 255, 0.08)'}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '8px',
                                    background: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MdInfo size={16} color="#121212" />
                                </Box>
                                <Typography variant="h5" sx={{
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                }}>
                                    About This Exercise
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{
                                color: '#c4c4c4',
                                lineHeight: 1.7,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                maxWidth: 'none'
                            }}>
                                {exercise.description}
                            </Typography>
                        </Box>
                    )}

                    {/* Instructions Section - Full Width with Grid Layout */}
                    {((exercise.instructions && exercise.instructions.length > 0) || (exercise.steps && exercise.steps.length > 0)) && (
                        <Box sx={{
                            p: { xs: 3, sm: 4, md: 5 },
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                            border: `1px solid ${theme.palette.border?.main || 'rgba(255, 255, 255, 0.08)'}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '8px',
                                    background: theme.palette.primary.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <MdList size={16} color="#121212" />
                                </Box>
                                <Typography variant="h5" sx={{
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                }}>
                                    Step-by-Step Guide
                                </Typography>
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    lg: 'repeat(3, 1fr)'
                                },
                                gap: { xs: 2.5, sm: 3, md: 3.5 },
                                mt: 2
                            }}>
                                {(exercise.steps || exercise.instructions || []).map((instruction, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            p: { xs: 2.5, sm: 3 },
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                            border: `1px solid rgba(255, 255, 255, 0.1)`,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            minHeight: '70px',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)',
                                                borderColor: theme.palette.primary.main,
                                                transform: 'translateY(-4px)',
                                                boxShadow: `0 12px 40px ${theme.palette.primary.main}20`
                                            }
                                        }}
                                    >
                                        {/* Step Number */}
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            mb: 2
                                        }}>
                                            <Box sx={{
                                                minWidth: '36px',
                                                height: '36px',
                                                borderRadius: '12px',
                                                background: '#ffffff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 4px 16px ${theme.palette.primary.main}30`
                                            }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: '#121212',
                                                        fontWeight: '700',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {index + 1}
                                                </Typography>
                                            </Box>
                                            {/* Step Content */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#c4c4c4',
                                                    lineHeight: 1.65,
                                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                                    flex: 1,
                                                    fontWeight: '400'
                                                }}
                                            >
                                                {instruction}
                                            </Typography>
                                        </Box>

                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}