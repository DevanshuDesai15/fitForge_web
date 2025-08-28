import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    Skeleton,
    Alert,
    Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdClose,
    MdCheckCircle,
    MdTrendingUp,
    MdFitnessCenter,
    MdLightbulb,
    MdWarning,
    MdAutoAwesome
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import progressiveOverloadAI from '../../services/progressiveOverloadAI';
import { getWeightUnit } from '../../utils/weightUnit';
import {
    getExerciseCache,
    setExerciseCache,
    invalidateExerciseCache,
    clearExpiredCache
} from '../../utils/aiSuggestionCache';

// Debounce utility function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const AISuggestionCard = styled(Card)(({ priority }) => ({
    background: priority === 'high'
        ? 'linear-gradient(135deg, rgba(0, 255, 159, 0.12) 0%, rgba(0, 229, 118, 0.06) 100%)'
        : priority === 'medium'
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 193, 7, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(0, 255, 159, 0.05) 0%, rgba(0, 229, 118, 0.02) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: priority === 'high'
        ? '1px solid rgba(0, 255, 159, 0.3)'
        : priority === 'medium'
            ? '1px solid rgba(255, 152, 0, 0.3)'
            : '1px solid rgba(0, 255, 159, 0.1)',
    marginBottom: '1rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: priority === 'high'
            ? '0 8px 25px rgba(0, 255, 159, 0.2)'
            : priority === 'medium'
                ? '0 8px 25px rgba(255, 152, 0, 0.2)'
                : '0 8px 25px rgba(0, 255, 159, 0.1)',
    },
}));

const ConfidenceIndicator = styled(Box)(({ confidence }) => ({
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: confidence >= 0.8
        ? '#4caf50'
        : confidence >= 0.6
            ? '#ff9800'
            : '#f44336',
    boxShadow: `0 0 8px ${confidence >= 0.8 ? '#4caf50' : confidence >= 0.6 ? '#ff9800' : '#f44336'}`,
}));

const SuggestionIcon = ({ type, priority }) => {
    const iconProps = {
        size: 24,
        style: {
            color: priority === 'high'
                ? '#00ff9f'
                : priority === 'medium'
                    ? '#ff9800'
                    : '#64748b'
        }
    };

    switch (type) {
        case 'weight':
        case 'progression':
            return <MdTrendingUp {...iconProps} />;
        case 'deload':
        case 'plateau':
            return <MdWarning {...iconProps} />;
        case 'exercise_variation':
            return <MdFitnessCenter {...iconProps} />;
        case 'rep_range_modification':
            return <MdAutoAwesome {...iconProps} />;
        default:
            return <MdLightbulb {...iconProps} />;
    }
};

const AISuggestionCards = ({
    userId,
    workoutContext = 'home',
    onSuggestionAccept,
    onSuggestionDismiss,
    maxSuggestions = 3,
    showPlateauWarnings = true
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [plateauAlerts, setPlateauAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');
    const [, setDismissedSuggestions] = useState(new Set());

    const { currentUser } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            if (currentUser && userId) {
                await debouncedLoadSuggestions();
            }
            setWeightUnit(getWeightUnit());
        };
        loadData();
    }, [currentUser?.uid]); // Only depend on userId, not workoutContext

    const loadAISuggestions = async () => {
        // Clean expired cache first
        clearExpiredCache();

        setLoading(true);
        setError('');

        try {
            // Load workout suggestions based on context
            let workoutSuggestions = [];

            if (workoutContext === 'start-workout') {
                workoutSuggestions = await progressiveOverloadAI.generateWorkoutSuggestions(
                    userId,
                    { workoutType: 'strength', targetMuscleGroups: [], availableTime: 60 }
                );
            } else {
                // For home screen, get general progression suggestions
                const analyses = await progressiveOverloadAI.analyzeWorkoutHistory(userId);
                console.log('AI Suggestions Debug - Analyses:', analyses);

                if (analyses.length > 0) {
                    const selectedAnalyses = analyses.slice(0, maxSuggestions);

                    // 🚀 SMART CACHING: Check which exercises are already cached
                    const cachedSuggestions = [];
                    const uncachedExerciseIds = [];
                    const uncachedAnalyses = [];

                    selectedAnalyses.forEach(analysis => {
                        const cached = getExerciseCache(userId, analysis.exerciseId);
                        if (cached) {
                            // Use cached suggestion
                            cachedSuggestions.push({
                                ...cached,
                                priority: cached.confidenceLevel >= 0.8 ? 'high' :
                                    cached.confidenceLevel >= 0.6 ? 'medium' : 'low',
                                type: cached.progressionType,
                                aiGenerated: true,
                                fromCache: true
                            });
                        } else {
                            // Need fresh API call
                            uncachedExerciseIds.push(analysis.exerciseId);
                            uncachedAnalyses.push(analysis);
                        }
                    });

                    console.log(`📊 Cache Status: ${cachedSuggestions.length} cached, ${uncachedExerciseIds.length} need API calls`);

                    // Only make API calls for uncached exercises
                    let freshSuggestions = [];
                    if (uncachedExerciseIds.length > 0) {
                        console.log('🔄 Making API call for uncached exercises:', uncachedExerciseIds);

                        const batchProgressions = await progressiveOverloadAI.calculateBatchProgressions(
                            userId,
                            uncachedExerciseIds
                        );

                        freshSuggestions = batchProgressions.map((progression, index) => {
                            const suggestion = {
                                ...progression,
                                priority: progression.confidenceLevel >= 0.8 ? 'high' :
                                    progression.confidenceLevel >= 0.6 ? 'medium' : 'low',
                                type: progression.progressionType,
                                aiGenerated: true,
                                fromCache: false
                            };

                            // Cache the fresh suggestion for 1 hour
                            setExerciseCache(userId, uncachedExerciseIds[index], suggestion);

                            return suggestion;
                        });

                        console.log('✅ Fresh suggestions generated and cached:', freshSuggestions.length);
                    } else {
                        console.log('🎉 ALL suggestions from cache - ZERO API calls needed!');
                    }

                    // Combine cached + fresh suggestions
                    workoutSuggestions = [...cachedSuggestions, ...freshSuggestions];

                    console.log(`✅ Total suggestions: ${workoutSuggestions.length} (${cachedSuggestions.length} from cache, ${freshSuggestions.length} from API)`);
                } else {
                    console.log('No workout history found for suggestions');
                }
            }

            // Load plateau alerts if enabled (these are quick, no need to cache)
            let plateauData = [];
            if (showPlateauWarnings) {
                plateauData = await progressiveOverloadAI.detectPlateaus(userId);
            }

            const filteredSuggestions = workoutSuggestions.filter(s => s.confidenceLevel > 0.5);
            const filteredPlateaus = plateauData.filter(p => p.severity !== 'mild');

            setSuggestions(filteredSuggestions);
            setPlateauAlerts(filteredPlateaus);

        } catch (error) {
            console.error('❌ Error loading AI suggestions:', error);
            setError('Unable to load AI suggestions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debounced version to prevent rapid successive calls
    const debouncedLoadSuggestions = useCallback(
        debounce(loadAISuggestions, 1000),
        [userId, workoutContext, maxSuggestions, showPlateauWarnings]
    );

    const handleAcceptSuggestion = async (suggestion) => {
        try {
            // Track suggestion acceptance
            await progressiveOverloadAI.trackSuggestionInteraction(
                userId,
                suggestion.exerciseId,
                'accepted',
                { suggestion }
            );

            // Invalidate cache for this exercise so next load gets fresh suggestions
            // This is important because accepting a suggestion means user will likely
            // perform the workout and need updated progression
            invalidateExerciseCache(userId, suggestion.exerciseId);

            // Call parent handler
            if (onSuggestionAccept) {
                onSuggestionAccept(suggestion);
            }

            // Remove from suggestions
            setSuggestions(prev => prev.filter(s => s.exerciseId !== suggestion.exerciseId));

            console.log(`✅ Accepted suggestion for ${suggestion.exerciseId} and invalidated cache`);

        } catch (error) {
            console.error('Error accepting suggestion:', error);
        }
    };

    const handleDismissSuggestion = async (suggestion, reason = 'user_dismissed') => {
        try {
            // Track suggestion dismissal
            await progressiveOverloadAI.trackSuggestionInteraction(
                userId,
                suggestion.exerciseId,
                'dismissed',
                { reason }
            );

            // Call parent handler
            if (onSuggestionDismiss) {
                onSuggestionDismiss(suggestion.exerciseId);
            }

            // Add to dismissed set and remove from suggestions
            setDismissedSuggestions(prev => new Set([...prev, suggestion.exerciseId]));
            setSuggestions(prev => prev.filter(s => s.exerciseId !== suggestion.exerciseId));

        } catch (error) {
            console.error('Error dismissing suggestion:', error);
        }
    };

    const formatProgressionText = (suggestion) => {
        switch (suggestion.progressionType) {
            case 'weight':
                return `${suggestion.currentWeight}${weightUnit} → ${suggestion.suggestedWeight}${weightUnit}`;
            case 'reps':
                return `${suggestion.currentReps} → ${suggestion.suggestedReps} reps`;
            case 'deload':
                return `Deload to ${suggestion.suggestedWeight}${weightUnit}`;
            default:
                return `${suggestion.suggestedWeight}${weightUnit} × ${suggestion.suggestedReps} reps`;
        }
    };

    const getProgressionTypeLabel = (type) => {
        switch (type) {
            case 'weight': return 'Weight Increase';
            case 'reps': return 'Rep Increase';
            case 'deload': return 'Deload Week';
            case 'sets': return 'Volume Increase';
            default: return 'Progression';
        }
    };

    if (loading) {
        return (
            <Box>
                {[1, 2, 3].map((i) => (
                    <Card key={i} sx={{ mb: 2, borderRadius: '16px' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Skeleton variant="circular" width={24} height={24} />
                                <Skeleton variant="text" width="60%" height={24} />
                            </Box>
                            <Skeleton variant="text" width="80%" height={20} />
                            <Skeleton variant="text" width="40%" height={20} />
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                                <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="warning"
                sx={{
                    mb: 2,
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    color: 'warning.main',
                    borderRadius: '16px'
                }}
            >
                {error}
            </Alert>
        );
    }

    const hasContent = suggestions.length > 0 || plateauAlerts.length > 0;

    if (!hasContent) {
        return (
            <Card sx={{
                mb: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(0, 255, 159, 0.05) 0%, rgba(0, 229, 118, 0.02) 100%)',
                border: '1px solid rgba(0, 255, 159, 0.1)'
            }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <MdAutoAwesome size={32} style={{ color: '#64748b', marginBottom: '8px' }} />
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                        No AI suggestions available
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Complete more workouts to get personalized recommendations
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box>
            {/* Plateau Alerts */}
            {plateauAlerts.map((plateau) => (
                <Fade in key={plateau.exerciseId}>
                    <AISuggestionCard priority="high">
                        <ConfidenceIndicator confidence={0.9} />
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <MdWarning size={24} style={{ color: '#ff9800' }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                            Plateau Detected
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {plateau.exerciseName}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDismissSuggestion(plateau, 'plateau_dismissed')}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <MdClose size={16} />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                No progress for {plateau.plateauDuration} sessions. Consider intervention.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${plateau.severity} plateau`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255, 152, 0, 0.2)',
                                        color: '#ff9800',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Chip
                                    label={plateau.plateauType}
                                    size="small"
                                    variant="outlined"
                                    sx={{ color: 'text.secondary' }}
                                />
                            </Box>
                        </CardContent>
                    </AISuggestionCard>
                </Fade>
            ))}

            {/* Workout Suggestions */}
            {suggestions.map((suggestion) => (
                <Fade in key={suggestion.exerciseId}>
                    <AISuggestionCard priority={suggestion.priority}>
                        <ConfidenceIndicator confidence={suggestion.confidenceLevel} />
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <SuggestionIcon type={suggestion.type} priority={suggestion.priority} />
                                    <Box>
                                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                            {suggestion.exerciseName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {getProgressionTypeLabel(suggestion.progressionType)}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDismissSuggestion(suggestion)}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <MdClose size={16} />
                                </IconButton>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                                    {formatProgressionText(suggestion)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {suggestion.reasoning}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Confidence
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={suggestion.confidenceLevel * 100}
                                        sx={{
                                            height: 4,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: suggestion.confidenceLevel >= 0.8
                                                    ? '#4caf50'
                                                    : suggestion.confidenceLevel >= 0.6
                                                        ? '#ff9800'
                                                        : '#f44336'
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: '40px' }}>
                                    {Math.round(suggestion.confidenceLevel * 100)}%
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<MdCheckCircle size={16} />}
                                    onClick={() => handleAcceptSuggestion(suggestion)}
                                    sx={{
                                        backgroundColor: 'primary.main',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                        }
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleDismissSuggestion(suggestion)}
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'text.secondary',
                                        '&:hover': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                        }
                                    }}
                                >
                                    Dismiss
                                </Button>
                            </Box>
                        </CardContent>
                    </AISuggestionCard>
                </Fade>
            ))}
        </Box>
    );
};

export default AISuggestionCards;