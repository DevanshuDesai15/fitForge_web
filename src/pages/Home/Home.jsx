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
    Chip,
    Skeleton,
    Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    TrendingUp,
    Clock
} from "lucide-react";
import progressiveOverloadAI from '../../services/progressiveOverloadAI';
import { logGeminiStats } from '../../utils/geminiMonitor';
import { checkGeminiStatus } from '../../utils/geminiStatus';
import QuickAddExerciseModal from '../../components/workout/QuickAddExerciseModal';

// Components
import WelcomeHeader from './components/WelcomeHeader';
import TodaysFocusCard from './components/TodaysFocusCard';
import WeeklyStatsGrid from './components/WeeklyStatsGrid';
import RecentAchievementsList from './components/RecentAchievementsList';
import QuickActionsGrid from './components/QuickActionsGrid';
import WeeklyTargetsGrid from './components/WeeklyTargetsGrid';




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

export default function Home() {
    const [error, setError] = useState('');
    const [userData, setUserData] = useState({ username: '', fullName: '', gender: 'male' });
    const [greeting, setGreeting] = useState(getDynamicGreeting());
    const [weeklyStats, setWeeklyStats] = useState({
        totalVolume: 0,
        volumeUnit: 'kg', // Default; will update based on data or context
        goalProgress: 0,
        goalText: '0/4',
        streakDays: 0,
        workoutsDone: 0,
        activeMinutes: 0,
        // New targets
        targetedMuscles: { current: 0, target: 11 },
        weeklySets: { current: 0, target: 60 },
        uniqueExercises: { current: 0, target: 20 }
    });
    const [recentAchievements, setRecentAchievements] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [nextWorkout, setNextWorkout] = useState(null);
    const [isTomorrowFocus, setIsTomorrowFocus] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
            // Load dashboard data (currently using mock data for weekly stats)
            // Future: Load actual weekly stats from Firebase
            console.log('Dashboard loaded for user:', currentUser.uid);

            // Fetch user's active programs (using same logic as useWorkoutPrograms)
            const programsQuery = query(
                collection(db, "workoutPrograms"),
                where("userId", "==", currentUser.uid)
            );
            const programsSnapshot = await getDocs(programsQuery);
            const userPrograms = programsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch user's recently completed workouts to determine progress
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('userId', '==', currentUser.uid),
                where('completed', '==', true),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            const workoutsSnapshot = await getDocs(workoutsQuery);
            const completedWorkouts = workoutsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`Fetched ${completedWorkouts.length} completed workouts for user ${currentUser.uid}`);

            // Check if a workout was completed today
            let completedWorkoutToday = false;
            if (completedWorkouts.length > 0) {
                const lastWorkout = completedWorkouts[0]; // Already ordered descending by timestamp
                let workoutDate = null;
                if (lastWorkout.timestamp?.toDate) {
                    workoutDate = lastWorkout.timestamp.toDate();
                } else if (lastWorkout.timestamp) {
                    workoutDate = new Date(lastWorkout.timestamp);
                }

                if (workoutDate) {
                    const today = new Date();
                    if (
                        workoutDate.getDate() === today.getDate() &&
                        workoutDate.getMonth() === today.getMonth() &&
                        workoutDate.getFullYear() === today.getFullYear()
                    ) {
                        completedWorkoutToday = true;
                    }
                }
            }
            setIsTomorrowFocus(completedWorkoutToday);

            // Find the next day in the first active multi-day program
            let foundNextWorkout = null;
            for (const program of userPrograms) {
                if (program.days && program.days.length > 1) {
                    const programWorkouts = completedWorkouts.filter(w => w.templateId === program.id);

                    if (programWorkouts.length === 0) {
                        foundNextWorkout = { ...program.days[0], programName: program.name, programId: program.id };
                        break;
                    }

                    const completedDayNames = programWorkouts.map(w => w.dayName);
                    const sortedDays = [...program.days].sort((a, b) => a.id - b.id);

                    for (let i = 0; i < sortedDays.length; i++) {
                        const day = sortedDays[i];
                        if (!completedDayNames.includes(day.name)) {
                            foundNextWorkout = { ...day, programName: program.name, programId: program.id };
                            break;
                        }
                    }

                    if (foundNextWorkout) break;

                    // If all days completed in this program, suggest starting over
                    foundNextWorkout = { ...sortedDays[0], programName: program.name, programId: program.id };
                    break;
                }
            }

            setNextWorkout(foundNextWorkout);

            // Calculate "This Week" Stats from the fetched workouts (trailing 7 days)
            const todayForStats = new Date();
            const sevenDaysAgo = new Date(todayForStats);
            sevenDaysAgo.setDate(todayForStats.getDate() - 7);

            let recentWorkouts = 0;
            let recentMinutes = 0;
            let recentVolume = 0;
            let streakCount = 0; // Simplified streak check based on completedWorkouts

            let totalSets = 0;
            const uniqueExercisesSet = new Set();
            const targetedMusclesSet = new Set();

            const preferredUnit = 'lbs'; // Default to lbs; can extract from user data later if available

            // Filter workouts completed within the last 7 days
            const weekWorkouts = completedWorkouts.filter(workout => {
                let wDate = null;
                if (workout.timestamp?.toDate) {
                    wDate = workout.timestamp.toDate();
                } else if (workout.timestamp) {
                    wDate = new Date(workout.timestamp);
                }
                return wDate && wDate >= sevenDaysAgo;
            });

            weekWorkouts.forEach(workout => {
                recentWorkouts += 1;
                recentMinutes += (workout.duration || 0);

                // Calculate volume: sum of (weight * reps) for all sets across all exercises
                if (workout.exercises && Array.isArray(workout.exercises)) {
                    workout.exercises.forEach(exercise => {
                        let exerciseHasSets = false;
                        if (exercise.name) uniqueExercisesSet.add(exercise.name.toLowerCase());

                        // Extract target muscles (either from 'target', 'bodyPart', or 'muscles')
                        if (exercise.target) targetedMusclesSet.add(exercise.target.toLowerCase());
                        else if (exercise.bodyPart) targetedMusclesSet.add(exercise.bodyPart.toLowerCase());
                        else if (exercise.muscles && Array.isArray(exercise.muscles)) {
                            exercise.muscles.forEach(m => targetedMusclesSet.add(m.toLowerCase()));
                        }

                        if (exercise.sets && Array.isArray(exercise.sets)) {
                            exercise.sets.forEach(set => {
                                if (set.completed && set.weight && set.reps) {
                                    totalSets += 1;
                                    // Optionally handle kg vs lbs conversion here if needed. 
                                    const weight = parseFloat(set.weight) || 0;
                                    const reps = parseInt(set.reps) || 0;
                                    recentVolume += (weight * reps);
                                }
                            });
                        }
                    });
                }
            });

            // Calculate a simplified streak (days in a row with at least 1 workout, working backwards)
            const uniqueDates = new Set(completedWorkouts.map(w => {
                const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
                return d ? d.toDateString() : null;
            }).filter(Boolean));

            let tempDate = new Date();
            let checkStreak = true;
            // Check today first
            if (!uniqueDates.has(tempDate.toDateString())) {
                // if no workout today, check yesterday to keep streak alive
                tempDate.setDate(tempDate.getDate() - 1);
                if (!uniqueDates.has(tempDate.toDateString())) {
                    checkStreak = false;
                }
            }
            while (checkStreak) {
                streakCount++;
                tempDate.setDate(tempDate.getDate() - 1);
                if (!uniqueDates.has(tempDate.toDateString())) {
                    checkStreak = false;
                }
            }

            // Goal metrics
            const targetGoal = 4;
            let progressPercentage = (recentWorkouts / targetGoal) * 100;
            if (progressPercentage > 100) progressPercentage = 100;

            setWeeklyStats({
                totalVolume: Math.round(recentVolume),
                volumeUnit: preferredUnit,
                goalProgress: progressPercentage,
                goalText: `${recentWorkouts}/${targetGoal}`,
                streakDays: streakCount,
                workoutsDone: recentWorkouts,
                activeMinutes: Math.round(recentMinutes / 60), // convert seconds to minutes if duration is in seconds
                targetedMuscles: { current: targetedMusclesSet.size, target: 11 },
                weeklySets: { current: totalSets, target: 60 },
                uniqueExercises: { current: uniqueExercisesSet.size, target: 20 }
            });

            // Calculate Dynamic Achievements
            const newAchievements = [];
            const totalWorkoutsCount = completedWorkouts.length;

            // 1. Weekly Goal Smashed
            if (recentWorkouts >= targetGoal) {
                newAchievements.push({
                    id: 'weekly-goal',
                    title: 'Weekly Goal Smashed! 🎯',
                    description: `Completed ${recentWorkouts} workouts this week`,
                    timeAgo: 'Recently',
                    variant: 'primary',
                    icon: 'target'
                });
            }

            // 2. Streak Master
            if (streakCount >= 3) {
                newAchievements.push({
                    id: 'streak-master',
                    title: 'Streak Master! ⚡️',
                    description: `${streakCount} day active workout streak`,
                    timeAgo: 'Ongoing',
                    variant: 'warning', // Uses default dark grey card
                    icon: 'zap'
                });
            }

            // 3. Consistency Key
            if (totalWorkoutsCount >= 50) {
                newAchievements.push({ id: 'milestone-50', title: 'Consistency Key! 🗝️', description: 'Completed 50 total workouts', timeAgo: 'Milestone', variant: 'success', icon: 'trending-up' });
            } else if (totalWorkoutsCount >= 25) {
                newAchievements.push({ id: 'milestone-25', title: 'Consistency Key! 🗝️', description: 'Completed 25 total workouts', timeAgo: 'Milestone', variant: 'success', icon: 'trending-up' });
            } else if (totalWorkoutsCount >= 10) {
                newAchievements.push({ id: 'milestone-10', title: 'Consistency Key! 🗝️', description: 'Completed 10 total workouts', timeAgo: 'Milestone', variant: 'success', icon: 'trending-up' });
            }

            // 4. First Step
            if (totalWorkoutsCount === 1) {
                newAchievements.push({
                    id: 'first-step',
                    title: 'First Step! 🚀',
                    description: 'Completed your very first workout',
                    timeAgo: 'Just now',
                    variant: 'primary',
                    icon: 'activity'
                });
            }

            setRecentAchievements(newAchievements);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        }
    }, [currentUser?.uid]);

    const loadAIRecommendations = useCallback(async () => {
        if (!currentUser?.uid) return;

        try {
            setAiLoading(true);

            // Monitor API usage in development
            if (import.meta.env?.MODE === 'development') {
                logGeminiStats();
                checkGeminiStatus();
            }

            // Timeout safety net — if AI service hangs, resolve after 30 seconds
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('AI recommendations timed out')), 30000);
            });

            const loadPromise = (async () => {
                // Get workout history analysis
                const analyses = await progressiveOverloadAI.analyzeWorkoutHistory(currentUser.uid);

                if (analyses && analyses.length > 0) {
                    const topAnalyses = analyses.slice(0, 3);
                    const exerciseIds = topAnalyses.map(analysis => analysis.exerciseId);

                    const batchProgressions = await progressiveOverloadAI.calculateBatchProgressions(
                        currentUser.uid,
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
    }, [currentUser?.uid]);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
            loadUserData();
            loadAIRecommendations();
        }
    }, [currentUser?.uid, loadDashboardData, loadUserData, loadAIRecommendations]);

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
                <WelcomeHeader
                    greeting={greeting}
                    displayName={displayName}
                    streakDays={weeklyStats.streakDays}
                    onLogWorkout={() => setQuickAddModalOpen(true)}
                    onStartTraining={() => navigate('/workout')}
                />

                {/* Today's / Tomorrow's Focus */}
                <TodaysFocusCard
                    nextWorkout={nextWorkout}
                    isTomorrowFocus={isTomorrowFocus}
                />

                {/* This Week Stats */}
                <WeeklyStatsGrid weeklyStats={weeklyStats} />

                {/* Weekly Targets */}
                <Box sx={{ mb: 4, mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                        <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                            Weekly Targets
                        </Typography>
                    </Box>
                    <WeeklyTargetsGrid weeklyStats={weeklyStats} />
                </Box>

                {/* Main Content Grid - Achievements and AI Recommendations */}
                <Grid container spacing={4}>
                    {/* Left Column - Recent Achievements */}
                    <Grid item xs={12} lg={8}>
                        <RecentAchievementsList achievements={recentAchievements} />
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
                                                <Brain size={32} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '12px' }} />
                                                <Typography variant="body1" sx={{
                                                    color: 'text.secondary',
                                                    mb: 1
                                                }}>
                                                    No AI recommendations yet
                                                </Typography>
                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.5)',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    Complete more workouts to get personalized suggestions
                                                </Typography>
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
                    // Optionally reload AI recommendations after adding exercise
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