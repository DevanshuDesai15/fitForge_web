import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Card, CardContent, CircularProgress, Alert, Chip } from '@mui/material';
import { Brain, Sparkles, Zap, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import { useAICoach } from '../hooks/useAICoach';

const AICoachTab = ({ exercise }) => {
    const { loading, analysis, error, getAIAnalysis } = useAICoach();

    const completedSets = exercise.sets?.filter(set => set.completed).length || 0;
    const targetSets = exercise.targetSets || 0;
    const isUnlocked = completedSets >= targetSets && targetSets > 0;

    // Calculate average weight from completed sets
    const avgWeight = exercise.sets
        ?.filter(set => set.completed && set.weight)
        .reduce((sum, set) => sum + parseFloat(set.weight), 0) / (completedSets || 1) || 0;

    const handleAnalysis = () => {
        getAIAnalysis(exercise);
    };

    if (!isUnlocked) {
        return (
            <Card sx={{
                background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1) 0%, rgba(221, 237, 0, 0.05) 50%, rgba(18, 18, 18, 0.9) 100%)',
                border: '1px solid rgba(221, 237, 0, 0.2)',
                borderRadius: '16px',
                mt: 3
            }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Brain size={32} style={{ color: '#dded00', marginBottom: '16px' }} />
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>AI Coach Locked</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Complete your target sets for this exercise to unlock real-time performance insights.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{
            background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1) 0%, rgba(221, 237, 0, 0.05) 50%, rgba(18, 18, 18, 0.9) 100%)',
            border: '1px solid rgba(221, 237, 0, 0.2)',
            borderRadius: '16px',
            mt: 3
        }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#dded00',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Brain size={16} style={{ color: '#000' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.125rem' }}>
                            AI Workout Coach
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            Real-time performance insights
                        </Typography>
                    </Box>
                    {loading && (
                        <CircularProgress size={16} sx={{ color: '#dded00' }} />
                    )}
                </Box>

                {/* Current Exercise Analysis */}
                <Box sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    p: 2.5,
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Activity size={16} style={{ color: '#dded00' }} />
                        <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                            Current Exercise Analysis
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, textAlign: 'center' }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Sets Done
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mt: 0.5 }}>
                                {completedSets}/{targetSets}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Avg Weight
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mt: 0.5 }}>
                                {Math.round(avgWeight)}lbs
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Form Score
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#66bb6a', fontWeight: 'bold', mt: 0.5 }}>
                                {analysis?.formScore || '95%'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Latest Insights */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body1" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                            Latest Insights
                        </Typography>
                        <Chip
                            label="Live Analysis"
                            size="small"
                            sx={{
                                fontSize: '0.75rem',
                                height: 24,
                                border: '1px solid rgba(221, 237, 0, 0.3)',
                                backgroundColor: 'transparent',
                                color: '#dded00'
                            }}
                            variant="outlined"
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    )}

                    {loading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress size={32} sx={{ color: '#dded00', mb: 2 }} />
                            <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.875rem', mb: 0.5 }}>
                                AI is analyzing your workout...
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Please wait while we process your data
                            </Typography>
                        </Box>
                    )}

                    {analysis && !loading && (
                        <Box sx={{
                            p: 2.5,
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                                <Sparkles size={16} style={{ color: '#dded00', marginTop: '4px', flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{
                                        color: '#fff',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.6,
                                        fontStyle: 'italic'
                                    }}>
                                        &quot;{analysis.insight}&quot;
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {analysis && !loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleAnalysis}
                                sx={{
                                    borderColor: 'rgba(221, 237, 0, 0.3)',
                                    color: '#dded00',
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    py: 0.5,
                                    px: 2,
                                    '&:hover': {
                                        borderColor: '#dded00',
                                        backgroundColor: 'rgba(221, 237, 0, 0.1)'
                                    }
                                }}
                            >
                                Refresh Analysis
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Quick Stats */}
                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, textAlign: 'center' }}>
                        <Box sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                Workout Quality
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#66bb6a', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                    {analysis?.quality || 'Excellent'}
                                </Typography>
                                <CheckCircle2 size={12} style={{ color: '#66bb6a' }} />
                            </Box>
                        </Box>
                        <Box sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                AI Confidence
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#dded00', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                    {analysis?.confidence || '92%'}
                                </Typography>
                                <Zap size={12} style={{ color: '#dded00' }} />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Analysis Button - Show when no analysis yet */}
                {!analysis && !loading && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={handleAnalysis}
                            fullWidth
                            sx={{
                                backgroundColor: '#dded00',
                                color: '#000',
                                fontWeight: 'bold',
                                py: 1.5,
                                '&:hover': {
                                    backgroundColor: '#cddc39'
                                }
                            }}
                        >
                            Get AI Analysis
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

AICoachTab.propTypes = {
    exercise: PropTypes.object.isRequired,
};

export default AICoachTab;
