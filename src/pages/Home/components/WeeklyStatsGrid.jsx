import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Target, Zap, Activity } from 'lucide-react';

const StatsCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(221, 237, 0, 0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.25)',
        transform: 'translateY(-2px)',
    },
}));

export default function WeeklyStatsGrid({ weeklyStats }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{
                color: 'text.primary',
                mb: 3,
                fontSize: { xs: '1.5rem', md: '2rem' }
            }}>
                This Week
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                    <StatsCard>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <TrendingUp size={24} style={{ color: '#ff6b35' }} />
                                <Typography variant="caption" sx={{
                                    color: '#ff6b35',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                }}>
                                    {weeklyStats.volumeUnit}
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 1,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}>
                                {weeklyStats.totalVolume.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                            }}>
                                Total volume lifted
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatsCard>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Target size={24} style={{ color: 'var(--primary-a0)' }} />
                                <Typography variant="caption" sx={{
                                    color: 'var(--primary-a0)',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                }}>
                                    {weeklyStats.goalText}
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 1,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}>
                                {weeklyStats.goalProgress}%
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                            }}>
                                Goal progress
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatsCard>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Zap size={24} style={{ color: '#ffc107' }} />
                                <Typography variant="caption" sx={{
                                    color: '#ffc107',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                }}>
                                    {weeklyStats.streakDays} days
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 1,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}>
                                Active
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                            }}>
                                Current streak
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatsCard>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Activity size={24} style={{ color: '#2196f3' }} />
                                <Typography variant="caption" sx={{
                                    color: 'text.secondary',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                }}>
                                    {weeklyStats.workoutsDone} done
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 1,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}>
                                {weeklyStats.activeMinutes}
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                            }}>
                                Active minutes
                            </Typography>
                        </CardContent>
                    </StatsCard>
                </Grid>
            </Grid>
        </Box>
    );
}
