import { Box, Typography, Grid, FormControlLabel, Switch } from '@mui/material';
import { MdEmojiEvents, MdPsychology, MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { format, subMonths, isWithinInterval } from 'date-fns';
import { StyledCard } from './shared/StyledComponents';
import { ConfidenceIndicator } from './shared/StyledComponents';

const AchievementsSection = ({
    personalRecords,
    progressionAnalyses,
    showOnlyRecent,
    setShowOnlyRecent,
    weightUnit = 'kg'
}) => {
    const filteredRecords = showOnlyRecent ?
        personalRecords.filter(record =>
            isWithinInterval(record.date, {
                start: subMonths(new Date(), 3),
                end: new Date()
            })
        ) : personalRecords;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                Achievements
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Your fitness milestones and accomplishments
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#dded00' }}>
                    Personal Records ({filteredRecords.length})
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showOnlyRecent}
                            onChange={(e) => setShowOnlyRecent(e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#dded00',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#dded00',
                                },
                            }}
                        />
                    }
                    label={
                        <Typography sx={{ color: 'text.secondary' }}>
                            Recent only (3 months)
                        </Typography>
                    }
                />
            </Box>

            <Grid container spacing={2}>
                {filteredRecords.map((record, index) => {
                    // Find AI analysis for this exercise
                    const analysis = progressionAnalyses.find(a => a.exerciseName === record.exerciseName);

                    return (
                        <Grid item xs={12} sm={6} md={4} key={record.exerciseName}>
                            <StyledCard>
                                <Box sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <MdEmojiEvents style={{
                                            color: index === 0 ? '#ffd700' :
                                                index === 1 ? '#c0c0c0' :
                                                    index === 2 ? '#cd7f32' : '#dded00'
                                        }} />
                                        <Typography variant="h6" sx={{ color: '#fff' }}>
                                            {record.exerciseName}
                                        </Typography>
                                        {analysis && (
                                            <ConfidenceIndicator confidence={analysis.confidenceLevel}>
                                                <MdPsychology style={{ marginRight: '4px', fontSize: '14px' }} />
                                                {(analysis.confidenceLevel * 100).toFixed(0)}%
                                            </ConfidenceIndicator>
                                        )}
                                    </Box>
                                    <Typography variant="h4" sx={{ color: '#dded00', mb: 1 }}>
                                        {record.weight}{weightUnit}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                        {Array.isArray(record.sets)
                                            ? `${record.sets.length} sets`
                                            : `${record.reps} reps × ${record.sets} sets`
                                        }
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {format(record.date, 'MMM dd, yyyy')}
                                    </Typography>

                                    {/* AI Trend Analysis */}
                                    {analysis && (
                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                {analysis.progressionTrend === 'improving' && <MdTrendingUp style={{ color: '#4caf50' }} />}
                                                {analysis.progressionTrend === 'maintaining' && <MdTrendingFlat style={{ color: '#ffc107' }} />}
                                                {analysis.progressionTrend === 'declining' && <MdTrendingDown style={{ color: '#ff4444' }} />}
                                                <Typography variant="caption" sx={{
                                                    color: analysis.progressionTrend === 'improving' ? '#4caf50' :
                                                        analysis.progressionTrend === 'maintaining' ? '#ffc107' : '#ff4444',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {analysis.progressionTrend.toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {analysis.progressionRate > 0
                                                    ? `+${analysis.progressionRate.toFixed(1)}kg/week`
                                                    : analysis.progressionRate < 0
                                                        ? `${analysis.progressionRate.toFixed(1)}kg/week`
                                                        : 'No change'
                                                }
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </StyledCard>
                        </Grid>
                    );
                })}
            </Grid>

            {filteredRecords.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>
                        No personal records found for the selected time period.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default AchievementsSection;
