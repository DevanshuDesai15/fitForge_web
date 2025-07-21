import { useState, useEffect } from 'react';
import { Box, Fab, Typography, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdFitnessCenter,
    MdHistory,
    MdShowChart,
    MdPerson
} from 'react-icons/md';

export default function ModernNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState('/');

    // Function to determine which navigation tab should be active based on current path
    const getActiveTab = (pathname) => {
        if (pathname === '/') {
            return '/';
        } else if (pathname.startsWith('/workout')) {
            return '/workout';
        } else if (pathname.startsWith('/history')) {
            return '/history';
        } else if (pathname.startsWith('/progress')) {
            return '/progress';
        } else if (pathname.startsWith('/profile') || pathname.startsWith('/exercise-manager')) {
            return '/profile';
        }

        // Default fallback
        return '/';
    };

    useEffect(() => {
        const activeTabPath = getActiveTab(location.pathname);
        setActiveTab(activeTabPath);
    }, [location.pathname]);

    const handleTabChange = (path) => {
        setActiveTab(path);
        navigate(path);

        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const navigationItems = [
        { label: 'Home', path: '/', icon: MdDashboard },
        { label: 'Workout', path: '/workout', icon: MdFitnessCenter },
        { label: 'History', path: '/history', icon: MdHistory },
        { label: 'Progress', path: '/progress', icon: MdShowChart },
        { label: 'Profile', path: '/profile', icon: MdPerson },
    ];

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, transparent 0%, rgba(18, 18, 18, 0.8) 20%, rgba(18, 18, 18, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                padding: '12px 20px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                zIndex: 1000,
            }}
        >
            {/* Floating Tab Container */}
            <Box
                sx={{
                    background: 'rgba(30, 30, 30, 0.9)',
                    borderRadius: '24px',
                    padding: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    boxShadow: `0 8px 32px rgba(0, 255, 159, 0.1)`,
                }}
            >
                {navigationItems.map((item) => {
                    const isActive = activeTab === item.path;
                    const IconComponent = item.icon;

                    return (
                        <Box
                            key={item.path}
                            onClick={() => handleTabChange(item.path)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                padding: '12px 8px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: isActive
                                    ? `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.primary.main}10)`
                                    : 'transparent',
                                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                '&:hover': {
                                    background: isActive
                                        ? `linear-gradient(135deg, ${theme.palette.primary.main}30, ${theme.palette.primary.main}15)`
                                        : 'rgba(255, 255, 255, 0.05)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                },
                            }}
                        >
                            {/* Icon */}
                            <Box
                                sx={{
                                    color: isActive ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '1.3rem',
                                    marginBottom: 0.5,
                                    transition: 'all 0.3s ease',
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                }}
                            >
                                <IconComponent />
                            </Box>

                            {/* Label */}
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.65rem',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.5)',
                                    transition: 'all 0.3s ease',
                                    lineHeight: 1,
                                    textAlign: 'center',
                                }}
                            >
                                {item.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
} 