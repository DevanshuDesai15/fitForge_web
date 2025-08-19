import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Tooltip,
    useTheme,
    useMediaQuery,
    Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import {
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    format,
    getDay,
    isToday,
    isSameDay
} from 'date-fns';

const CalendarContainer = styled(Paper)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '24px',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box'
}));

const CalendarGrid = styled(Box)({
    display: 'grid',
    gridAutoFlow: 'column',
    gap: '3px',
    marginTop: '16px',
    justifyContent: 'start'
});

const DaySquare = styled(Box, {
    shouldForwardProp: (prop) => !['intensity', 'isToday', 'size'].includes(prop),
})(({ theme, intensity, isToday, size }) => {
    const getColor = () => {
        if (intensity === 0) return 'rgba(255, 255, 255, 0.1)';
        if (intensity === 1) return 'rgba(221, 237, 0, 0.3)';
        if (intensity === 2) return 'rgba(221, 237, 0, 0.5)';
        if (intensity === 3) return 'rgba(221, 237, 0, 0.7)';
        if (intensity >= 4) return theme.palette.primary.main;
        return 'rgba(255, 255, 255, 0.1)';
    };

    return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '2px',
        backgroundColor: getColor(),
        border: isToday ? `1px solid ${theme.palette.primary.main}` : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'scale(1.2)',
            borderRadius: '3px',
            boxShadow: `0 0 8px ${getColor()}`,
        }
    };
});

const MonthLabel = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    fontWeight: 500,
    textAlign: 'center'
}));

const DayLabel = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'size',
})(({ theme, size }) => ({
    color: theme.palette.text.secondary,
    fontSize: '0.7rem',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}));

const LegendContainer = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px'
});

const LegendSquare = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'intensity',
})(({ theme, intensity }) => {
    const getColor = () => {
        if (intensity === 0) return 'rgba(255, 255, 255, 0.1)';
        if (intensity === 1) return 'rgba(221, 237, 0, 0.3)';
        if (intensity === 2) return 'rgba(221, 237, 0, 0.5)';
        if (intensity === 3) return 'rgba(221, 237, 0, 0.7)';
        if (intensity >= 4) return theme.palette.primary.main;
        return 'rgba(255, 255, 255, 0.1)';
    };

    return {
        width: '10px',
        height: '10px',
        borderRadius: '2px',
        backgroundColor: getColor(),
    };
});

export default function WorkoutCalendar({ workouts = [] }) {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const [currentYear] = useState(new Date().getFullYear());
    const [workoutData, setWorkoutData] = useState({});
    const [error, setError] = useState(null);
    const [squareSize, setSquareSize] = useState(isSmall ? 9 : 12); // px
    const gapSize = isSmall ? 2 : 3; // px
    const MONTH_LABEL_ROW_HEIGHT = isSmall ? 18 : 20; // px
    const gridWrapperRef = useRef(null);
    const GRID_TOP_MARGIN = 16; // must match CalendarGrid marginTop

    // Process workout data into daily counts
    useEffect(() => {
        try {
            const data = {};
            if (Array.isArray(workouts)) {
                workouts.forEach(workout => {
                    if (workout && workout.timestamp) {
                        const date = format(new Date(workout.timestamp), 'yyyy-MM-dd');
                        data[date] = (data[date] || 0) + 1;
                    }
                });
            }
            setWorkoutData(data);
            setError(null);
        } catch (err) {
            console.error('Error processing workout data:', err);
            setError('Error processing workout data');
            setWorkoutData({});
        }
    }, [workouts]);

    // Generate days from start of year to today (or end of year if past year)
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const today = new Date();
    const yearEnd = currentYear === today.getFullYear() ? today : endOfYear(new Date(currentYear, 0, 1));
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Group days by weeks - create a more robust week structure
    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first day of the year
    const firstDayOfWeek = getDay(yearStart);
    for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
    }

    allDays.forEach((day) => {
        currentWeek.push(day);

        if (currentWeek.length === 7) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }
    });

    // Add the last partial week if it exists
    if (currentWeek.length > 0) {
        // Fill the remaining slots with nulls to maintain grid structure
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    // Get workout count for a specific date
    const getWorkoutCount = (date) => {
        if (!date) return 0;
        const dateStr = format(date, 'yyyy-MM-dd');
        return workoutData[dateStr] || 0;
    };

    // Get intensity level (0-4) based on workout count
    const getIntensity = (count) => {
        if (count === 0) return 0;
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count === 3) return 3;
        return 4; // 4+ workouts
    };

    // Compute month label positions aligned to week columns
    const monthPositions = [];
    for (let month = 0; month < 12; month++) {
        const firstOfMonth = new Date(currentYear, month, 1);
        let weekIndex = weeks.findIndex(week =>
            week.some(d => d && isSameDay(d, firstOfMonth))
        );
        // Fallback: if exact first day isn't in the grid due to leading nulls,
        // find first week that contains any day from this month
        if (weekIndex === -1) {
            weekIndex = weeks.findIndex(week =>
                week.some(d => d && d.getMonth() === month)
            );
        }
        if (weekIndex !== -1) {
            monthPositions.push({ label: format(firstOfMonth, 'MMM'), weekIndex });
        }
    }

    // Calculate total workouts
    const totalWorkouts = Object.values(workoutData).reduce((sum, count) => sum + count, 0);
    const workoutDays = Object.keys(workoutData).length;

    // Responsively adjust square size to consume available width
    useEffect(() => {
        // On small screens, use a fixed square size and allow horizontal scrolling
        if (isSmall) {
            setSquareSize(9);
            return;
        }

        const element = gridWrapperRef.current;
        if (!element) return;

        const updateSize = () => {
            const weeksCount = weeks.length || 1;
            const availableWidth = element.clientWidth;
            const computed = Math.floor(
                Math.max(10, (availableWidth - (weeksCount - 1) * gapSize) / weeksCount)
            );
            if (computed && computed !== squareSize) {
                setSquareSize(computed);
            }
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, [isSmall, gapSize, weeks.length, squareSize]);

    if (error) {
        return (
            <CalendarContainer>
                <Typography variant="h6" sx={{ color: theme.palette.error.main, textAlign: 'center' }}>
                    {error}
                </Typography>
            </CalendarContainer>
        );
    }

    return (
        <CalendarContainer>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                    {currentYear} Workout Activity
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                        {totalWorkouts} workouts in {workoutDays} days
                    </Typography>
                </Box>
            </Box>

            {/* Calendar grid with day labels */}
            <Box sx={{ display: 'flex', gap: '8px' }}>
                {/* Day labels (S, M, T, W, T, F, S) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${gapSize}px`, mr: 1, mt: `${MONTH_LABEL_ROW_HEIGHT + GRID_TOP_MARGIN}px` }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <DayLabel key={index} size={squareSize}>{day}</DayLabel>
                    ))}
                </Box>

                {/* Calendar grid */}
                <Box ref={gridWrapperRef} sx={{ flex: 1, overflowX: isSmall ? 'auto' : 'visible', pb: 1 }}>
                    {/* Month labels aligned to week columns */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${weeks.length}, ${squareSize}px)`,
                            alignItems: 'end',
                            gap: `${gapSize}px`,
                            height: `${MONTH_LABEL_ROW_HEIGHT}px`
                        }}
                    >
                        {monthPositions.map(({ label, weekIndex }) => (
                            <MonthLabel
                                key={label}
                                sx={{
                                    gridColumnStart: weekIndex + 1,
                                    justifySelf: 'start',
                                    fontSize: isSmall ? '0.65rem' : '0.75rem'
                                }}
                            >
                                {label}
                            </MonthLabel>
                        ))}
                    </Box>

                    <CalendarGrid
                        sx={{
                            gridTemplateColumns: `repeat(${weeks.length}, ${squareSize}px)`,
                            gridTemplateRows: `repeat(7, ${squareSize}px)`,
                            gap: `${gapSize}px`
                        }}
                    >
                        {weeks.map((week, weekIndex) =>
                            week.map((day, dayIndex) => {
                                const key = `${weekIndex}-${dayIndex}`;

                                if (!day) {
                                    return (
                                        <DaySquare
                                            key={key}
                                            intensity={0}
                                            isToday={false}
                                            size={squareSize}
                                            sx={{
                                                backgroundColor: 'transparent',
                                                '&:hover': {
                                                    transform: 'none',
                                                    boxShadow: 'none'
                                                }
                                            }}
                                        />
                                    );
                                }

                                const workoutCount = getWorkoutCount(day);
                                const intensity = getIntensity(workoutCount);
                                const isCurrentDay = isToday(day);

                                return (
                                    <Tooltip
                                        key={key}
                                        title={
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {format(day, 'MMM dd, yyyy')}
                                                </Typography>
                                                <Typography variant="body2">
                                                    {workoutCount === 0
                                                        ? 'No workouts'
                                                        : `${workoutCount} workout${workoutCount > 1 ? 's' : ''}`
                                                    }
                                                </Typography>
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                        componentsProps={{
                                            tooltip: {
                                                sx: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                                    border: `1px solid ${theme.palette.primary.main}30`,
                                                    borderRadius: '8px',
                                                    backdropFilter: 'blur(10px)'
                                                }
                                            },
                                            arrow: {
                                                sx: {
                                                    color: 'rgba(0, 0, 0, 0.9)',
                                                }
                                            }
                                        }}
                                    >
                                        <DaySquare
                                            intensity={intensity}
                                            isToday={isCurrentDay}
                                            size={squareSize}
                                        />
                                    </Tooltip>
                                );
                            })
                        )}
                    </CalendarGrid>
                </Box>
            </Box>

            {/* Legend */}
            <LegendContainer>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mr: 1 }}>
                    Less
                </Typography>
                {[0, 1, 2, 3, 4].map((intensity) => (
                    <LegendSquare key={intensity} intensity={intensity} />
                ))}
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 1 }}>
                    More
                </Typography>
            </LegendContainer>
        </CalendarContainer>
    );
}

WorkoutCalendar.propTypes = {
    workouts: PropTypes.array
};