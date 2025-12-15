import { useState, useEffect } from 'react';
import { Box, Typography, Card, Button, IconButton } from '@mui/material';
import { MdTimer, MdAdd, MdRemove } from 'react-icons/md';
import PropTypes from 'prop-types';

const RestTimer = ({ duration = 180, onComplete, onSkip }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (timeLeft === 0) {
            onComplete?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddTime = (seconds) => {
        setTimeLeft(prev => prev + seconds);
    };

    const handleSubtractTime = (seconds) => {
        setTimeLeft(prev => Math.max(0, prev - seconds));
    };

    return (
        <Card sx={{
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(33, 150, 243, 0.05))',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '16px',
            mb: 3,
            overflow: 'hidden'
        }}>
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MdTimer style={{ color: '#2196f3', fontSize: '24px' }} />
                    <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                        Rest Time
                    </Typography>
                </Box>

                {/* Timer Display with Edit Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                    {/* Subtract Time Button */}
                    <IconButton
                        onClick={() => handleSubtractTime(30)}
                        disabled={timeLeft <= 0}
                        sx={{
                            color: '#2196f3',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                            },
                            '&.Mui-disabled': {
                                color: 'rgba(33, 150, 243, 0.3)',
                            }
                        }}
                    >
                        <MdRemove size={24} />
                    </IconButton>

                    {/* Time Display */}
                    <Typography
                        key={timeLeft}
                        sx={{
                            color: '#2196f3',
                            fontWeight: 'bold',
                            fontSize: '3.5rem',
                            fontFamily: 'monospace',
                            minWidth: '200px',
                            textAlign: 'center',
                            animation: 'fadeSlide 0.3s ease-out',
                            '@keyframes fadeSlide': {
                                '0%': {
                                    transform: 'translateY(-10px)',
                                    opacity: 0.5,
                                },
                                '100%': {
                                    transform: 'translateY(0)',
                                    opacity: 1,
                                }
                            }
                        }}
                    >
                        {formatTime(timeLeft)}
                    </Typography>

                    {/* Add Time Button */}
                    <IconButton
                        onClick={() => handleAddTime(30)}
                        sx={{
                            color: '#2196f3',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                            }
                        }}
                    >
                        <MdAdd size={24} />
                    </IconButton>
                </Box>

                {/* Quick Adjust Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Button
                        size="small"
                        onClick={() => handleSubtractTime(15)}
                        disabled={timeLeft <= 0}
                        sx={{
                            color: '#2196f3',
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            minWidth: '60px',
                            '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            }
                        }}
                    >
                        -15s
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleAddTime(15)}
                        sx={{
                            color: '#2196f3',
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            minWidth: '60px',
                            '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            }
                        }}
                    >
                        +15s
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleAddTime(60)}
                        sx={{
                            color: '#2196f3',
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            minWidth: '60px',
                            '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            }
                        }}
                    >
                        +1m
                    </Button>
                </Box>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                    Take your time to recover
                </Typography>

                <Button
                    variant="text"
                    onClick={onSkip}
                    sx={{
                        color: '#2196f3',
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        }
                    }}
                >
                    Skip Rest
                </Button>
            </Box>
        </Card>
    );
};

RestTimer.propTypes = {
    duration: PropTypes.number,
    onComplete: PropTypes.func,
    onSkip: PropTypes.func
};

export default RestTimer;

