import { useState, useEffect } from 'react';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    useTheme,
    Badge,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    useMediaQuery,
    Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import appLogo from '../../assets/appLogo.svg';
import {
    MdDashboard,
    MdFitnessCenter,
    MdHistory,
    MdShowChart,
    MdPerson
} from 'react-icons/md';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [value, setValue] = useState('/');
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    const sidebarWidth = 280;

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

    // Update value when location changes
    useEffect(() => {
        const activeTab = getActiveTab(location.pathname);
        setValue(activeTab);
    }, [location.pathname]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        navigate(newValue);

        // Add haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    const handleSidebarItemClick = (path) => {
        setValue(path);
        navigate(path);

        // Add haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const navigationItems = [
        {
            label: 'Home',
            value: '/',
            icon: MdDashboard,
        },
        {
            label: 'Workout',
            value: '/workout',
            icon: MdFitnessCenter,
        },
        {
            label: 'History',
            value: '/history',
            icon: MdHistory,
        },
        {
            label: 'Progress',
            value: '/progress',
            icon: MdShowChart,
        },
        {
            label: 'Profile',
            value: '/profile',
            icon: MdPerson,
        },
    ];

    if (isDesktop) {
        // Desktop Sidebar Navigation
        return (
            <Drawer
                variant="permanent"
                sx={{
                    width: sidebarWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: sidebarWidth,
                        boxSizing: 'border-box',
                        background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRight: `1px solid ${theme.palette.primary.main}20`,
                        zIndex: 1000,
                        overflow: 'hidden',
                    },
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.primary.main}20`,
                }}>
                    <Box
                        component="img"
                        src={appLogo}
                        alt="FitForge Logo"
                        sx={{
                            height: 48,
                            width: 'auto'
                        }}
                    />
                </Box>

                <Box component="nav" aria-label="Main navigation">
                    <List sx={{ px: 2, py: 3 }}>
                        {navigationItems.map((item) => {
                            const isActive = value === item.value;
                            return (
                                <ListItem key={item.value} disablePadding sx={{ mb: 1 }}>
                                    <ListItemButton
                                        onClick={() => handleSidebarItemClick(item.value)}
                                        aria-current={isActive ? 'page' : undefined}
                                        sx={{
                                            borderRadius: 2,
                                            py: 1.5,
                                            px: 2,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            backgroundColor: isActive
                                                ? `${theme.palette.primary.main}15`
                                                : 'transparent',
                                            '&:hover': {
                                                backgroundColor: isActive
                                                    ? `${theme.palette.primary.main}20`
                                                    : `${theme.palette.primary.main}08`,
                                                transform: 'translateX(4px)',
                                            },
                                            '&.Mui-selected': {
                                                backgroundColor: `${theme.palette.primary.main}15`,
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: 40,
                                            color: isActive
                                                ? theme.palette.primary.main
                                                : 'rgba(255, 255, 255, 0.7)',
                                            transition: 'all 0.3s ease',
                                        }}>
                                            <item.icon size={24} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            sx={{
                                                '& .MuiListItemText-primary': {
                                                    fontSize: '0.95rem',
                                                    fontWeight: isActive ? 700 : 500,
                                                    color: isActive
                                                        ? theme.palette.primary.main
                                                        : 'rgba(255, 255, 255, 0.8)',
                                                    transition: 'all 0.3s ease',
                                                }
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Drawer>
        );
    }

    // Mobile Bottom Navigation
    return (
        <Paper
            component="nav"
            aria-label="Main navigation"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                borderTop: `2px solid ${theme.palette.primary.main}20`,
                zIndex: 1000,
                // Safe area for devices with home indicator
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            elevation={0}
        >
            <BottomNavigation
                value={value}
                onChange={handleChange}
                showLabels={true}
                sx={{
                    background: 'transparent',
                    height: 'auto',
                    minHeight: 70,
                    paddingTop: 1,
                    paddingBottom: 1,
                    '& .MuiBottomNavigationAction-root': {
                        minWidth: 'auto',
                        padding: '6px 8px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 2,
                        margin: '0 1px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                            background: `${theme.palette.primary.main}10`,
                            '& .MuiBottomNavigationAction-label': {
                                color: theme.palette.primary.light,
                            },
                            '& .navigation-icon': {
                                color: theme.palette.primary.light,
                                transform: 'scale(1.05)',
                            },
                        },
                        '&.Mui-selected': {
                            background: `${theme.palette.primary.main}15`,
                            transform: 'translateY(-2px)',
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                opacity: 1,
                                textShadow: `0 0 8px ${theme.palette.primary.main}50`,
                            },
                            '& .navigation-icon': {
                                color: theme.palette.primary.main,
                                transform: 'scale(1.15)',
                                filter: `drop-shadow(0 0 6px ${theme.palette.primary.main}60)`,
                            },
                        },
                    },
                    '& .MuiBottomNavigationAction-label': {
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginTop: '2px',
                        transition: 'all 0.3s ease',
                        opacity: 1, // Always show labels
                        textAlign: 'center',
                        lineHeight: 1.2,
                        letterSpacing: '0.02em',
                        '&.Mui-selected': {
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        },
                    },
                }}
            >
                {navigationItems.map((item) => (
                    <BottomNavigationAction
                        key={item.value}
                        label={item.label}
                        value={item.value}
                        aria-current={value === item.value ? 'page' : undefined}
                        icon={
                            <Box className="navigation-icon" sx={{
                                transition: 'all 0.3s ease',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 0.5,
                            }}>
                                <item.icon />
                            </Box>
                        }
                    />
                ))}
            </BottomNavigation>
        </Paper>
    );
}