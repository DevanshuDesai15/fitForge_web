import { useState, useEffect } from 'react';
import {
    Paper,
    useTheme,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    Typography,
    IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import appLogo from '../../assets/appLogo.svg';
import shortLogo from '../../assets/shortLogo.svg';
import {
    Dumbbell as MdFitnessCenter,
    History as MdHistory,
    LineChart as MdShowChart,
    User as MdPerson
} from 'lucide-react';

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

    const mobileNavigationItems = [
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
                background: 'transparent',
                backdropFilter: 'none',
                zIndex: 1000,
                px: 1,
                pb: 'calc(8px + env(safe-area-inset-bottom))',
                overflow: 'visible',
            }}
            elevation={0}
        >
            <Box
                sx={{
                    position: 'relative',
                    background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderTop: `1px solid ${theme.palette.primary.main}22`,
                    borderRadius: '28px',
                    minHeight: 78,
                    pt: 1.25,
                    pb: 1,
                    px: 0.5,
                    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.35)',
                    overflow: 'visible',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '50%',
                        top: '-26px',
                        transform: 'translateX(-50%)',
                        width: 92,
                        height: 92,
                        background: 'linear-gradient(180deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
                        borderTop: `1px solid ${theme.palette.primary.main}22`,
                        borderLeft: `1px solid ${theme.palette.primary.main}18`,
                        borderRight: `1px solid ${theme.palette.primary.main}18`,
                        borderRadius: '28px',
                        clipPath: 'polygon(50% 0%, 88% 20%, 88% 74%, 50% 100%, 12% 74%, 12% 20%)',
                        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.22)',
                        zIndex: 0,
                    }
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        alignItems: 'end',
                        gap: 0.5,
                        px: 0.5,
                        overflow: 'visible',
                    }}
                >
                    {mobileNavigationItems.slice(0, 2).map((item) => {
                        const isActive = value === item.value;

                        return (
                            <Box
                                key={item.value}
                                component="button"
                                type="button"
                                onClick={() => handleSidebarItemClick(item.value)}
                                aria-current={isActive ? 'page' : undefined}
                                sx={{
                                    border: 0,
                                    outline: 0,
                                    cursor: 'pointer',
                                    background: isActive ? `${theme.palette.primary.main}15` : 'transparent',
                                    borderRadius: 2,
                                    minHeight: 62,
                                    px: 0.5,
                                    py: 0.75,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isActive ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.78)',
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <Box sx={{ fontSize: '1.3rem', display: 'flex', mb: 0.5 }}>
                                    <item.icon />
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: isActive ? 700 : 600,
                                        color: 'inherit',
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        );
                    })}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            transform: 'translateY(-26px)',
                        }}
                    >
                        <IconButton
                            aria-label="Go to home"
                            onClick={() => handleSidebarItemClick('/')}
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: 0,
                                border: `1px solid ${theme.palette.primary.main}28`,
                                background: 'linear-gradient(180deg, rgba(40, 45, 20, 0.94) 0%, rgba(24, 29, 16, 0.98) 100%)',
                                clipPath: 'polygon(50% 0%, 88% 20%, 88% 74%, 50% 100%, 12% 74%, 12% 20%)',
                                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.34)',
                                '&:hover': {
                                    background: 'linear-gradient(180deg, rgba(48, 54, 24, 0.96) 0%, rgba(30, 36, 19, 0.99) 100%)',
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src={shortLogo}
                                alt="FitForge Logo"
                                sx={{
                                    height: 30,
                                    width: 'auto'
                                }}
                            />
                        </IconButton>
                    </Box>

                    {mobileNavigationItems.slice(2).map((item) => {
                        const isActive = value === item.value;

                        return (
                            <Box
                                key={item.value}
                                component="button"
                                type="button"
                                onClick={() => handleSidebarItemClick(item.value)}
                                aria-current={isActive ? 'page' : undefined}
                                sx={{
                                    border: 0,
                                    outline: 0,
                                    cursor: 'pointer',
                                    background: isActive ? `${theme.palette.primary.main}15` : 'transparent',
                                    borderRadius: 2,
                                    minHeight: 62,
                                    px: 0.5,
                                    py: 0.75,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isActive ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.78)',
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <Box sx={{ fontSize: '1.3rem', display: 'flex', mb: 0.5 }}>
                                    <item.icon />
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: isActive ? 700 : 600,
                                        color: 'inherit',
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Paper>
    );
}
