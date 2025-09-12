import { Box, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdAutoAwesome, MdTrendingUp, MdInfo } from 'react-icons/md';
import { Brain, Target, TrendingUp, Activity } from 'lucide-react';

const AIRecommendationsCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1), rgba(221, 237, 0, 0.05))',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.2)',
    marginBottom: '16px',
}));

const AIRecommendations = () => {
    const recommendations = [
        {
            id: 1,
            type: 'Progressive Overload',
            title: 'Increase Bench Press Weight',
            description: 'Based on your last 3 sessions, you\'re ready to increase your bench press by 2.5kg. Your form has been consistent and you\'ve completed all sets.',
            confidence: 92,
            icon: <TrendingUp size={20} />,
            color: '#4caf50',
            action: 'Apply Suggestion'
        },
        {
            id: 2,
            type: 'Recovery',
            title: 'Consider a Deload Week',
            description: 'Your performance has plateaued on squats for 2 weeks. A deload week with 70% of your current weight might help break through.',
            confidence: 78,
            icon: <Activity size={20} />,
            color: '#ff9800',
            action: 'Schedule Deload'
        },
        {
            id: 3,
            type: 'Exercise Selection',
            title: 'Add Accessory Work',
            description: 'Your tricep strength might be limiting your bench press progress. Consider adding close-grip bench press or tricep dips.',
            confidence: 85,
            icon: <Target size={20} />,
            color: '#2196f3',
            action: 'Add Exercises'
        },
        {
            id: 4,
            type: 'Volume Adjustment',
            title: 'Reduce Deadlift Frequency',
            description: 'You\'ve been deadlifting 3x per week. Consider reducing to 2x per week to allow better recovery and strength gains.',
            confidence: 71,
            icon: <Brain size={20} />,
            color: '#9c27b0',
            action: 'Adjust Schedule'
        }
    ];

    const getConfidenceColor = (confidence) => {
        if (confidence >= 90) return '#4caf50';
        if (confidence >= 80) return '#8bc34a';
        if (confidence >= 70) return '#ffc107';
        return '#ff9800';
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdAutoAwesome />
                AI-Powered Recommendations
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Personalized suggestions based on your workout history and performance data
            </Typography>

            {recommendations.map((rec) => (
                <AIRecommendationsCard key={rec.id}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ color: rec.color, display: 'flex' }}>
                                    {rec.icon}
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem', mb: 0.5 }}>
                                        {rec.title}
                                    </Typography>
                                    <Chip
                                        label={rec.type}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${rec.color}20`,
                                            color: rec.color,
                                            fontSize: '0.7rem',
                                            height: '20px'
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                        Confidence
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: getConfidenceColor(rec.confidence),
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {rec.confidence}%
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    width: '4px',
                                    height: '40px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '2px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: '100%',
                                        height: `${rec.confidence}%`,
                                        backgroundColor: getConfidenceColor(rec.confidence),
                                        borderRadius: '2px',
                                        transition: 'height 0.3s ease'
                                    }} />
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                            {rec.description}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                size="small"
                                startIcon={<MdInfo />}
                                sx={{ color: 'text.secondary' }}
                            >
                                Learn More
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                sx={{
                                    background: `linear-gradient(45deg, ${rec.color} 30%, ${rec.color}90 90%)`,
                                    color: '#fff',
                                    '&:hover': {
                                        background: `linear-gradient(45deg, ${rec.color}90 30%, ${rec.color} 90%)`,
                                    },
                                }}
                            >
                                {rec.action}
                            </Button>
                        </Box>
                    </CardContent>
                </AIRecommendationsCard>
            ))}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    AI recommendations are updated based on your latest workout data
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<MdTrendingUp />}
                    sx={{
                        borderColor: '#dded00',
                        color: '#dded00',
                        '&:hover': {
                            borderColor: '#e8f15d',
                            backgroundColor: 'rgba(221, 237, 0, 0.1)',
                        },
                    }}
                >
                    View Detailed Analysis
                </Button>
            </Box>
        </Box>
    );
};

export default AIRecommendations;
