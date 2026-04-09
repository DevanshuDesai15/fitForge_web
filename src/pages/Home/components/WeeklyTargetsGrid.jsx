import { useState, useEffect } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

// Custom SVG circular progress ring with gradient stroke and glow
const CircularTarget = ({
    current,
    target,
    label,
    colorStart,
    colorEnd,
    glowColor,
    size = 120,
    strokeWidth = 8
}) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const progressPercentage = Math.min((current / target) * 100, 100);
    const targetLeft = Math.max(target - current, 0);
    const isComplete = current >= target;

    // Animate on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progressPercentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [progressPercentage]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;
    const gradientId = `gradient-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const glowId = `glow-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: { xs: 1, sm: 0 },
            flex: { xs: 1, sm: '0 0 auto' },
            p: { xs: 0.5, md: 2 },
            minWidth: { xs: size + 12, sm: size + 28 },
        }}>
            <Box sx={{
                position: 'relative',
                width: size,
                height: size,
                mb: 2,
            }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <defs>
                        {/* Gradient for the progress arc */}
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colorStart} />
                            <stop offset="100%" stopColor={colorEnd} />
                        </linearGradient>
                        {/* Glow filter */}
                        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                            <feFlood floodColor={glowColor} floodOpacity="0.6" result="color" />
                            <feComposite in="color" in2="blur" operator="in" result="glow" />
                            <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeWidth={strokeWidth}
                    />

                    {/* Inner subtle ring for depth */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius - strokeWidth * 0.8}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.02)"
                        strokeWidth={1}
                    />

                    {/* Progress arc */}
                    {animatedProgress > 0 && (
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            filter={`url(#${glowId})`}
                            style={{
                                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />
                    )}
                </svg>

                {/* Center content */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Typography sx={{
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: size > 160 ? '2.75rem' : size > 120 ? '2rem' : '1.5rem',
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                    }}>
                        {current}
                    </Typography>
                    <Typography sx={{
                        color: isComplete ? '#4caf50' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: size > 160 ? '0.85rem' : '0.7rem',
                        fontWeight: 500,
                        mt: 0.5,
                    }}>
                        {isComplete ? '✓ Complete' : `${targetLeft} left`}
                    </Typography>
                </Box>
            </Box>

            {/* Labels */}
            <Typography sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: size > 160 ? '1.05rem' : '0.9rem',
                letterSpacing: '0.02em',
            }}>
                {label}
            </Typography>
            <Typography sx={{
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.75rem',
                fontWeight: 500,
                mt: 0.25,
            }}>
                {target} target
            </Typography>
        </Box>
    );
};

export default function WeeklyTargetsGrid({ weeklyStats }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const {
        targetedMuscles = { current: 0, target: 11 },
        weeklySets = { current: 0, target: 60 },
        uniqueExercises = { current: 0, target: 20 }
    } = weeklyStats;

    return (
        <Box sx={{
            overflow: 'hidden'
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: { xs: 'space-between', sm: 'center' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 3, md: 6 },
                flexDirection: 'row',
                minWidth: 0,
                py: { xs: 2.5, md: 5 },
                px: { xs: 0.75, sm: 1.5, md: 4 },
                background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
                    pointerEvents: 'none',
                },
            }}
                data-testid="weekly-targets-layout"
                data-layout={isMobile ? 'horizontal-mobile' : 'horizontal-desktop'}
            >
                {/* Left: Muscles */}
                <Box>
                    <CircularTarget
                        current={targetedMuscles.current}
                        target={targetedMuscles.target}
                        label="Muscles"
                        colorStart="#4a8af5"
                        colorEnd="#7bb8ff"
                        glowColor="#5c9cf6"
                        size={isMobile ? 76 : 140}
                        strokeWidth={isMobile ? 5 : 7}
                    />
                </Box>

                {/* Center: Sets (largest) */}
                <Box>
                    <CircularTarget
                        current={weeklySets.current}
                        target={weeklySets.target}
                        label="Sets"
                        colorStart="#f5734a"
                        colorEnd="#ffab76"
                        glowColor="#f67c5c"
                        size={isMobile ? 104 : 200}
                        strokeWidth={isMobile ? 6 : 9}
                    />
                </Box>

                {/* Right: Exercises */}
                <Box>
                    <CircularTarget
                        current={uniqueExercises.current}
                        target={uniqueExercises.target}
                        label="Exercises"
                        colorStart="#5cd8e8"
                        colorEnd="#a0f0ff"
                        glowColor="#78dce8"
                        size={isMobile ? 76 : 140}
                        strokeWidth={isMobile ? 5 : 7}
                    />
                </Box>
            </Box>
        </Box>
    );
}
