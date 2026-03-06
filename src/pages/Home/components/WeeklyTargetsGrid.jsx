import React from 'react';
import { Box, Typography } from '@mui/material';
import CircularProgress, { circularProgressClasses } from '@mui/material/CircularProgress';

// Nested circular component customized to match the provided dashboard aesthetic
const CircularTarget = ({
    current,
    target,
    label,
    color,
    size = 120,
    thickness = 4
}) => {
    // Cap progress at 100%
    const progressPercentage = Math.min((current / target) * 100, 100);
    const targetLeft = Math.max(target - current, 0);
    const isComplete = current >= target;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                {/* Background Ring */}
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={size}
                    thickness={thickness}
                    sx={{
                        color: 'rgba(255, 255, 255, 0.1)', // dark gray background track
                    }}
                />
                {/* Foreground Ring */}
                <CircularProgress
                    variant="determinate"
                    value={progressPercentage}
                    size={size}
                    thickness={thickness}
                    sx={{
                        color: color,
                        position: 'absolute',
                        left: 0,
                        [`& .${circularProgressClasses.circle}`]: {
                            strokeLinecap: 'round',
                        },
                        filter: `drop-shadow(0 0 6px ${color}60)`, // subtle glow
                    }}
                />

                {/* Center Text */}
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h4" sx={{
                        color: 'text.primary',
                        fontWeight: 'bold',
                        fontSize: size > 140 ? '2.5rem' : '1.75rem',
                        lineHeight: 1
                    }}>
                        {current}
                    </Typography>
                    <Typography variant="caption" sx={{
                        color: 'text.secondary',
                        fontSize: size > 140 ? '0.875rem' : '0.75rem',
                        mt: 0.5
                    }}>
                        {isComplete ? 'Goal met!' : `${targetLeft} left`}
                    </Typography>
                </Box>
            </Box>

            {/* Bottom Labels */}
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.02em' }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {target} target
            </Typography>
        </Box>
    );
};

export default function WeeklyTargetsGrid({ weeklyStats }) {
    // Default safe fallbacks if the component renders before data initializes
    const {
        targetedMuscles = { current: 0, target: 11 },
        weeklySets = { current: 0, target: 60 },
        uniqueExercises = { current: 0, target: 20 }
    } = weeklyStats;

    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 2, md: 8 },
            flexDirection: { xs: 'column', md: 'row' },
            py: 6,
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.03)',
            // Removing shadow to mimic the flat, dark-mode integration of the screenshot
        }}>
            {/* Left Ring: Muscles Trained */}
            <CircularTarget
                current={targetedMuscles.current}
                target={targetedMuscles.target}
                label="Muscles"
                color="#5c9cf6" // Solid Blue matching screenshot
                size={150}
                thickness={3.5}
            />

            {/* Center Ring: Sets Completed (Largest) */}
            <CircularTarget
                current={weeklySets.current}
                target={weeklySets.target}
                label="Sets"
                color="#f67c5c" // Vibrant Orange/Salmon matching screenshot
                size={220}
                thickness={2.5}  // Slightly thinner stroke on the big one looks elegant
            />

            {/* Right Ring: Exercises Done */}
            <CircularTarget
                current={uniqueExercises.current}
                target={uniqueExercises.target}
                label="Exercises"
                color="#78dce8" // Soft Cyan matching screenshot
                size={150}
                thickness={3.5}
            />
        </Box>
    );
}
