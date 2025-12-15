import { Box, Typography, Card, CardContent, Grid2, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { BarChart3, TrendingUp, Activity, Target } from 'lucide-react';

const ChartContainer = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StatsCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    height: '100%',
    transition: 'all 0.2s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        transform: 'translateY(-2px)',
    },
}));

const WeeklyPerformance = () => {
    const performanceData = [
        {
            exercise: 'Bench Press',
            currentWeight: 85,
            previousWeight: 82.5,
            trend: 'up',
            sessions: 3,
            volume: 2550,
            icon: <Target size={20} />,
            color: '#4caf50'
        },
        {
            exercise: 'Squat',
            currentWeight: 120,
            previousWeight: 120,
            trend: 'flat',
            sessions: 2,
            volume: 2400,
            icon: <Activity size={20} />,
            color: '#ffc107'
        },
        {
            exercise: 'Deadlift',
            currentWeight: 140,
            previousWeight: 145,
            trend: 'down',
            sessions: 1,
            volume: 1400,
            icon: <TrendingUp size={20} />,
            color: '#f44336'
        },
        {
            exercise: 'Overhead Press',
            currentWeight: 55,
            previousWeight: 52.5,
            trend: 'up',
            sessions: 2,
            volume: 1100,
            icon: <BarChart3 size={20} />,
            color: '#2196f3'
        }
    ];

    const weeklyStats = {
        totalWorkouts: 4,
        totalVolume: 7450,
        averageIntensity: 78,
        personalRecords: 2
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up':
                return <MdTrendingUp style={{ color: '#4caf50' }} />;
            case 'down':
                return <MdTrendingDown style={{ color: '#f44336' }} />;
            default:
                return <MdTrendingFlat style={{ color: '#ffc107' }} />;
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'up':
                return '#4caf50';
            case 'down':
                return '#f44336';
            default:
                return '#ffc107';
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart3 size={24} />
                Weekly Performance Overview
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Track your progress and performance trends over the past week
            </Typography>

            {/* Weekly Stats Summary */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
                <Grid2 xs={6} sm={3}>
                    <StatsCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                                {weeklyStats.totalWorkouts}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Workouts
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid2>
                <Grid2 xs={6} sm={3}>
                    <StatsCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                {weeklyStats.totalVolume.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Total Volume (kg)
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid2>
                <Grid2 xs={6} sm={3}>
                    <StatsCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                                {weeklyStats.averageIntensity}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Avg Intensity
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid2>
                <Grid2 xs={6} sm={3}>
                    <StatsCard>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                                {weeklyStats.personalRecords}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                New PRs
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid2>
            </Grid2>

            {/* Exercise Performance Cards */}
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Exercise Performance
            </Typography>

            <Grid2 container spacing={2}>
                {performanceData.map((exercise, index) => (
                    <Grid2 key={index} xs={12} sm={6}>
                        <ChartContainer>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ color: exercise.color, display: 'flex' }}>
                                            {exercise.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem' }}>
                                                {exercise.exercise}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {exercise.sessions} sessions this week
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getTrendIcon(exercise.trend)}
                                        <Chip
                                            label={exercise.trend.toUpperCase()}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${getTrendColor(exercise.trend)}20`,
                                                color: getTrendColor(exercise.trend),
                                                fontSize: '0.7rem',
                                                height: '20px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Current Max
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                                            {exercise.currentWeight}kg
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Previous Max
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {exercise.previousWeight}kg
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Weekly Volume
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: exercise.color, fontWeight: 'bold' }}>
                                            {exercise.volume.toLocaleString()}kg
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Progress visualization */}
                                <Box sx={{
                                    height: '60px',
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Performance Chart Placeholder
                                    </Typography>
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: `linear-gradient(90deg, ${exercise.color}40, ${exercise.color})`
                                    }} />
                                </Box>
                            </CardContent>
                        </ChartContainer>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
};

export default WeeklyPerformance;
