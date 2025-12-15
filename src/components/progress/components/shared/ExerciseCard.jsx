import { CardContent, Typography, Box, Grid, Chip } from '@mui/material';
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { format } from 'date-fns';
import { StyledCard } from './StyledComponents';

const ExerciseCard = ({
    analysis,
    weightUnit = 'kg',
    onClick,
    ...props
}) => {
    const trendIcon = analysis.progressionTrend === 'improving' ?
        <MdTrendingUp style={{ color: '#4caf50' }} /> :
        analysis.progressionTrend === 'maintaining' ?
            <MdTrendingFlat style={{ color: '#ffc107' }} /> :
            <MdTrendingDown style={{ color: '#ff4444' }} />;

    const confidenceColor = analysis.confidenceLevel >= 0.8 ? '#4caf50' :
        analysis.confidenceLevel >= 0.6 ? '#ffc107' : '#ff9800';

    const cardBackground = analysis.progressionTrend === 'improving' ?
        'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))' :
        analysis.progressionTrend === 'declining' ?
            'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))' :
            'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))';

    return (
        <StyledCard
            sx={{
                height: '100%',
                background: cardBackground,
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? { transform: 'translateY(-2px)', transition: 'transform 0.2s' } : {},
                ...props.sx
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem' }}>
                        {analysis.exerciseName}
                    </Typography>
                    <Chip
                        label={`${(analysis.confidenceLevel * 100).toFixed(0)}% High`}
                        size="small"
                        sx={{
                            backgroundColor: `${confidenceColor}20`,
                            color: confidenceColor,
                            fontSize: '0.7rem',
                            height: '20px'
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {trendIcon}
                    <Typography variant="body2" sx={{
                        color: analysis.progressionTrend === 'improving' ? '#4caf50' :
                            analysis.progressionTrend === 'maintaining' ? '#ffc107' : '#ff4444',
                        fontWeight: 'bold'
                    }}>
                        {analysis.progressionTrend === 'improving' ? 'Improving' :
                            analysis.progressionTrend === 'maintaining' ? 'Maintaining' : 'Declining'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Progress: {analysis.progressionRate > 0 ? '+' : ''}{analysis.progressionRate.toFixed(1)}kg/week
                    </Typography>
                </Box>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Current Weight
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#dded00', fontSize: '0.9rem' }}>
                            {analysis.currentWeight}{weightUnit}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Total Sessions
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#dded00', fontSize: '0.9rem' }}>
                            {analysis.totalSessions}
                        </Typography>
                    </Grid>
                </Grid>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Last Session: {format(new Date(analysis.lastProgressDate), 'MMM dd')}
                </Typography>
            </CardContent>
        </StyledCard>
    );
};

export default ExerciseCard;
