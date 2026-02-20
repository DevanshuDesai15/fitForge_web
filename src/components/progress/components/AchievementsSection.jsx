import PropTypes from 'prop-types';
import { Box, Typography, FormControlLabel, Switch, Divider } from '@mui/material';
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from 'react-icons/md';
import { Trophy, Flame, Zap } from 'lucide-react';
import { format, subMonths, isWithinInterval, startOfMonth, formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getMedalColor = (index) => {
    if (index === 0) return { bg: 'rgba(255, 215, 0, 0.18)', icon: '#ffd700' };
    if (index === 1) return { bg: 'rgba(192, 192, 192, 0.15)', icon: '#c0c0c0' };
    if (index === 2) return { bg: 'rgba(205, 127, 50, 0.15)', icon: '#cd7f32' };
    return { bg: 'rgba(221, 237, 0, 0.12)', icon: '#dded00' };
};

const getTrendStyle = (trend) => {
    if (trend === 'improving') return { color: '#4caf50', Icon: MdTrendingUp };
    if (trend === 'declining') return { color: '#f44336', Icon: MdTrendingDown };
    return { color: '#ffc107', Icon: MdTrendingFlat };
};

const getAchievementIcon = (index) => {
    if (index === 0) return <Trophy size={20} />;
    if (index % 3 === 1) return <Flame size={20} />;
    return <Zap size={20} />;
};

// ---------------------------------------------------------------------------
// AchievementsSection
// ---------------------------------------------------------------------------

const AchievementsSection = ({
    personalRecords,
    progressionAnalyses,
    showOnlyRecent,
    setShowOnlyRecent,
    weightUnit,
}) => {
    const filteredRecords = showOnlyRecent
        ? personalRecords.filter((r) =>
              r.date &&
              isWithinInterval(r.date, {
                  start: subMonths(new Date(), 3),
                  end: new Date(),
              })
          )
        : personalRecords;

    // Stats derived from available data
    const thisMonthRecords = personalRecords.filter(
        (r) => r.date && isWithinInterval(r.date, { start: startOfMonth(new Date()), end: new Date() })
    );
    const improvingCount = progressionAnalyses.filter((a) => a.progressionTrend === 'improving').length;
    const successRate =
        progressionAnalyses.length > 0
            ? Math.round((improvingCount / progressionAnalyses.length) * 100)
            : 0;

    const statGrid = [
        { value: filteredRecords.length, label: 'Personal Records' },
        { value: improvingCount, label: 'Improving' },
        { value: thisMonthRecords.length, label: 'This Month' },
        { value: progressionAnalyses.length, label: 'Tracked' },
    ];

    const monthlyRows = [
        { label: 'PRs this month', value: thisMonthRecords.length, color: '#fff' },
        { label: 'Exercises improving', value: improvingCount, color: '#dded00' },
        { label: 'Success rate', value: `${successRate}%`, color: '#4caf50' },
    ];

    const panelSx = {
        background: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '16px',
        p: 3,
    };

    return (
        <Box>
            {/* Page header + filter toggle */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ color: '#dded00', fontWeight: 700 }}>
                        Achievements
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.25 }}>
                        Your fitness milestones and personal records
                    </Typography>
                </Box>
                <FormControlLabel
                    sx={{ gap: 1 }}
                    control={
                        <Switch
                            checked={showOnlyRecent}
                            onChange={(e) => setShowOnlyRecent(e.target.checked)}
                            sx={{
                                width: 48,
                                height: 28,
                                padding: 0,
                                '& .MuiSwitch-switchBase': {
                                    padding: 0,
                                    margin: '3px',
                                    transitionDuration: '250ms',
                                    color: '#fff',
                                    '&.Mui-checked': {
                                        transform: 'translateX(20px)',
                                        color: '#1a1a1a',
                                        '& + .MuiSwitch-track': {
                                            backgroundColor: '#dded00',
                                            opacity: 1,
                                            border: 0,
                                        },
                                    },
                                },
                                '& .MuiSwitch-thumb': {
                                    width: 22,
                                    height: 22,
                                    boxShadow: 'none',
                                },
                                '& .MuiSwitch-track': {
                                    borderRadius: 14,
                                    backgroundColor: '#3a3a3a',
                                    opacity: 1,
                                },
                            }}
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            Recent only (3 months)
                        </Typography>
                    }
                />
            </Box>

            {/* Two-column layout */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
                    gap: 3,
                    alignItems: 'stretch',
                }}
            >
                {/* ── LEFT: Recent Achievements list ── */}
                <Box sx={panelSx}>
                    <Typography
                        variant="h6"
                        sx={{ color: '#fff', mb: 2.5, fontSize: '1rem' }}
                    >
                        Recent Achievements ({filteredRecords.length})
                    </Typography>

                    {filteredRecords.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                                No personal records found for the selected time period.
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: 'calc(100vh - 360px)',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                pr: 0.5,
                                '&::-webkit-scrollbar': { width: '4px' },
                                '&::-webkit-scrollbar-track': { background: 'transparent' },
                                '&::-webkit-scrollbar-thumb': {
                                    background: 'rgba(221, 237, 0, 0.3)',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    background: 'rgba(221, 237, 0, 0.6)',
                                },
                            }}
                        >
                            {filteredRecords.map((record, index) => {
                                const analysis = progressionAnalyses.find(
                                    (a) => a.exerciseName === record.exerciseName
                                );
                                const isFirst = index === 0;
                                const medal = getMedalColor(index);
                                const trend = analysis ? getTrendStyle(analysis.progressionTrend) : null;
                                const TrendIcon = trend?.Icon;

                                const setsLabel = Array.isArray(record.sets)
                                    ? `${record.sets.length} sets`
                                    : `${record.reps} reps × ${record.sets} sets`;

                                const timeAgo = record.date
                                    ? formatDistanceToNow(record.date, { addSuffix: true })
                                    : format(record.date, 'MMM dd, yyyy');

                                return (
                                    <Box key={record.exerciseName}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                px: 1.5,
                                                py: 1.25,
                                                borderRadius: '10px',
                                                background: isFirst
                                                    ? 'rgba(100, 110, 20, 0.22)'
                                                    : 'transparent',
                                                transition: 'background 0.18s',
                                                '&:hover': {
                                                    background: isFirst
                                                        ? 'rgba(100, 110, 20, 0.3)'
                                                        : 'rgba(255,255,255,0.04)',
                                                },
                                            }}
                                        >
                                            {/* Icon */}
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: '50%',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: medal.bg,
                                                    color: medal.icon,
                                                }}
                                            >
                                                {getAchievementIcon(index)}
                                            </Box>

                                            {/* Title + description */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    sx={{
                                                        color: '#fff',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        lineHeight: 1.3,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {record.exerciseName}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.45)',
                                                        fontSize: '0.78rem',
                                                        mt: 0.2,
                                                    }}
                                                >
                                                    {record.weight}
                                                    {weightUnit} · {setsLabel}
                                                </Typography>
                                            </Box>

                                            {/* Time + trend */}
                                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                <Typography
                                                    sx={{
                                                        color: '#4caf50',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {timeAgo}
                                                </Typography>
                                                {trend && (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-end',
                                                            gap: 0.25,
                                                            mt: 0.3,
                                                        }}
                                                    >
                                                        <TrendIcon
                                                            style={{
                                                                color: trend.color,
                                                                fontSize: '13px',
                                                            }}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                color: trend.color,
                                                                fontSize: '0.68rem',
                                                                fontWeight: 600,
                                                                textTransform: 'capitalize',
                                                            }}
                                                        >
                                                            {analysis.progressionTrend}
                                                            {analysis.progressionRate !== 0 && (
                                                                <>
                                                                    {' '}
                                                                    (
                                                                    {analysis.progressionRate > 0 ? '+' : ''}
                                                                    {analysis.progressionRate.toFixed(1)}
                                                                    {weightUnit}/wk)
                                                                </>
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {index < filteredRecords.length - 1 && (
                                            <Divider
                                                sx={{
                                                    borderColor: 'rgba(255,255,255,0.05)',
                                                    mx: 1.5,
                                                }}
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>

                {/* ── RIGHT: Achievement Stats ── */}
                <Box sx={{ background: 'rgba(30, 30, 30, 0.9)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '16px', p: 3}}>
                    <Typography
                        variant="h6"
                        sx={{ color: '#fff', mb: 3, fontSize: '1rem' }}
                    >
                        Achievement Stats
                    </Typography>

                    {/* 2×2 big-number grid */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        {statGrid.map((stat) => (
                            <Box
                                key={stat.label}
                                sx={{ textAlign: 'center', py: 1.5 }}
                            >
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                    }}
                                >
                                    {stat.value}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: '0.75rem',
                                        mt: 0.5,
                                    }}
                                >
                                    {stat.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2.5 }} />

                    {/* Monthly Progress rows */}
                    <Typography
                        sx={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            mb: 1.75,
                        }}
                    >
                        Monthly Progress
                    </Typography>
                    {monthlyRows.map((row) => (
                        <Box
                            key={row.label}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.25,
                            }}
                        >
                            <Typography
                                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.84rem' }}
                            >
                                {row.label}
                            </Typography>
                            <Typography
                                sx={{
                                    color: row.color,
                                    fontWeight: 700,
                                    fontSize: '0.84rem',
                                }}
                            >
                                {row.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

AchievementsSection.propTypes = {
    personalRecords: PropTypes.arrayOf(PropTypes.object).isRequired,
    progressionAnalyses: PropTypes.arrayOf(PropTypes.object).isRequired,
    showOnlyRecent: PropTypes.bool.isRequired,
    setShowOnlyRecent: PropTypes.func.isRequired,
    weightUnit: PropTypes.string,
};

AchievementsSection.defaultProps = {
    weightUnit: 'kg',
};

export default AchievementsSection;
