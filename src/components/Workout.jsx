import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid2,
    Chip,
    Avatar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdPlayArrow,
    MdFitnessCenter,
    MdLibraryBooks,
    MdPlaylistAdd,
    MdTimer,
    MdFlashOn,
    MdStar,
    MdHistory,
    MdArrowForward
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, isToday } from 'date-fns';

const HeroCard = styled(Card)(({ theme }) => ({
    background: theme.palette.background.gradient.hero,
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: `1px solid ${theme.palette.surface.secondary}`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light}, ${theme.palette.info.main})`,
    }
}));

const FeaturedCard = styled(Card)(({ theme }) => ({
    background: theme.palette.background.gradient.button,
    borderRadius: '20px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: `0 20px 40px ${theme.palette.surface.tertiary}`,
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.1)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    '&:hover::after': {
        opacity: 1,
    }
}));

const ActionCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'gradient',
})(({ theme, gradient }) => ({
    background: gradient || 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${theme.palette.border.primary}`,
    },
}));

const StatCard = styled(Card)(({ theme }) => ({
    background: theme.palette.surface.primary,
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: `1px solid ${theme.palette.border.main}`,
    textAlign: 'center',
}));

export default function Workout() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { currentUser } = useAuth();
    const [recentWorkouts, setRecentWorkouts] = useState([]);
    const [stats, setStats] = useState({
        thisWeek: 0,
        totalTime: 0,
        streak: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, [currentUser]);

    const loadDashboardData = async () => {
        if (!currentUser) return;

        try {
            // Load recent workouts
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(3)
            );
            const workoutDocs = await getDocs(workoutsQuery);
            const workoutData = workoutDocs.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentWorkouts(workoutData);

            // Calculate simple stats
            const thisWeekWorkouts = workoutData.filter(w => {
                const workoutDate = new Date(w.timestamp);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return workoutDate >= weekAgo;
            }).length;

            const totalTime = workoutData.reduce((sum, w) => sum + (w.duration || 0), 0);

            setStats({
                thisWeek: thisWeekWorkouts,
                totalTime: Math.round(totalTime / 60), // Convert to minutes
                streak: workoutData.length > 0 && isToday(new Date(workoutData[0].timestamp)) ? 1 : 0
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const workoutActions = [
        {
            title: 'Exercise Library',
            icon: MdFitnessCenter,
            description: 'Browse and discover exercises',
            path: '/workout/library',
            gradient: `linear-gradient(135deg, ${theme.palette.actions.library}20 0%, ${theme.palette.actions.library}05 100%)`,
            color: theme.palette.actions.library
        },
        {
            title: 'Workout Templates',
            icon: MdLibraryBooks,
            description: 'Create and manage routines',
            path: '/workout/templates',
            gradient: `linear-gradient(135deg, ${theme.palette.actions.templates}20 0%, ${theme.palette.actions.templates}05 100%)`,
            color: theme.palette.actions.templates
        },
        {
            title: 'Quick Add Exercise',
            icon: MdPlaylistAdd,
            description: 'Log a single exercise',
            path: '/workout/quick-add',
            gradient: `linear-gradient(135deg, ${theme.palette.actions.quickAdd}20 0%, ${theme.palette.actions.quickAdd}05 100%)`,
            color: theme.palette.actions.quickAdd
        }
    ];

    const motivationalQuotes = [
        "Your only limit is you!",
        "Push yourself beyond limits!",
        "Stronger than yesterday!",
        "Every rep counts!",
        "Beast mode activated!"
    ];

    const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

    return (
        <Box sx={{
            minHeight: '100vh',
            background: theme.palette.background.gradient.primary,
            padding: { xs: '0.5rem', sm: '1rem' },
            paddingBottom: { xs: '100px', sm: '1rem' },
        }}>
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <HeroCard sx={{ mb: 4 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 3
                        }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant={isMobile ? "h5" : "h4"}
                                    sx={{
                                        color: theme.palette.text.primary,
                                        fontWeight: 'bold',
                                        mb: 1,
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Ready to Train?
                                </Typography>
                                <Typography variant="body1" sx={{ color: theme.palette.text.muted, mb: 2 }}>
                                    {todayQuote}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<MdFlashOn />}
                                        label={`${stats.thisWeek} workouts this week`}
                                        sx={{
                                            backgroundColor: theme.palette.surface.secondary,
                                            color: theme.palette.primary.main,
                                            border: `1px solid ${theme.palette.border.primary}`
                                        }}
                                    />
                                    {stats.streak > 0 && (
                                        <Chip
                                            icon={<MdStar />}
                                            label="On streak!"
                                            sx={{
                                                backgroundColor: `${theme.palette.status.warning}10`,
                                                color: theme.palette.status.warning,
                                                border: `1px solid ${theme.palette.status.warning}30`
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            {/* Quick Stats */}
                            <Box sx={{
                                display: 'flex',
                                gap: 2,
                                flexDirection: { xs: 'row', sm: 'column' },
                                minWidth: { xs: 'auto', sm: '200px' }
                            }}>
                                <StatCard sx={{ p: 1.5, minWidth: '80px' }}>
                                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                                        {stats.thisWeek}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        This Week
                                    </Typography>
                                </StatCard>
                                <StatCard sx={{ p: 1.5, minWidth: '80px' }}>
                                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                                        {stats.totalTime}m
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        Total Time
                                    </Typography>
                                </StatCard>
                            </Box>
                        </Box>
                    </CardContent>
                </HeroCard>

                {/* Featured Action - Start Workout */}
                <FeaturedCard sx={{ mb: 4 }} onClick={() => navigate('/workout/start')}>
                    <CardContent sx={{ p: 3, color: theme.palette.primary.contrastText }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{
                                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                                    width: 56,
                                    height: 56,
                                    color: theme.palette.primary.contrastText
                                }}>
                                    <MdFitnessCenter style={{ fontSize: '2rem' }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.contrastText }}>
                                        Start New Workout
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'rgba(0, 0, 0, 0.72)' }}>
                                        Tap to begin an empty session or pick a template
                                    </Typography>
                                </Box>
                            </Box>
                            <MdArrowForward style={{ fontSize: '2rem', color: 'rgba(0, 0, 0, 0.6)' }} />
                        </Box>
                    </CardContent>
                </FeaturedCard>

                {/* Action Cards Grid */}
                <Grid2 container spacing={3} sx={{ mb: 4 }}>
                    {workoutActions.map((action) => (
                        <Grid2 xs={12} sm={6} md={4} key={action.title}>
                            <ActionCard
                                gradient={action.gradient}
                                onClick={() => navigate(action.path)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        mb: 2
                                    }}>
                                        <Avatar sx={{
                                            bgcolor: `${action.color}20`,
                                            color: action.color,
                                            width: 48,
                                            height: 48
                                        }}>
                                            <action.icon style={{ fontSize: '1.5rem' }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" sx={{
                                                color: theme.palette.text.primary,
                                                fontWeight: 'bold',
                                                fontSize: '1rem'
                                            }}>
                                                {action.title}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{
                                        color: theme.palette.text.muted,
                                        lineHeight: 1.5
                                    }}>
                                        {action.description}
                                    </Typography>
                                </CardContent>
                            </ActionCard>
                        </Grid2>
                    ))}
                </Grid2>

                {/* Recent Activity */}
                {recentWorkouts.length > 0 && (
                    <HeroCard>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <MdHistory style={{ color: theme.palette.primary.main, fontSize: '1.5rem' }} />
                                <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                                    Recent Activity
                                </Typography>
                            </Box>
                            <Grid2 container spacing={2}>
                                {recentWorkouts.slice(0, 2).map((workout) => (
                                    <Grid2 xs={12} sm={6} key={workout.id}>
                                        <Box sx={{
                                            p: 2,
                                            background: theme.palette.surface.transparent,
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.border.main}`
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                                                    {workout.templateInfo?.templateName || 'Custom Workout'}
                                                </Typography>
                                                <Chip
                                                    icon={<MdTimer />}
                                                    label={`${Math.round((workout.duration || 0) / 60)}min`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: theme.palette.surface.secondary,
                                                        color: theme.palette.primary.main,
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {workout.exercises?.length || 0} exercises • {' '}
                                                {isToday(new Date(workout.timestamp)) ? 'Today' :
                                                    format(new Date(workout.timestamp), 'MMM dd')}
                                            </Typography>
                                        </Box>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </CardContent>
                    </HeroCard>
                )}
            </div>
        </Box>
    );
}