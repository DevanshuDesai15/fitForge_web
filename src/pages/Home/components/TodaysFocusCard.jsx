import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Clock, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeaturedWorkoutCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.12) 0%, rgba(221, 237, 0, 0.06) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.25)',
    overflow: 'hidden',
}));

export default function TodaysFocusCard({ nextWorkout, isTomorrowFocus }) {
    const navigate = useNavigate();

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{
                color: 'text.primary',
                mb: 3,
                fontSize: { xs: '1.5rem', md: '2rem' }
            }}>
                {isTomorrowFocus ? "Tomorrow's Workout" : "Today's Focus"}
            </Typography>
            <FeaturedWorkoutCard>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        alignItems: { xs: 'flex-start', lg: 'center' },
                        justifyContent: 'space-between',
                        gap: 4
                    }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: 'var(--primary-a0)',
                                    borderRadius: '50%'
                                }} />
                                <Typography variant="caption" sx={{
                                    color: 'var(--primary-a0)',
                                    fontSize: '0.875rem',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase'
                                }}>
                                    Featured Workout
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 2,
                                fontSize: { xs: '1.75rem', md: '2.25rem' }
                            }}>
                                {nextWorkout ? `${nextWorkout.programName}: ${nextWorkout.name}` : 'Upper Body Strength'}
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: 'text.secondary',
                                mb: 3,
                                lineHeight: 1.6,
                                fontSize: '1rem'
                            }}>
                                {nextWorkout
                                    ? `Up next in your program! Focus: ${nextWorkout.focus || 'General Training'}.`
                                    : 'Perfect for building muscle and increasing your bench press PR. You’ve completed this workout 3 times with great results.'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {nextWorkout ? `${(nextWorkout.exercises?.length || 0) * 5 + 10} minutes` : '45 minutes'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Target size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {nextWorkout ? `${nextWorkout.exercises?.length || 0} exercises` : '8 exercises'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TrendingUp size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Intermediate
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            minWidth: 'fit-content'
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                sx={{
                                    backgroundColor: 'var(--primary-a0)',
                                    color: '#121212',
                                    fontWeight: 'bold',
                                    borderRadius: '12px',
                                    px: 4,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        backgroundColor: 'var(--primary-a10)',
                                    }
                                }}
                                onClick={() => {
                                    if (nextWorkout) {
                                        navigate('/workout/start', {
                                            state: {
                                                templateId: nextWorkout.programId,
                                                dayId: nextWorkout.id,
                                                workout: {
                                                    name: `${nextWorkout.programName} - ${nextWorkout.name}`,
                                                    programName: nextWorkout.programName,
                                                    dayName: nextWorkout.name,
                                                    exercises: nextWorkout.exercises || []
                                                }
                                            }
                                        });
                                    } else {
                                        navigate('/workout/start');
                                    }
                                }}
                            >
                                Start Workout
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </FeaturedWorkoutCard>
        </Box>
    );
}
