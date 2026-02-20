import { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress, CardContent, Tooltip } from '@mui/material';
import { MdPsychology, MdShowChart, MdTrackChanges, MdEmojiEvents } from 'react-icons/md';
import { Target, Flame, Clock, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { useUnits } from '../../contexts/UnitsContext';
import { StyledCard } from './components/shared/StyledComponents';
import { useProgressData } from './hooks/useProgressData';
import { useAIInsights } from './hooks/useAIInsights';
import { usePlateauDetection } from './hooks/usePlateauDetection';
import AIDashboard from './AIDashboard';
import GoalsSection from './components/GoalsSection';
import AchievementsSection from './components/AchievementsSection';

const Progress = () => {
    // Main navigation state
    const [activeMainTab, setActiveMainTab] = useState(0);
    const { weightUnit } = useUnits();

    // Progress data states
    const [selectedExercise, setSelectedExercise] = useState('');
    const [timeRange, setTimeRange] = useState('3months');
    const [showOnlyRecent, setShowOnlyRecent] = useState(false);

    // Custom hooks for data management
    const {
        exercises,
        goals,
        loading,
        error,
        progressData,
        personalRecords,
        availableExercises,
        loadGoals,
        setError
    } = useProgressData(activeMainTab);

    const {
        aiInsights,
        progressionAnalyses,
        loadAIInsights
    } = useAIInsights();

    const {
        plateauAlerts,
        appliedInterventions,
        dismissedAlerts,
        loadPlateauAlerts,
        handleInterventionApply,
        handleAlertDismiss
    } = usePlateauDetection();

    // Weight unit is now automatically provided by UnitsContext

    // Load AI data when exercises are available
    useEffect(() => {
        if (availableExercises.length > 0 && (activeMainTab === 0 || activeMainTab === 1 || activeMainTab === 3)) {
            loadAIInsights(availableExercises);
            loadPlateauAlerts(availableExercises);
        }
    }, [availableExercises, activeMainTab, loadAIInsights, loadPlateauAlerts]);

    // Set default selected exercise
    useEffect(() => {
        if (!selectedExercise && Object.keys(progressData).length > 0) {
            setSelectedExercise(Object.keys(progressData)[0]);
        }
    }, [progressData, selectedExercise]);

    const renderOverview = () => {
        const now = new Date();
        const year = now.getFullYear();
        const WEEKLY_GOAL = 5;
        const DOT_SIZE = 13;
        const DOT_GAP = 3;

        // ── Helper: normalize timestamp ──────────────────────────
        const toDate = (ts) => ts?.toDate ? ts.toDate() : new Date(ts);

        // ── Weekly buckets ───────────────────────────────────────
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);
        const startOfPrevWeek = new Date(startOfThisWeek);
        startOfPrevWeek.setDate(startOfThisWeek.getDate() - 7);

        const thisWeekEx = exercises.filter(ex => toDate(ex.timestamp) >= startOfThisWeek);
        const prevWeekEx = exercises.filter(ex => {
            const d = toDate(ex.timestamp);
            return d >= startOfPrevWeek && d < startOfThisWeek;
        });

        const uniqueDays = (arr) => new Set(arr.map(ex => {
            const d = toDate(ex.timestamp);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })).size;

        const thisWeekDays = uniqueDays(thisWeekEx);
        const prevWeekDays = uniqueDays(prevWeekEx);
        const weeklyGoalChange = thisWeekDays - prevWeekDays;

        // ── Active minutes (8 min per exercise entry, rough estimate) ──
        const activeMin = thisWeekEx.length * 8;
        const prevActiveMin = prevWeekEx.length * 8;
        const activeMinChange = prevActiveMin > 0
            ? Math.round(((activeMin - prevActiveMin) / prevActiveMin) * 100)
            : 0;

        // ── Volume this week ─────────────────────────────────────
        const calcVolume = (arr) => arr.reduce((sum, ex) => {
            const sets = Array.isArray(ex.sets) ? ex.sets : [];
            return sum + sets.reduce((s, set) => s + (parseFloat(set.weight || 0) * parseInt(set.reps || 0)), 0);
        }, 0);
        const weekVol = calcVolume(thisWeekEx);
        const prevVol = calcVolume(prevWeekEx);
        const volChange = prevVol > 0 ? Math.round(((weekVol - prevVol) / prevVol) * 100) : 0;

        // ── Current streak ───────────────────────────────────────
        const allDayStrs = [...new Set(exercises.map(ex => {
            const d = toDate(ex.timestamp);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }))].sort();
        let streak = 0;
        const check = new Date(now);
        check.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
            if (allDayStrs.includes(key)) {
                streak++;
                check.setDate(check.getDate() - 1);
            } else if (i === 0) {
                check.setDate(check.getDate() - 1); // allow today to have no workout yet
            } else {
                break;
            }
        }

        // ── Heatmap data ─────────────────────────────────────────
        const activityMap = {};
        exercises.forEach(ex => {
            const d = toDate(ex.timestamp);
            if (d.getFullYear() === year) {
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                activityMap[key] = (activityMap[key] || 0) + 1;
            }
        });

        // Build week columns (Sun–Sat)
        const jan1 = new Date(year, 0, 1);
        const dec31 = new Date(year, 11, 31);
        const gridStart = new Date(jan1);
        gridStart.setDate(jan1.getDate() - jan1.getDay());

        const weeks = [];
        const cursor = new Date(gridStart);
        while (cursor <= dec31) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
                week.push({ date: new Date(cursor), count: activityMap[key] || 0, inYear: cursor.getFullYear() === year });
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(week);
        }

        // Month label positions
        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthPositions = [];
        let lastMonth = -1;
        weeks.forEach((week, wi) => {
            const first = week.find(d => d.inYear);
            if (first) {
                const m = first.date.getMonth();
                if (m !== lastMonth) { monthPositions.push({ m, wi }); lastMonth = m; }
            }
        });

        const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'Sa'];
        const dotColor = (count) => {
            if (!count) return 'rgba(255,255,255,0.07)';
            return '#dded00';
        };

        const recentDays = uniqueDays(exercises.filter(ex => (now - toDate(ex.timestamp)) / 86400000 <= 7));

        // ── Badge component ──────────────────────────────────────
        const Badge = ({ value, isPercent = true }) => {
            if (value === 0) return null;
            const positive = value > 0;
            return (
                <Box sx={{
                    background: positive ? 'rgba(52,199,89,0.18)' : 'rgba(255,59,48,0.18)',
                    color: positive ? '#34c759' : '#ff3b30',
                    borderRadius: '20px', px: 1, py: '2px',
                    fontSize: '0.72rem', fontWeight: '700', lineHeight: 1.4,
                }}>
                    {positive ? '+' : ''}{value}{isPercent ? '%' : ''}
                </Box>
            );
        };

        return (
            <Box>
                {/* ── Stat Cards ─────────────────────────────────── */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    mb: 3,
                }}>
                    {[
                        {
                            label: 'Weekly Goal',
                            icon: <Target size={18} color="rgba(255,255,255,0.25)" />,
                            value: `${thisWeekDays}/${WEEKLY_GOAL}`,
                            badge: <Badge value={weeklyGoalChange} isPercent={false} />,
                            sub: 'workouts completed',
                            border: false,
                        },
                        {
                            label: 'Volume',
                            icon: <Flame size={18} color="rgba(255,255,255,0.25)" />,
                            value: weekVol >= 1000 ? `${(weekVol / 1000).toFixed(1)}k` : weekVol.toFixed(0),
                            badge: <Badge value={volChange} />,
                            sub: `${weightUnit} this week`,
                            border: false,
                        },
                        {
                            label: 'Active Minutes',
                            icon: <Clock size={18} color="rgba(255,255,255,0.25)" />,
                            value: activeMin,
                            badge: <Badge value={activeMinChange} />,
                            sub: 'this week',
                            border: false,
                        },
                        {
                            label: 'Streak',
                            icon: <Zap size={18} color={streak > 0 ? '#dded00' : 'rgba(255,255,255,0.25)'} />,
                            value: streak,
                            badge: (
                                <Box sx={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', borderRadius: '20px', px: 1, py: '2px', fontSize: '0.72rem', fontWeight: '600' }}>
                                    days
                                </Box>
                            ),
                            sub: 'current streak',
                            border: streak > 0,
                        },
                    ].map((card) => (
                        <Box
                            key={card.label}
                            sx={{
                                background: '#2a2a2a',
                                borderRadius: '16px',
                                px: 3,
                                py: 2.5,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: { xs: '120px', sm: '130px', md: '140px' },
                                border: card.border ? '1px solid rgba(221,237,0,0.35)' : '1px solid transparent',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontWeight: '500', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    {card.label}
                                </Typography>
                                {card.icon}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: '700', color: 'white', lineHeight: 1 }}>
                                    {card.value}
                                </Typography>
                                {card.badge}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                {card.sub}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* ── Activity Heatmap ────────────────────────────── */}
                <Box sx={{ background: '#2a2a2a', borderRadius: '16px', p: 3, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography sx={{ color: '#dded00', fontSize: '1rem' }}>
                            {year} Workout Activity
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            {recentDays} workout{recentDays !== 1 ? 's' : ''} in 7 days
                        </Typography>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        {/* Grid */}
                        <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                            {/* Day labels — fixed width column */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${DOT_GAP}px`, flexShrink: 0, width: '16px', mr: '4px' }}>
                                {/* spacer row for month labels */}
                                <Box sx={{ height: '18px', mb: '4px' }} />
                                {DAY_LABELS.map((label, i) => (
                                    <Box key={i} sx={{ height: `${DOT_SIZE}px`, display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>{label}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Week columns — space-between fills full width */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                {weeks.map((week, wi) => {
                                    const monthLabel = monthPositions.find(mp => mp.wi === wi);
                                    return (
                                    <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: `${DOT_GAP}px` }}>
                                        {/* Month label row — same height as spacer in day labels */}
                                        <Box sx={{ height: '18px', mb: '4px', display: 'flex', alignItems: 'flex-end' }}>
                                            {monthLabel && (
                                                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', lineHeight: 1 }}>
                                                    {MONTH_NAMES[monthLabel.m]}
                                                </Typography>
                                            )}
                                        </Box>
                                        {week.map((day, di) => {
                                            const dateLabel = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            const tooltipText = !day.inYear ? '' :
                                                day.count === 0 ? `No workouts on ${dateLabel}` :
                                                `${day.count} workout${day.count !== 1 ? 's' : ''} on ${dateLabel}`;
                                            return (
                                                <Tooltip key={di} title={tooltipText} placement="top" arrow disableHoverListener={!day.inYear}>
                                                    <Box
                                                        sx={{
                                                            width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px`,
                                                            borderRadius: '50%',
                                                            background: day.inYear ? dotColor(day.count) : 'transparent',
                                                            cursor: day.inYear && day.count > 0 ? 'pointer' : 'default',
                                                            transition: 'transform 0.15s ease',
                                                            '&:hover': day.inYear ? { transform: 'scale(1.6)', zIndex: 10 } : {},
                                                        }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                    </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Legend */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>Less</Typography>
                            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {[0, 1].map(level => (
                                    <Box key={level} sx={{ width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px`, borderRadius: '50%', background: dotColor(level) }} />
                                ))}
                            </Box>
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>More</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ── Weekly Performance + Recent Achievements ──── */}
                {(() => {
                    // Weekly chart data (Mon–Sun, volume per day)
                    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const weeklyChartData = DAY_NAMES.map((day, idx) => {
                        const jsDay = idx === 6 ? 0 : idx + 1; // Mon=1...Sat=6,Sun=0
                        const dayVol = calcVolume(thisWeekEx.filter(ex => toDate(ex.timestamp).getDay() === jsDay));
                        return { day, volume: Math.round(dayVol) };
                    });

                    // Consistency stats
                    const longestStreakYear = (() => {
                        const sorted = allDayStrs.filter(d => d.startsWith(String(year)));
                        let best = 0, cur = 1;
                        for (let i = 1; i < sorted.length; i++) {
                            const a = new Date(sorted[i - 1]), b = new Date(sorted[i]);
                            const diff = Math.round((b - a) / 86400000);
                            cur = diff === 1 ? cur + 1 : 1;
                            best = Math.max(best, cur);
                        }
                        return sorted.length > 0 ? Math.max(best, 1) : 0;
                    })();

                    const mostActiveMonth = (() => {
                        const counts = Array(12).fill(0);
                        exercises.forEach(ex => {
                            const d = toDate(ex.timestamp);
                            if (d.getFullYear() === year) counts[d.getMonth()]++;
                        });
                        const maxIdx = counts.indexOf(Math.max(...counts));
                        return counts[maxIdx] > 0 ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][maxIdx] : '—';
                    })();

                    const weeksElapsed = Math.max(1, Math.ceil((now - new Date(year, 0, 1)) / (7 * 86400000)));
                    const avgPerWeek = (exercises.filter(ex => toDate(ex.timestamp).getFullYear() === year).length
                        ? (new Set(exercises.filter(ex => toDate(ex.timestamp).getFullYear() === year)
                            .map(ex => { const d = toDate(ex.timestamp); return `${d.getMonth()}-${d.getDate()}`; })).size / weeksElapsed)
                        : 0).toFixed(1);

                    // Achievements
                    const recentAchievements = [];
                    if (thisWeekDays >= WEEKLY_GOAL) {
                        recentAchievements.push({ title: 'Weekly Goal Achieved!', sub: `Completed ${thisWeekDays} workouts this week`, icon: <Target size={20} />, iconBg: '#dded00', iconColor: '#000', rowBg: 'rgba(221,237,0,0.08)' });
                    }
                    const topPR = personalRecords[0];
                    if (topPR) {
                        recentAchievements.push({ title: 'Personal Best!', sub: `New ${topPR.exerciseName} record: ${topPR.weight}${weightUnit}`, icon: <Flame size={20} />, iconBg: '#22c55e', iconColor: '#fff', rowBg: 'transparent' });
                    }

                    return (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 3 }}>

                            {/* Weekly Performance */}
                            <Box sx={{ background: '#2a2a2a', borderRadius: '16px', p: 3 }}>
                                <Typography sx={{ color: 'white', fontWeight: '700', fontSize: '1rem', mb: 2.5 }}>
                                    Weekly Performance
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={weeklyChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                        <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <ChartTooltip
                                            contentStyle={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }}
                                            formatter={(val) => [`${val} ${weightUnit}`, 'Volume']}
                                        />
                                        <Line type="monotone" dataKey="volume" stroke="#dded00" strokeWidth={2.5} dot={{ fill: '#dded00', r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Recent Achievements */}
                            <Box sx={{ background: '#2a2a2a', borderRadius: '16px', p: 3 }}>
                                <Typography sx={{ color: 'white', fontWeight: '700', fontSize: '1rem', mb: 2.5 }}>
                                    Recent Achievements
                                </Typography>

                                {recentAchievements.length === 0 ? (
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mb: 2 }}>Complete workouts to unlock achievements.</Typography>
                                ) : (
                                    recentAchievements.map((a, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, background: a.rowBg, borderRadius: '12px', px: 2, py: 1.5, mb: 1.5 }}>
                                            <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: a.iconColor }}>
                                                {a.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ color: 'white', fontWeight: '700', mb: 0.25 }}>{a.title}</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>{a.sub}</Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}

                                <Typography sx={{ color: 'white', fontWeight: '700', fontSize: '0.95rem', mt: 2.5, mb: 1.5 }}>
                                    Consistency Insights
                                </Typography>
                                {[
                                    { label: 'Longest streak this year', value: `${longestStreakYear} days`, highlight: true },
                                    { label: 'Most active month', value: mostActiveMonth, highlight: false },
                                    { label: 'Average workouts/week', value: avgPerWeek, highlight: false },
                                ].map(({ label, value, highlight }) => (
                                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
                                        <Typography variant="body2" sx={{ color: highlight ? '#dded00' : 'white', fontWeight: '600' }}>{value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    );
                })()}
            </Box>
        );
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Typography
                    variant="h4"
                    sx={{
                        color: '#ffffff',
                        mb: 1
                    }}
                >
                    Progress & Goals
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        mb: 3
                    }}
                >
                    Track your fitness journey, achievements, and goals
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff4444' }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* Main Navigation */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        background: '#1e1e1e',
                        borderRadius: '50px',
                        p: '5px',
                        gap: '4px',
                        mb: 3,
                    }}
                >
                    {[
                        { label: 'Overview', icon: <MdShowChart size={16} /> },
                        { label: 'Goals', icon: <MdTrackChanges size={16} /> },
                        { label: 'Achievements', icon: <MdEmojiEvents size={16} /> },
                        { label: 'AI Dashboard', icon: <MdPsychology size={16} /> },
                    ].map((tab, index) => (
                        <Box
                            key={tab.label}
                            onClick={() => setActiveMainTab(index)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                px: 2,
                                py: '8px',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                background: activeMainTab === index ? '#2e2e2e' : 'transparent',
                                color: activeMainTab === index ? '#fff' : 'rgba(255,255,255,0.45)',
                                fontWeight: activeMainTab === index ? 600 : 400,
                                fontSize: '0.82rem',
                                transition: 'all 0.2s',
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    color: activeMainTab === index ? '#fff' : 'rgba(255,255,255,0.7)',
                                    background: activeMainTab === index ? '#2e2e2e' : 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </Box>
                    ))}
                </Box>

                {/* Main Content */}
                <StyledCard>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress sx={{ color: '#dded00' }} />
                            </Box>
                        ) : (
                            <>
                                {activeMainTab === 0 && renderOverview()}
                                {activeMainTab === 1 && (
                                    <GoalsSection
                                        goals={goals}
                                        exercises={exercises}
                                        availableExercises={availableExercises}
                                        weightUnit={weightUnit}
                                        onGoalsUpdate={loadGoals}
                                        setError={setError}
                                    />
                                )}
                                {activeMainTab === 2 && (
                                    <AchievementsSection
                                        personalRecords={personalRecords}
                                        progressionAnalyses={progressionAnalyses}
                                        showOnlyRecent={showOnlyRecent}
                                        setShowOnlyRecent={setShowOnlyRecent}
                                        weightUnit={weightUnit}
                                    />
                                )}
                                {activeMainTab === 3 && (
                                    <AIDashboard
                                        progressionAnalyses={progressionAnalyses}
                                        plateauAlerts={plateauAlerts}
                                        appliedInterventions={appliedInterventions}
                                        dismissedAlerts={dismissedAlerts}
                                        onInterventionApply={handleInterventionApply}
                                        onAlertDismiss={handleAlertDismiss}
                                        progressData={progressData}
                                        selectedExercise={selectedExercise}
                                        setSelectedExercise={setSelectedExercise}
                                        timeRange={timeRange}
                                        setTimeRange={setTimeRange}
                                        exercises={exercises}
                                        personalRecords={personalRecords}
                                        weightUnit={weightUnit}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
};

export default Progress;
