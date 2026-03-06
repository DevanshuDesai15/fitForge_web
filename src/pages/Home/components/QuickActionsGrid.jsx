import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Zap, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.4)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(221, 237, 0, 0.15)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        backgroundColor: 'rgba(221, 237, 0, 0.05)',
        transform: 'translateY(-2px)',
    },
}));

export default function QuickActionsGrid({ onLogActivity }) {
    const navigate = useNavigate();

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{
                color: 'text.primary',
                mb: 3,
                fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}>
                Quick Actions
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={4} sm={4}>
                    <QuickActionCard onClick={() => navigate('/workout/start')}>
                        <CardContent sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}>
                            <Zap size={32} style={{ color: 'var(--primary-a0)', marginBottom: 8 }} />
                            <Typography variant="caption" sx={{
                                color: 'text.primary',
                                fontWeight: 'medium',
                                fontSize: '0.75rem'
                            }}>
                                Quick HIIT
                            </Typography>
                        </CardContent>
                    </QuickActionCard>
                </Grid>
                <Grid item xs={4} sm={4}>
                    <QuickActionCard onClick={onLogActivity}>
                        <CardContent sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}>
                            <Activity size={32} style={{ color: 'var(--primary-a0)', marginBottom: 8 }} />
                            <Typography variant="caption" sx={{
                                color: 'text.primary',
                                fontWeight: 'medium',
                                fontSize: '0.75rem'
                            }}>
                                Log Activity
                            </Typography>
                        </CardContent>
                    </QuickActionCard>
                </Grid>
                <Grid item xs={4} sm={4}>
                    <QuickActionCard onClick={() => navigate('/progress')}>
                        <CardContent sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}>
                            <Target size={32} style={{ color: 'var(--primary-a0)', marginBottom: 8 }} />
                            <Typography variant="caption" sx={{
                                color: 'text.primary',
                                fontWeight: 'medium',
                                fontSize: '0.75rem'
                            }}>
                                Set Goal
                            </Typography>
                        </CardContent>
                    </QuickActionCard>
                </Grid>
            </Grid>
        </Box>
    );
}
