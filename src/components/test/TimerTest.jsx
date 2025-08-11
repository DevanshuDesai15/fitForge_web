import { useState } from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import { MdPlayArrow, MdPause, MdStop } from 'react-icons/md';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';

export default function TimerTest() {
    const {
        workoutTime,
        isRunning,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        formatTime
    } = useWorkoutTimer();

    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-4), `${timestamp}: ${message}`]);
    };

    const handleStart = () => {
        addLog('Starting timer...');
        startTimer();
    };

    const handlePause = () => {
        addLog('Pausing timer...');
        pauseTimer();
    };

    const handleResume = () => {
        addLog('Resuming timer...');
        resumeTimer();
    };

    const handleStop = () => {
        addLog('Stopping timer...');
        stopTimer();
        setLogs([]);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
            <Card sx={{ mb: 3, backgroundColor: 'rgba(30, 30, 30, 0.9)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00ff9f', mb: 2 }}>
                        {formatTime(workoutTime)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Status: {isRunning ? '🟢 Running' : '⏸️ Paused'}
                    </Typography>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<MdPlayArrow />}
                    onClick={handleStart}
                    disabled={isRunning}
                    sx={{ flex: 1 }}
                >
                    Start
                </Button>
                <Button
                    variant="contained"
                    startIcon={isRunning ? <MdPause /> : <MdPlayArrow />}
                    onClick={isRunning ? handlePause : handleResume}
                    disabled={workoutTime === 0}
                    sx={{ flex: 1 }}
                >
                    {isRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<MdStop />}
                    onClick={handleStop}
                    sx={{ flex: 1 }}
                >
                    Stop
                </Button>
            </Box>

            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 1 }}>
                        Debug Log:
                    </Typography>
                    {logs.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            No activity yet...
                        </Typography>
                    ) : (
                        logs.map((log, index) => (
                            <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem'
                                }}
                            >
                                {log}
                            </Typography>
                        ))
                    )}
                </CardContent>
            </Card>

            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2, display: 'block' }}>
                💡 Open browser console to see detailed Web Worker logs
            </Typography>
        </Box>
    );
}