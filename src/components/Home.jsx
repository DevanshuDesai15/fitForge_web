import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Button,
    Alert,
    useTheme,
    useMediaQuery,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    Plus,
    TrendingUp,
    Flame,
    Target,
    Clock,
    Zap,
    Activity
} from "lucide-react";

// Welcome Hero Card
const WelcomeCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.15) 0%, rgba(221, 237, 0, 0.08) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.3)',
    marginBottom: '2rem',
}));

// Today's Focus Featured Workout Card
const FeaturedWorkoutCard = styled(Card)(() => ({
    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.12) 0%, rgba(221, 237, 0, 0.06) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(221, 237, 0, 0.25)',
    overflow: 'hidden',
}));

// Stats Cards
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

// Achievement Cards
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

// Quick Action Cards
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

// Dynamic greeting function
const getDynamicGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return {
            text: "Good morning",
            emoji: "🌅",
            message: "Ready to start your day strong?"
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            text: "Good afternoon",
            emoji: "☀️",
            message: "Time for that midday energy boost?"
        };
    } else if (hour >= 17 && hour < 21) {
        return {
            text: "Good evening",
            emoji: "🌆",
            message: "Perfect time for an evening workout!"
        };
    } else {
        return {
            text: "Good night",
            emoji: "🌙",
            message: "Late night session? You're dedicated!"
        };
    }
};

export default function Home() {
    const [error, setError] = useState('');
    const [userData, setUserData] = useState({ username: '', fullName: '', gender: 'male' });
    const [greeting, setGreeting] = useState(getDynamicGreeting());
    const [weeklyStats] = useState({
        caloriesBurned: 2340,
        caloriesChange: '+12%',
        goalProgress: 80,
        goalText: '4/5',
        streakDays: 12,
        workoutsDone: 4,
        activeMinutes: 187
    });

    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const loadUserData = useCallback(async () => {
        if (!currentUser?.uid) return;

        try {
            const userDoc = await getDocs(query(
                collection(db, 'users'),
                where('__name__', '==', currentUser.uid)
            ));

            if (!userDoc.empty) {
                const data = userDoc.docs[0].data();
                setUserData({
                    username: data.username || 'Fitness Enthusiast',
                    fullName: data.fullName || currentUser.email?.split('@')[0] || 'User',
                    gender: data.gender || 'male'
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }, [currentUser?.uid, currentUser?.email]);

    const loadDashboardData = useCallback(async () => {
        if (!currentUser?.uid) return;

        try {
            // Load dashboard data (currently using mock data)
            // Future: Load actual workout stats from Firebase
            console.log('Dashboard loaded for user:', currentUser.uid);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        }
    }, [currentUser?.uid]);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
            loadUserData();
        }
    }, [currentUser, loadDashboardData, loadUserData]);

    // Update greeting every minute to keep it current
    useEffect(() => {
        const updateGreeting = () => {
            setGreeting(getDynamicGreeting());
        };

        // Update immediately
        updateGreeting();

        // Set up interval to update every minute
        const interval = setInterval(updateGreeting, 60000);

        return () => clearInterval(interval);
    }, []);

    const displayName = userData.username || userData.fullName || currentUser?.email?.split('@')[0] || 'John';

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: isDesktop ? '2rem 3rem' : '1rem',
        }}>
            <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: (theme) => theme.palette.status.error }}>
                        {error}
                    </Alert>
                )}

                {/* Welcome Hero Section */}
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
                                    // fontWeight: 'bold',
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
                                    You&rsquo;re on a {weeklyStats.streakDays}-day streak! Let&rsquo;s keep the momentum going.
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
                                    onClick={() => navigate('/workout/quick-add')}
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
                                    onClick={() => navigate('/workout/start')}
                                >
                                    Start Training
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </WelcomeCard>

                {/* Today's Focus */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{
                        color: 'text.primary',
                        // fontWeight: 'bold',
                        mb: 3,
                        fontSize: { xs: '1.5rem', md: '2rem' }
                    }}>
                        Today&rsquo;s Focus
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
                                            // fontWeight: 'bold',
                                            fontSize: '0.875rem',
                                            letterSpacing: 1,
                                            textTransform: 'uppercase'
                                        }}>
                                            Featured Workout
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{
                                        color: 'text.primary',
                                        // fontWeight: 'bold',
                                        mb: 2,
                                        fontSize: { xs: '1.75rem', md: '2.25rem' }
                                    }}>
                                        Upper Body Strength
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        color: 'text.secondary',
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: '1rem'
                                    }}>
                                        Perfect for building muscle and increasing your bench press PR. You&rsquo;ve completed this workout 3 times with great results.
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                45 minutes
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Target size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                8 exercises
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
                                        onClick={() => navigate('/workout/start')}
                                    >
                                        Start Workout
                                    </Button>
                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            color: 'text.secondary',
                                            textTransform: 'none',
                                            '&:hover': {
                                                color: 'text.primary',
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                        onClick={() => navigate('/workout/templates')}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </FeaturedWorkoutCard>
                </Box>

                {/* This Week Stats */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{
                        color: 'text.primary',
                        // fontWeight: 'bold',
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
                                        <Flame size={24} style={{ color: '#ff6b35' }} />
                                        <Typography variant="caption" sx={{
                                            color: '#4caf50',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem'
                                        }}>
                                            {weeklyStats.caloriesChange}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{
                                        color: 'text.primary',
                                        // fontWeight: 'bold',
                                        mb: 1,
                                        fontSize: { xs: '1.5rem', md: '2rem' }
                                    }}>
                                        {weeklyStats.caloriesBurned.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.75rem'
                                    }}>
                                        Calories burned
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
                                        //fontWeight: 'bold',
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
                                        // fontWeight: 'bold',
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
                                            {weeklyStats.activeMinutes} min
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" sx={{
                                        color: 'text.primary',
                                        // fontWeight: 'bold',
                                        mb: 1,
                                        fontSize: { xs: '1.5rem', md: '2rem' }
                                    }}>
                                        {weeklyStats.workoutsDone}
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.75rem'
                                    }}>
                                        Workouts done
                                    </Typography>
                                </CardContent>
                            </StatsCard>
                        </Grid>
                    </Grid>
                </Box>

                {/* Main Content Grid - Achievements and AI Recommendations */}
                <Grid container spacing={4}>
                    {/* Left Column - Recent Achievements */}
                    <Grid item xs={12} lg={8}>
                        {/* Recent Achievements */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h4" sx={{
                                color: 'text.primary',
                                // fontWeight: 'bold',
                                mb: 3,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}>
                                Recent Achievements
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <AchievementCard variant="primary">
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                backgroundColor: 'var(--primary-a0)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Target size={24} style={{ color: '#121212' }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{
                                                    color: 'text.primary',
                                                    fontWeight: 'bold',
                                                    mb: 0.5
                                                }}>
                                                    Weekly Goal Smashed! 🎯
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Completed 5 workouts this week
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                2 days ago
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </AchievementCard>

                                <AchievementCard variant="success">
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                backgroundColor: '#4caf50',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <TrendingUp size={24} style={{ color: 'white' }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{
                                                    color: 'text.primary',
                                                    fontWeight: 'bold',
                                                    mb: 0.5
                                                }}>
                                                    New Personal Record! 💪
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Bench Press: 185 lbs (+10 lbs)
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                4 days ago
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </AchievementCard>
                            </Box>
                        </Box>

                        {/* Quick Actions */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" sx={{
                                color: 'text.primary',
                                // fontWeight: 'bold',
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
                                            // minHeight: 100
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
                                    <QuickActionCard onClick={() => navigate('/workout/quick-add')}>
                                        <CardContent sx={{
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            // minHeight: 100
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
                                            // minHeight: 100
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
                    </Grid>

                    {/* Right Column - AI Recommendations */}
                    <Grid item xs={12} lg={4}>
                        {/* AI Recommendations Container */}
                        <Card sx={{
                            background: 'rgba(40, 40, 40, 0.6)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            p: 3
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Brain size={20} style={{ color: 'var(--primary-a0)' }} />
                                <Typography variant="h6" sx={{
                                    color: 'text.primary',
                                    // fontWeight: 600,
                                    fontSize: '1.125rem'
                                }}>
                                    AI Recommendations
                                </Typography>
                            </Box>

                            {/* AI Recommendations List */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {/* Focus on Legs - High Priority */}
                                <Box sx={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    // border: '1px solid rgba(255, 255, 255, 0.1)',
                                    p: 2.5,
                                    transition: 'all 0.2s ease',
                                    // '&:hover': {
                                    //     background: 'rgba(255, 255, 255, 0.05)',
                                    //     border: '1px solid rgba(255, 255, 255, 0.2)'
                                    // }
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                        <Target size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{
                                                    color: 'text.primary',
                                                    // fontWeight: 600,
                                                    fontSize: '1rem'
                                                }}>
                                                    Focus on Legs
                                                </Typography>
                                                <Chip
                                                    label="high"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(239, 68, 68, 0.2)', // bg-red-500/20
                                                        color: '#f87171', // text-red-400
                                                        border: '1px solid rgba(239, 68, 68, 0.3)', // border-red-500/30
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        // fontWeight: 600,
                                                        '& .MuiChip-label': {
                                                            px: 1.5
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                mb: 2.5,
                                                lineHeight: 1.4,
                                                fontSize: '0.875rem'
                                            }}>
                                                You haven&rsquo;t trained legs in 4 days. Try the Lower Body Power workout.
                                            </Typography>
                                            <Button
                                                variant="text"
                                                size="small"
                                                sx={{
                                                    color: 'var(--primary-a0)',
                                                    // fontWeight: 600,
                                                    textTransform: 'none',
                                                    fontSize: '0.875rem',
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--primary-a50)'
                                                    }
                                                }}
                                                onClick={() => navigate('/workout/start')}
                                            >
                                                Start Workout
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Rest Day Suggested - Medium Priority */}
                                <Box sx={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    // border: '1px solid rgba(255, 255, 255, 0.1)',
                                    p: 2.5,
                                    transition: 'all 0.2s ease',
                                    // '&:hover': {
                                    //     background: 'rgba(255, 255, 255, 0.05)',
                                    //     border: '1px solid rgba(255, 255, 255, 0.2)'
                                    // }
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                        <Clock size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{
                                                    color: 'text.primary',
                                                    // fontWeight: 600,
                                                    fontSize: '1rem'
                                                }}>
                                                    Rest Day Suggested
                                                </Typography>
                                                <Chip
                                                    label="medium"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(234, 179, 8, 0.2)', // bg-yellow-500/20
                                                        color: '#facc15', // text-yellow-400
                                                        border: '1px solid rgba(234, 179, 8, 0.3)', // border-yellow-500/30
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        // fontWeight: 600,
                                                        '& .MuiChip-label': {
                                                            px: 1.5
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                mb: 2.5,
                                                lineHeight: 1.4,
                                                fontSize: '0.875rem'
                                            }}>
                                                You&rsquo;ve been training hard. Consider taking tomorrow as a recovery day.
                                            </Typography>
                                            <Button
                                                variant="text"
                                                size="small"
                                                sx={{
                                                    color: 'var(--primary-a0)',
                                                    // fontWeight: 600,
                                                    textTransform: 'none',
                                                    fontSize: '0.875rem',
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--primary-a10)'
                                                    }
                                                }}
                                                onClick={() => navigate('/progress')}
                                            >
                                                Schedule Rest
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Increase Weight - Low Priority */}
                                <Box sx={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    // border: '1px solid rgba(255, 255, 255, 0.1)',
                                    p: 2.5,
                                    transition: 'all 0.2s ease',
                                    // '&:hover': {
                                    //     background: 'rgba(255, 255, 255, 0.05)',
                                    //     border: '1px solid rgba(255, 255, 255, 0.2)'
                                    // }
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                        <Brain size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{
                                                    color: 'text.primary',
                                                    // fontWeight: 600,
                                                    fontSize: '1rem'
                                                }}>
                                                    Increase Weight
                                                </Typography>
                                                <Chip
                                                    label="low"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(59, 130, 246, 0.2)', // bg-blue-500/20
                                                        color: '#60a5fa', // text-blue-400
                                                        border: '1px solid rgba(59, 130, 246, 0.3)', // border-blue-500/30
                                                        fontSize: '0.7rem',
                                                        height: 22,
                                                        // fontWeight: 600,
                                                        '& .MuiChip-label': {
                                                            px: 1.5
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                mb: 2.5,
                                                lineHeight: 1.4,
                                                fontSize: '0.875rem'
                                            }}>
                                                Your bench press has been consistent. Try adding 5lbs next session.
                                            </Typography>
                                            <Button
                                                variant="text"
                                                size="small"
                                                sx={{
                                                    color: 'var(--primary-a0)',
                                                    // fontWeight: 600,
                                                    textTransform: 'none',
                                                    fontSize: '0.875rem',
                                                    p: 0,
                                                    minWidth: 'auto',
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--primary-a10)'
                                                    }
                                                }}
                                                onClick={() => navigate('/progress')}
                                            >
                                                Update Goal
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
} 