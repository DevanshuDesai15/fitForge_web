import { Box, Typography, Grid, CardContent } from '@mui/material';
import {
    MdTimeline,
    MdEmojiEvents,
    MdFitnessCenter,
    MdShowChart,
    MdPsychology,
    MdTrendingUp,
    MdTrendingFlat
} from 'react-icons/md';
import StatCard from './shared/StatCard';
import { StyledCard } from './shared/StyledComponents';

const StatisticsDashboard = ({
    exercises,
    personalRecords,
    progressionAnalyses,
    weightUnit = 'kg'
}) => {
    // Calculate key statistics
    const totalSessions = exercises.length;
    const improvingExercises = progressionAnalyses.filter(a => a.progressionTrend === 'improving').length;
    const avgConfidence = progressionAnalyses.length > 0 ?
        progressionAnalyses.reduce((sum, a) => sum + a.confidenceLevel, 0) / progressionAnalyses.length : 0;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdTimeline />
                Statistics Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Key performance metrics and trend indicators
            </Typography>

            {/* Main Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdEmojiEvents />}
                        value={Math.max(...personalRecords.map(r => r.weight) || [0]).toFixed(0)}
                        unit={weightUnit}
                        label="Latest Weight Lifted"
                        sublabel="Bench Press PR"
                        progress={95}
                        progressLabel={`200 ${weightUnit} goal`}
                        color="#dded00"
                        backgroundColor="rgba(221, 237, 0, 0.1)"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdFitnessCenter />}
                        value={Math.max(...personalRecords.map(r => r.weight) || [0]) > 200 ?
                            Math.max(...personalRecords.map(r => r.weight) || [0]) : 275}
                        unit={weightUnit}
                        label="Period Maximum"
                        sublabel="Deadlift (3 months)"
                        progress={85}
                        progressLabel={`300 ${weightUnit} goal`}
                        color="#ffc107"
                        backgroundColor="rgba(255, 193, 7, 0.1)"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdShowChart />}
                        value={totalSessions}
                        label="Total Sessions"
                        sublabel="This month"
                        progress={78}
                        progressLabel="150 sessions goal"
                        color="#4caf50"
                        backgroundColor="rgba(76, 175, 80, 0.1)"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdPsychology />}
                        value={(avgConfidence * 100).toFixed(0)}
                        unit="%"
                        label="Overall Progress"
                        sublabel="Quarterly improvement"
                        progress={87}
                        color="#2196f3"
                        backgroundColor="rgba(33, 150, 243, 0.1)"
                    />
                </Grid>
            </Grid>

            {/* Additional Stats Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdTrendingUp />}
                        value={94}
                        unit="%"
                        label="Training Consistency"
                        sublabel="Last 30 days"
                        progress={94}
                        progressLabel="90% target"
                        color="#4caf50"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdTimeline />}
                        value="11.4K"
                        unit={`${weightUnit}/week`}
                        label="Volume Trend"
                        sublabel="Weekly average"
                        progress={76}
                        color="#ff9800"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdFitnessCenter />}
                        value={52}
                        unit="min"
                        label="Average Session"
                        sublabel="Duration this month"
                        progress={65}
                        color="#f44336"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <StatCard
                        icon={<MdShowChart />}
                        value={312}
                        label="Strength Index"
                        sublabel="Combined big 3 total"
                        progress={82}
                        progressLabel="350 target"
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Summary Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <StyledCard sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                                📅 Monthly Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Workouts</Typography>
                                    <Typography variant="h5" sx={{ color: '#4caf50' }}>23</Typography>
                                    <Typography variant="caption" sx={{ color: '#4caf50' }}>+4 from last month</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>PRs Set</Typography>
                                    <Typography variant="h5" sx={{ color: '#4caf50' }}>6</Typography>
                                    <Typography variant="caption" sx={{ color: '#4caf50' }}>+2 from last month</Typography>
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Monthly goal progress</Typography>
                                <Box sx={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    position: 'relative'
                                }}>
                                    <Box sx={{
                                        width: '78%',
                                        height: '100%',
                                        backgroundColor: '#4caf50',
                                        borderRadius: '4px'
                                    }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>78%</Typography>
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StyledCard sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#2196f3', mb: 2 }}>
                                📈 Trend Analysis
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Strength</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: '#4caf50' }} />
                                    <Typography variant="h6" sx={{ color: '#4caf50' }}>+12%</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Volume</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingUp style={{ color: '#4caf50' }} />
                                    <Typography variant="h6" sx={{ color: '#4caf50' }}>+8%</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Frequency</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdTrendingFlat style={{ color: '#ffc107' }} />
                                    <Typography variant="h6" sx={{ color: '#ffc107' }}>Stable</Typography>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2, display: 'block' }}>
                                All key metrics trending positively over the last quarter.
                            </Typography>
                        </CardContent>
                    </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <StyledCard sx={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: '#ffc107', mb: 2 }}>
                                🏆 Performance Highlights
                            </Typography>
                            <Box sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', p: 1, borderRadius: '8px', mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>Strongest Month</Typography>
                                <Typography variant="body2" sx={{ color: '#4caf50' }}>August 2024</Typography>
                            </Box>
                            <Box sx={{ backgroundColor: 'rgba(33, 150, 243, 0.2)', p: 1, borderRadius: '8px', mb: 1 }}>
                                <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>Best Improvement</Typography>
                                <Typography variant="body2" sx={{ color: '#2196f3' }}>Squat +25 {weightUnit}</Typography>
                            </Box>
                            <Box sx={{ backgroundColor: 'rgba(156, 39, 176, 0.2)', p: 1, borderRadius: '8px' }}>
                                <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>Consistency Record</Typography>
                                <Typography variant="body2" sx={{ color: '#9c27b0' }}>18 day streak</Typography>
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>
            </Grid>

            {/* Quick Insights */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                    Quick Insights
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#4caf50', mb: 1 }}>Strengths</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Excellent training consistency (94%)</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Strong upward trend in all major lifts</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Progressive volume increases</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Multiple personal records this month</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>Areas for Focus</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Session duration trending downward</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Deadlift plateau needs attention</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Consider accessory work for weak points</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Monitor recovery between sessions</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default StatisticsDashboard;
