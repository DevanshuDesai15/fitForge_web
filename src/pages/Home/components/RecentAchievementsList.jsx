import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Target, TrendingUp, Zap, Activity } from 'lucide-react';

const AchievementCard = styled(Card)(({ variant = 'default' }) => ({
    background: variant === 'primary'
        ? 'linear-gradient(135deg, rgba(221, 237, 0, 0.15) 0%, rgba(221, 237, 0, 0.08) 100%)'
        : variant === 'success'
            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.08) 100%)'
            : 'rgba(40, 40, 40, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: variant === 'primary'
        ? '1px solid rgba(221, 237, 0, 0.3)'
        : variant === 'success'
            ? '1px solid rgba(76, 175, 80, 0.3)'
            : '1px solid rgba(221, 237, 0, 0.15)',
}));

export default function RecentAchievementsList({ achievements }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{
                color: 'text.primary',
                mb: 3,
                fontSize: { xs: '1.5rem', md: '2rem' }
            }}>
                Recent Achievements
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {achievements && achievements.length > 0 ? (
                    achievements.slice(0, 3).map(achievement => (
                        <AchievementCard key={achievement.id} variant={achievement.variant}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{
                                        width: 48,
                                        height: 48,
                                        backgroundColor: achievement.variant === 'primary' ? 'var(--primary-a0)' : achievement.variant === 'success' ? '#4caf50' : 'rgba(255, 193, 7, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {achievement.icon === 'target' && <Target size={24} style={{ color: achievement.variant === 'primary' ? '#121212' : 'white' }} />}
                                        {achievement.icon === 'trending-up' && <TrendingUp size={24} style={{ color: achievement.variant === 'primary' ? '#121212' : 'white' }} />}
                                        {achievement.icon === 'zap' && <Zap size={24} style={{ color: achievement.variant === 'primary' ? '#121212' : '#ffc107' }} />}
                                        {achievement.icon === 'activity' && <Activity size={24} style={{ color: achievement.variant === 'primary' ? '#121212' : 'white' }} />}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{
                                            color: 'text.primary',
                                            fontWeight: 'bold',
                                            mb: 0.5
                                        }}>
                                            {achievement.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {achievement.description}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {achievement.timeAgo}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </AchievementCard>
                    ))
                ) : (
                    <AchievementCard variant="default">
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                Complete workouts to unlock achievements!
                            </Typography>
                        </CardContent>
                    </AchievementCard>
                )}
            </Box>
        </Box>
    );
}
