import { useState, useEffect, useCallback } from "react";
import {
    Card,
    Typography,
    Box,
    Grid,
    Button,
    Alert,
    useTheme,
    useMediaQuery,
    Chip,
    Skeleton,
    Snackbar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabase } from '../../hooks/useSupabase';
import { useProfile } from '../../hooks/useProfile';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    TrendingUp,
    Clock
} from "lucide-react";
import progressiveOverloadAI from '../../services/progressiveOverloadAI';
import QuickAddExerciseModal from '../../components/workout/QuickAddExerciseModal';

// Components
import AIUnlockProgress from './components/AIUnlockProgress';
import WelcomeModal from './components/WelcomeModal';
import TodaysFocusCard from './components/TodaysFocusCard';
import WeeklyStatsGrid from './components/WeeklyStatsGrid';
import RecentAchievementsList from './components/RecentAchievementsList';
import QuickActionsGrid from './components/QuickActionsGrid';
import WeeklyTargetsGrid from './components/WeeklyTargetsGrid';
import { deriveHomeFocus } from './utils/homeFocus';




// AI Recommendation utility functions
const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high':
            return {
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)'
            };
        case 'medium':
            return {
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)'
            };
        case 'low':
        default:
            return {
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)'
            };
    }
};

const getRecommendationTitle = (recommendation) => {
    if (recommendation.progressionType === 'weight') {
        return 'Increase Weight';
    } else if (recommendation.progressionType === 'reps') {
        return 'Increase Reps';
    } else if (recommendation.progressionType === 'deload') {
        return 'Deload Week';
    } else {
        return 'Progression Suggested';
    }
};

const getRecommendationDescription = (recommendation) => {
    if (recommendation.progressionType === 'weight') {
        return `Try increasing ${recommendation.exerciseName} from ${recommendation.currentWeight}kg to ${recommendation.suggestedWeight}kg.`;
    } else if (recommendation.progressionType === 'reps') {
        return `Try increasing reps for ${recommendation.exerciseName} from ${recommendation.currentReps} to ${recommendation.suggestedReps}.`;
    } else if (recommendation.progressionType === 'deload') {
        return `Consider a deload week for ${recommendation.exerciseName}. Reduce weight to ${recommendation.suggestedWeight}kg.`;
    } else {
        return recommendation.reasoning || `Consider progression for ${recommendation.exerciseName}.`;
    }
};

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

const DEFAULT_WEEKLY_STATS = {
    totalVolume: 0,
    volumeUnit: 'kg',
    goalProgress: 0,
    goalText: '0/4',
    streakDays: 0,
    workoutsDone: 0,
    activeMinutes: 0,
    targetedMuscles: { current: 0, target: 11 },
    weeklySets: { current: 0, target: 60 },
    uniqueExercises: { current: 0, target: 20 }
};

const AI_RECOMMENDATION_UNLOCK_WORKOUTS = 5;

export default function Home() {
    const [successMessage, setSuccessMessage] = useState('');
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

    const { currentUser } = useAuth();
    const supabase = useSupabase();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const userId = currentUser?.uid;

    // React Query Hooks (Supabase)
    const { profile, isLoading: profileLoading } = useProfile();
    const { 
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats
    } = useDashboardStats();

    const {
        weeklyStats,
        recentAchievements,
        nextWorkout,
        isTomorrowFocus,
        lastRepeatableWorkout,
        completedWorkoutsCount = 0
    } = statsData || {};

    const safeWeeklyStats = weeklyStats ?? DEFAULT_WEEKLY_STATS;
    const homeFocus = deriveHomeFocus({
        nextWorkout,
        lastRepeatableWorkout
    });
    const workoutsUntilAiUnlock = Math.max(
        AI_RECOMMENDATION_UNLOCK_WORKOUTS - completedWorkoutsCount,
        0
    );
    const isAiUnlocked = completedWorkoutsCount >= AI_RECOMMENDATION_UNLOCK_WORKOUTS;

    // Set greeting state
    const [greeting, setGreeting] = useState(getDynamicGreeting());



    const loadAIRecommendations = useCallback(async () => {
        if (!userId || !supabase || !isAiUnlocked) {
            setAiLoading(prev => (prev ? false : prev));
            setAiRecommendations(prev => (prev.length > 0 ? [] : prev));
            setAiError(prev => (prev ? '' : prev));
            return;
        }

        try {
            setAiLoading(true);

            // Initialize AI Service with Supabase client
            progressiveOverloadAI.setSupabase(supabase);

            // Timeout safety net — if AI service hangs, resolve after 30 seconds
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('AI recommendations timed out')), 30000);
            });

            const loadPromise = (async () => {
                // Get workout history analysis
                const analyses = await progressiveOverloadAI.analyzeWorkoutHistory(userId);

                if (analyses && analyses.length > 0) {
                    const topAnalyses = analyses.slice(0, 3);
                    const exerciseIds = topAnalyses.map(analysis => analysis.exerciseId);

                    const batchProgressions = await progressiveOverloadAI.calculateBatchProgressions(
                        userId,
                        exerciseIds
                    );

                    const suggestions = batchProgressions.map((progression, index) => {
                        const analysis = topAnalyses[index];

                        if (!progression) {
                            return null;
                        }

                        return {
                            ...progression,
                            ...analysis,
                            priority: (progression.confidenceLevel || 0) >= 0.8 ? 'high' :
                                (progression.confidenceLevel || 0) >= 0.6 ? 'medium' : 'low',
                            icon: progression.progressionType === 'weight' ? TrendingUp :
                                progression.progressionType === 'deload' ? Clock : Brain
                        };
                    }).filter(s => s !== null);

                    return suggestions;
                }
                return [];
            })();

            const suggestions = await Promise.race([loadPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            setAiRecommendations(suggestions);
        } catch (error) {
            console.error('Error loading AI recommendations:', error);
            setAiRecommendations([]);

            if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
                setAiError('AI suggestions temporarily unavailable due to high usage. Using smart fallbacks.');
            } else {
                setAiError('');
            }
        } finally {
            setAiLoading(false);
        }
    }, [isAiUnlocked, supabase, userId]);

    useEffect(() => {
        if (userId && supabase && !statsLoading && !profileLoading) {
            loadAIRecommendations();
        }
    }, [userId, supabase, statsLoading, profileLoading, loadAIRecommendations]);

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

    useEffect(() => {
        if (!isWelcomeModalOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isWelcomeModalOpen]);

    const displayName = profile?.display_name || currentUser?.email?.split('@')[0] || 'Member';

    const isLoading = statsLoading || profileLoading;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
        }}>
            {isWelcomeModalOpen ? (
                <WelcomeModal
                    greeting={greeting}
                    displayName={displayName}
                    streakDays={safeWeeklyStats.streakDays}
                    onClose={() => setIsWelcomeModalOpen(false)}
                    onLogWorkout={() => setQuickAddModalOpen(true)}
                    onStartTraining={() => navigate('/workout')}
                />
            ) : null}

            <Box sx={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: isDesktop ? '0 3rem 2rem 3rem' : '0 1rem 1rem 1rem',
            }}>
                {statsError && (
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: (theme) => theme.palette.status.error }}>
                        {statsError}
                    </Alert>
                )}

                {/* Weekly Targets (Prominently displayed) */}
                <Box sx={{ mb: 4, mt: isWelcomeModalOpen ? { xs: 2.5, md: 1.5 } : { xs: 5, md: 4 } }}>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                        Weekly Targets
                    </Typography>
                    {isLoading ? (
                        <Grid container spacing={2}>
                            {[1, 2, 3].map(i => (
                                <Grid item xs={12} md={4} key={i}>
                                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <WeeklyTargetsGrid weeklyStats={safeWeeklyStats} />
                    )}
                </Box>

                {/* Today's / Tomorrow's Focus */}
                {isLoading ? (
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '24px', mb: 4 }} />
                ) : homeFocus.mode !== 'hidden' ? (
                    <TodaysFocusCard
                        mode={homeFocus.mode}
                        focusWorkout={homeFocus.workout}
                        isTomorrowFocus={isTomorrowFocus}
                    />
                ) : null}

                {/* This Week Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2, mt: 4 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        This Week
                    </Typography>
                </Box>
                {isLoading ? (
                    <Grid container spacing={2}>
                        {[1, 2, 3, 4].map(i => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '16px' }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <WeeklyStatsGrid weeklyStats={safeWeeklyStats} />
                )}

                {/* Main Content Grid - Achievements and AI Recommendations */}
                <Grid container spacing={4} sx={{ mt: 1 }}>
                    {/* Left Column - Recent Achievements */}
                    <Grid item xs={12} lg={8}>
                        {isLoading ? (
                            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px', mb: 4 }} />
                        ) : (
                            <RecentAchievementsList achievements={recentAchievements} />
                        )}
                        <QuickActionsGrid onLogActivity={() => setQuickAddModalOpen(true)} />
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
                                    fontSize: '1.125rem'
                                }}>
                                    AI Recommendations
                                </Typography>
                            </Box>

                            {/* AI Recommendations List */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {aiLoading ? (
                                    // Loading state
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <Box key={i} sx={{
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                borderRadius: '12px',
                                                p: 2.5
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                    <Skeleton variant="circular" width={20} height={20} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Skeleton variant="text" width="60%" height={24} />
                                                            <Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: '12px' }} />
                                                        </Box>
                                                        <Skeleton variant="text" width="90%" height={20} />
                                                        <Skeleton variant="text" width="70%" height={20} />
                                                        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))}
                                    </>
                                ) : aiRecommendations.length > 0 ? (
                                    // Real AI Recommendations
                                    aiRecommendations.map((recommendation, index) => (
                                        <Box key={recommendation.exerciseId || index} sx={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: '12px',
                                            p: 2.5,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                background: 'rgba(255, 255, 255, 0.05)',
                                            }
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                <recommendation.icon size={20} style={{ color: 'var(--primary-a0)', marginTop: '2px' }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="subtitle1" sx={{
                                                            color: 'text.primary',
                                                            fontSize: '1rem'
                                                        }}>
                                                            {getRecommendationTitle(recommendation)}
                                                        </Typography>
                                                        <Chip
                                                            label={recommendation.priority}
                                                            size="small"
                                                            sx={{
                                                                ...getPriorityColor(recommendation.priority),
                                                                fontSize: '0.7rem',
                                                                height: 22,
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
                                                        {getRecommendationDescription(recommendation)}
                                                    </Typography>
                                                    <Button
                                                        variant="text"
                                                        size="small"
                                                        sx={{
                                                            color: 'var(--primary-a0)',
                                                            textTransform: 'none',
                                                            fontSize: '0.875rem',
                                                            p: 0,
                                                            minWidth: 'auto',
                                                            '&:hover': {
                                                                backgroundColor: 'transparent',
                                                                color: 'var(--primary-a10)'
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            console.log('Accepted recommendation:', recommendation);
                                                            navigate('/workout/start');
                                                        }}
                                                    >
                                                        Start Workout
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    // No recommendations state
                                    <Box sx={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px',
                                        p: 3,
                                        textAlign: 'center'
                                    }}>
                                        {aiError ? (
                                            <>
                                                <Alert severity="info" sx={{
                                                    mb: 2,
                                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                                    color: '#64b5f6'
                                                }}>
                                                    {aiError}
                                                </Alert>
                                                <Brain size={32} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} />
                                                <Typography variant="body1" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    Using Smart Fallbacks
                                                </Typography>
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.5)',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    Rule-based progression system is still working
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                {/* <Brain size={32} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} /> */}
                                                {/* <Typography variant="body1" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    No AI recommendations yet
                                                </Typography> */}
                                                {isAiUnlocked ? (
                                                    <Typography variant="body2" sx={{
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        AI recommendations are calibrating from your recent workout history
                                                    </Typography>
                                                ) : (
                                                    <>
                                                        <AIUnlockProgress
                                                            completedWorkouts={completedWorkoutsCount}
                                                            totalWorkouts={AI_RECOMMENDATION_UNLOCK_WORKOUTS}
                                                        />
                                                        <Typography variant="body2" sx={{
                                                            color: 'rgba(255, 255, 255, 0.5)',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            Complete {workoutsUntilAiUnlock} more workout{workoutsUntilAiUnlock === 1 ? '' : 's'} to unlock AI recommendations
                                                        </Typography>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Quick Add Exercise Modal */}
            <QuickAddExerciseModal
                open={quickAddModalOpen}
                onClose={() => setQuickAddModalOpen(false)}
                onSuccess={() => {
                    setSuccessMessage('Exercise logged successfully!');
                    refetchStats();
                    loadAIRecommendations();
                }}
            />

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSuccessMessage('')}
                    severity="success"
                    sx={{
                        backgroundColor: 'rgba(221, 237, 0, 0.15)',
                        color: '#dded00',
                        border: '1px solid rgba(221, 237, 0, 0.3)',
                        borderRadius: '12px',
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
} 
