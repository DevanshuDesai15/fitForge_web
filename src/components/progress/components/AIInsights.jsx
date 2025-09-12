import { Box, Typography, Grid, Button } from '@mui/material';
import { MdPsychology } from 'react-icons/md';
import ExerciseCard from './shared/ExerciseCard';

const AIInsights = ({
    progressionAnalyses,
    weightUnit = 'kg',
    onExerciseClick
}) => {
    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdPsychology />
                AI Performance Insights
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Analyzing {progressionAnalyses.length} exercises with intelligent progress tracking
                </Typography>
            </Typography>

            {/* Exercise Progress Cards */}
            <Grid container spacing={2}>
                {progressionAnalyses.slice(0, 8).map((analysis) => (
                    <Grid item xs={12} sm={6} md={3} key={analysis.exerciseId}>
                        <ExerciseCard
                            analysis={analysis}
                            weightUnit={weightUnit}
                            onClick={() => onExerciseClick && onExerciseClick(analysis)}
                        />
                    </Grid>
                ))}
            </Grid>

            {progressionAnalyses.length > 8 && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button variant="outlined" sx={{ color: '#dded00', borderColor: '#dded00' }}>
                        Show all exercises
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default AIInsights;
