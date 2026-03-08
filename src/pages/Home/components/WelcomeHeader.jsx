import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Plus, Activity } from 'lucide-react';

// Sleek, compact dark olive green full-width banner
const WelcomeBanner = styled(Box)(({ theme }) => ({
    background: 'rgba(40, 45, 20, 0.9)', // Dark olive tone base
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(221, 237, 0, 0.2)', // Thin lime border at bottom
    width: '100%',
    boxSizing: 'border-box',
    padding: '2rem 1rem',
    [theme.breakpoints.up('md')]: {
        padding: '2rem 3rem',
    }
}));

export default function WelcomeHeader({ greeting, displayName, streakDays, onLogWorkout, onStartTraining }) {
    return (
        <WelcomeBanner>
            <Box sx={{
                maxWidth: '1400px',
                margin: '0 auto',
                px: { xs: 2, md: 0 }
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 3
                }}>
                    <Box>
                        {/* Compact Greeting */}
                        <Typography variant="h5" sx={{
                            color: '#ffffff',
                            fontWeight: 600,
                            mb: 0.5,
                            letterSpacing: '0.01em',
                            fontSize: { xs: '1.25rem', md: '1.75rem' } // Scaled way down from 2.5rem
                        }}>
                            {greeting.text}, {displayName}! {greeting.emoji}
                        </Typography>

                        {/* Compact Streak Text */}
                        <Typography variant="body2" sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 500,
                            fontSize: { xs: '0.85rem', md: '0.95rem' },
                            mb: 0.5
                        }}>
                            You&rsquo;re on a {streakDays}-day streak! Let&rsquo;s keep the momentum going.
                        </Typography>

                        {/* Italicized Tip */}
                        <Typography variant="caption" sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontStyle: 'italic',
                            fontSize: { xs: '0.75rem', md: '0.85rem' }
                        }}>
                            {greeting.message}
                        </Typography>
                    </Box>

                    {/* Compact Pill Buttons */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'row', md: 'row' },
                        gap: 2,
                        mt: { xs: 1, md: 0 }
                    }}>
                        <Button
                            variant="contained"
                            size="medium"
                            startIcon={<Plus size={18} />}
                            sx={{
                                backgroundColor: 'var(--primary-a0)',
                                color: '#121212',
                                fontWeight: 700,
                                borderRadius: '24px', // Fully rounded pill
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontSize: '0.9rem',
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
                            size="medium"
                            startIcon={<Activity size={18} />}
                            sx={{
                                borderColor: 'var(--primary-a0)',
                                color: 'var(--primary-a0)',
                                fontWeight: 600,
                                borderRadius: '24px', // Fully rounded pill
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontSize: '0.9rem',
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
            </Box>
        </WelcomeBanner>
    );
}
