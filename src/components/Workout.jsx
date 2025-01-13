import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdPlayArrow,
    MdFitnessCenter,
    MdLibraryBooks,
    MdPlaylistAdd
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
    },
}));

export default function Workout() {
    const navigate = useNavigate();

    const workoutOptions = [
        {
            title: 'Start New Workout',
            icon: <MdPlayArrow />,
            description: 'Begin a new training session',
            path: '/workout/start'
        },
        {
            title: 'Exercise Library',
            icon: <MdFitnessCenter />,
            description: 'Browse and manage exercises',
            path: '/workout/library'
        },
        {
            title: 'Workout Templates',
            icon: <MdLibraryBooks />,
            description: 'Create and manage workout routines',
            path: '/workout/templates'
        },
        {
            title: 'Quick Add Exercise',
            icon: <MdPlaylistAdd />,
            description: 'Quickly add a new exercise',
            path: '/workout/quick-add'
        }
    ];

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: '#00ff9f',
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Workout
                </Typography>

                <Grid container spacing={3}>
                    {workoutOptions.map((option, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <StyledCard
                                onClick={() => navigate(option.path)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <CardContent>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2
                                    }}>
                                        <Box sx={{
                                            color: '#00ff9f',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '2rem'
                                        }}>
                                            {option.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {option.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {option.description}
                                    </Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>
            </div>
        </Box>
    );
}