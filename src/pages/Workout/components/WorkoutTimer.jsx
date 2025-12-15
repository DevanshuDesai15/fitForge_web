import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { MdTimer, MdPlayArrow, MdStop } from 'react-icons/md';
import { useWorkoutTimer } from '../../../hooks/useWorkoutTimer';

const WorkoutTimer = ({ workoutStarted, onTimerUpdate }) => {
    const { elapsedTime, isRunning, startTimer, stopTimer, resetTimer } = useWorkoutTimer();

    useEffect(() => {
        if (workoutStarted && !isRunning) {
            startTimer();
        } else if (!workoutStarted && isRunning) {
            stopTimer();
        }
    }, [workoutStarted, isRunning, startTimer, stopTimer]);

    useEffect(() => {
        if (onTimerUpdate) {
            onTimerUpdate(elapsedTime);
        }
    }, [elapsedTime, onTimerUpdate]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card sx={{
            background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1), rgba(221, 237, 0, 0.05))',
            border: '1px solid rgba(221, 237, 0, 0.2)',
            mb: 2
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <MdTimer style={{ color: '#dded00', fontSize: '24px' }} />
                        <Typography variant="h5" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                            {formatTime(elapsedTime)}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isRunning ? (
                            <Button
                                variant="contained"
                                startIcon={<MdPlayArrow />}
                                onClick={startTimer}
                                sx={{
                                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                    color: '#fff',
                                }}
                            >
                                Start
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<MdStop />}
                                onClick={stopTimer}
                                sx={{
                                    background: 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                    color: '#fff',
                                }}
                            >
                                Pause
                            </Button>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WorkoutTimer;
