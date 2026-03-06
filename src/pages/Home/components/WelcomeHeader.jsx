import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Plus, Activity } from 'lucide-react';

const WelcomeCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.15) 0%, rgba(221, 237, 0, 0.08) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.3)',
    marginBottom: '2rem',
}));

export default function WelcomeHeader({ greeting, displayName, streakDays, onLogWorkout, onStartTraining }) {
    return (
        <WelcomeCard>
            <CardContent sx={{ p: 4 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 3
                }}>
                    <Box>
                        <Typography variant="h3" sx={{
                            color: 'text.primary',
                            mb: 1,
                            fontSize: { xs: '2rem', md: '2.5rem' }
                        }}>
                            {greeting.text}, {displayName}! {greeting.emoji}
                        </Typography>
                        <Typography variant="h6" sx={{
                            color: 'text.secondary',
                            fontWeight: 'normal',
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            mb: 1
                        }}>
                            You&rsquo;re on a {streakDays}-day streak! Let&rsquo;s keep the momentum going.
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            opacity: 0.8
                        }}>
                            {greeting.message}
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'row', md: 'row' },
                        gap: 2
                    }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Plus />}
                            sx={{
                                backgroundColor: 'var(--primary-a0)',
                                color: '#121212',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                px: 3,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    backgroundColor: 'var(--primary-a10)',
                                }
                            }}
                            onClick={onLogWorkout}
                        >
                            Log Workout
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Activity />}
                            sx={{
                                borderColor: 'var(--primary-a0)',
                                color: 'var(--primary-a0)',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                px: 3,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                    borderColor: 'var(--primary-a0)',
                                    backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                }
                            }}
                            onClick={onStartTraining}
                        >
                            Start Training
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </WelcomeCard>
    );
}
