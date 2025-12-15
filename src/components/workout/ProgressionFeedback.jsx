import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Chip,
    Alert,
    Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdTrendingUp,
    MdTrendingDown,
    MdTrendingFlat,
    MdLightbulb,
    MdTimer
} from 'react-icons/md';
import progressiveOverloadAI from '../../services/progressiveOverloadAI';

const ProgressionCard = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.08) 0%, rgba(221, 237, 0, 0.04) 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(221, 237, 0, 0.2)',
    padding: '12px',
    marginTop: '12px',
    transition: 'all 0.3s ease',
}));

const ProgressionFeedback = ({ exercise, exerciseIndex, userId, weightUnit }) => {
    const [progressionData, setProgressionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        if (userId && exercise.name) {
            loadProgressionData();
        }
    }, [userId, exercise.name, exercise.sets]);

    const loadProgressionData = async () => {
        setLoading(true);
        try {
            const progression = await progressiveOverloadAI.calculateNextProgression(
                userId,
                exercise.name
            );

            if (progression && progression.confidenceLevel > 0.3) {
                setProgressionData(progression);
                setShowFeedback(true);
            } else {
                setShowFeedback(false);
            }
        } catch (error) {
            console.log('Progression feedback unavailable:', error.message);
            setShowFeedback(false);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPerformance = () => {
        if (!exercise.sets || exercise.sets.length === 0) return null;

        const maxWeight = Math.max(...exercise.sets.map(set => parseFloat(set.weight) || 0));
        const maxReps = Math.max(...exercise.sets.map(set => parseInt(set.reps) || 0));
        const totalVolume = exercise.sets.reduce((sum, set) =>
            sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0
        );

        return { maxWeight, maxReps, totalVolume };
    };

    const getProgressionIcon = (type) => {
        switch (type) {
            case 'weight':
            case 'improving':
                return <MdTrendingUp style={{ color: '#4caf50' }} />;
            case 'deload':
            case 'declining':
                return <MdTrendingDown style={{ color: '#ff9800' }} />;
            case 'maintaining':
                return <MdTrendingFlat style={{ color: '#64748b' }} />;
            default:
                return <MdLightbulb style={{ color: '#dded00' }} />;
        }
    };

    const getProgressionMessage = () => {
        if (!progressionData) return null;

        const current = getCurrentPerformance();
        if (!current) return null;

        const { maxWeight, maxReps, totalVolume } = current;

        // Compare current performance with AI suggestions
        const weightDiff = maxWeight - progressionData.currentWeight;
        const repsDiff = maxReps - progressionData.currentReps;

        if (weightDiff > 0) {
            return {
                type: 'success',
                message: `🚀 Excellent! You're lifting ${weightDiff}${weightUnit} more than your previous best.`,
                impact: 'Accelerated progression timeline'
            };
        } else if (maxWeight === progressionData.suggestedWeight) {
            return {
                type: 'info',
                message: `🎯 Perfect! This matches our AI recommendation.`,
                impact: 'On track for optimal progression'
            };
        } else if (repsDiff > 0) {
            return {
                type: 'success',
                message: `💪 Great! ${repsDiff} more reps than your previous session.`,
                impact: 'Building strength endurance'
            };
        } else {
            return {
                type: 'warning',
                message: `Consider increasing to ${progressionData.suggestedWeight}${weightUnit} for optimal progression.`,
                impact: progressionData.reasoning
            };
        }
    };

    if (loading || !showFeedback || !progressionData) {
        return null;
    }

    const progressionMessage = getProgressionMessage();

    return (
        <Collapse in={showFeedback}>
            <ProgressionCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getProgressionIcon(progressionData.progressionType)}
                    <Typography variant="subtitle2" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                        Progression Feedback
                    </Typography>
                    <Chip
                        size="small"
                        label={`${Math.round(progressionData.confidenceLevel * 100)}% confidence`}
                        sx={{
                            backgroundColor: progressionData.confidenceLevel >= 0.8
                                ? 'rgba(76, 175, 80, 0.2)'
                                : progressionData.confidenceLevel >= 0.6
                                    ? 'rgba(255, 152, 0, 0.2)'
                                    : 'rgba(244, 67, 54, 0.2)',
                            color: progressionData.confidenceLevel >= 0.8
                                ? '#4caf50'
                                : progressionData.confidenceLevel >= 0.6
                                    ? '#ff9800'
                                    : '#f44336',
                            fontSize: '0.7rem',
                            height: '20px'
                        }}
                    />
                </Box>

                {progressionMessage && (
                    <Alert
                        severity={progressionMessage.type}
                        sx={{
                            mb: 1,
                            backgroundColor: `rgba(${progressionMessage.type === 'success' ? '76, 175, 80' :
                                    progressionMessage.type === 'warning' ? '255, 152, 0' :
                                        '33, 150, 243'
                                }, 0.1)`,
                            color: progressionMessage.type === 'success' ? '#4caf50' :
                                progressionMessage.type === 'warning' ? '#ff9800' :
                                    '#2196f3',
                            '& .MuiAlert-icon': {
                                color: 'inherit'
                            }
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {progressionMessage.message}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {progressionMessage.impact}
                        </Typography>
                    </Alert>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Progression Confidence
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progressionData.confidenceLevel * 100}
                            sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: progressionData.confidenceLevel >= 0.8
                                        ? '#4caf50'
                                        : progressionData.confidenceLevel >= 0.6
                                            ? '#ff9800'
                                            : '#f44336',
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: '40px' }}>
                        {Math.round(progressionData.confidenceLevel * 100)}%
                    </Typography>
                </Box>

                <Typography variant="caption" sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: 'block',
                    mt: 1,
                    fontStyle: 'italic'
                }}>
                    AI Suggestion: {progressionData.suggestedWeight}{weightUnit} × {progressionData.suggestedReps} reps
                </Typography>
            </ProgressionCard>
        </Collapse>
    );
};

export default ProgressionFeedback;