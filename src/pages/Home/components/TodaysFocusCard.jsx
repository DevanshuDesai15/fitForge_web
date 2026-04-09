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

const DEFAULT_REPEAT_DESCRIPTION = 'Repeat your most recent workout and keep your momentum going.';

const getExerciseCount = (focusWorkout) => focusWorkout?.exercises?.length || 0;

const getRepeatWorkoutState = (focusWorkout) => ({
    workout: {
        name: focusWorkout.name || 'Workout',
        dayName: focusWorkout.day_name || focusWorkout.dayName || focusWorkout.name || 'Workout',
        exercises: Array.isArray(focusWorkout.exercises) ? focusWorkout.exercises : []
    }
});

export default function TodaysFocusCard({ mode = 'program', focusWorkout, isTomorrowFocus }) {
    const navigate = useNavigate();
    const isRepeatLast = mode === 'repeat-last';
    const title = isRepeatLast
        ? (focusWorkout?.name || 'Repeat Last Workout')
        : (focusWorkout ? `${focusWorkout.programName}: ${focusWorkout.name}` : 'Upper Body Strength');
    const description = isRepeatLast
        ? `This is the last workout you completed. ${DEFAULT_REPEAT_DESCRIPTION}`
        : focusWorkout
            ? `Up next in your program! Focus: ${focusWorkout.focus || 'General Training'}.`
            : 'Perfect for building muscle and increasing your bench press PR. You’ve completed this workout 3 times with great results.';
    const duration = isRepeatLast
        ? `${getExerciseCount(focusWorkout) * 5 + 10} minutes`
        : focusWorkout
            ? `${getExerciseCount(focusWorkout) * 5 + 10} minutes`
            : '45 minutes';
    const exerciseCount = isRepeatLast
        ? `${getExerciseCount(focusWorkout)} exercises`
        : focusWorkout
            ? `${getExerciseCount(focusWorkout)} exercises`
            : '8 exercises';

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
                                    {isRepeatLast ? 'Repeat Last Workout' : 'Featured Workout'}
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                mb: 2,
                                fontSize: { xs: '1.75rem', md: '2.25rem' }
                            }}>
                                {title}
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: 'text.secondary',
                                mb: 3,
                                lineHeight: 1.6,
                                fontSize: '1rem'
                            }}>
                                {description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {duration}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Target size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {exerciseCount}
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
                                    if (isRepeatLast && focusWorkout) {
                                        navigate('/workout/start', {
                                            state: getRepeatWorkoutState(focusWorkout)
                                        });
                                    } else if (focusWorkout) {
                                        navigate('/workout/start', {
                                            state: {
                                                templateId: focusWorkout.programId,
                                                dayId: focusWorkout.id,
                                                workout: {
                                                    name: `${focusWorkout.programName} - ${focusWorkout.name}`,
                                                    programName: focusWorkout.programName,
                                                    dayName: focusWorkout.name,
                                                    exercises: focusWorkout.exercises || []
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
