import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Badge,
    Divider,
    Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Home,
    Activity,
    BarChart3,
    User,
    Settings,
    LogOut,
    Plus,
    Zap
} from 'lucide-react';

const SidebarContainer = styled(Box)(() => ({
    width: 280,
    height: '100vh',
    background: '#212121',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
}));

const BrandSection = styled(Box)(() => ({
    padding: '2rem 1.5rem 1.5rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
}));

const QuickAddButton = styled(Button)(() => ({
    backgroundColor: 'var(--primary-a0)',
    color: '#121212',
    borderRadius: '12px',
    textTransform: 'none',
    padding: '12px 16px',
    margin: '1.5rem',
    width: 'calc(100% - 3rem)',
    '&:hover': {
        backgroundColor: 'var(--primary-a10)',
    },
}));

const NavigationSection = styled(Box)(() => ({
    flex: 1,
    overflowY: 'auto',
}));

const BottomSection = styled(Box)(() => ({
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '1rem',
}));

const NavListItem = styled(ListItem)(() => ({
    padding: '0 1.5rem',
    marginBottom: '4px',
}));

const NavListItemButton = styled(ListItemButton)(({ active }) => ({
    borderRadius: '12px',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
    backgroundColor: active ? 'rgba(221, 237, 0, 0.15)' : 'transparent',
    border: active ? '1px solid rgba(221, 237, 0, 0.3)' : '1px solid transparent',
    '&:hover': {
        backgroundColor: active ? 'rgba(221, 237, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(221, 237, 0, 0.2)',
    },
}));

const UserSection = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: '16px',
}));

export default function ModernSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('/');

    // Get user display name
    const getUserName = () => {
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) return currentUser.email.split('@')[0];
        return 'John Doe';
    };

    // Function to determine which navigation tab should be active based on current path
    const getActiveTab = (pathname) => {
        if (pathname === '/') {
            return '/';
        } else if (pathname.startsWith('/workout')) {
            return '/workout';
        } else if (pathname.startsWith('/progress')) {
            return '/progress';
        } else if (pathname.startsWith('/profile')) {
            return '/profile';
        }
        return '/';
    };

    useEffect(() => {
        const activeTabPath = getActiveTab(location.pathname);
        setActiveTab(activeTabPath);
    }, [location.pathname]);

    const handleNavigation = (path) => {
        setActiveTab(path);
        navigate(path);
    };

    const handleQuickAdd = () => {
        navigate('/workout/quick-add');
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const navigationItems = [
        {
            label: 'Dashboard',
            path: '/',
            icon: Home,
            isActive: activeTab === '/',
        },
        {
            label: 'Workouts',
            path: '/workout',
            icon: Activity,
            // badge: 3,
            isActive: activeTab === '/workout',
        },
        {
            label: 'Progress',
            path: '/progress',
            icon: BarChart3,
            isActive: activeTab === '/progress',
        },
        {
            label: 'Profile',
            path: '/profile',
            icon: User,
            isActive: activeTab === '/profile',
        },
    ];

    return (
        <SidebarContainer>
            {/* Brand Section */}
            <BrandSection>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'var(--primary-a0)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Zap size={24} style={{ color: '#121212' }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.5rem',
                                lineHeight: 1,
                            }}
                        >
                            FitForge
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.875rem',
                                lineHeight: 1,
                            }}
                        >
                            AI Fitness Tracker
                        </Typography>
                    </Box>
                </Box>
            </BrandSection>

            {/* Quick Add Exercise Button */}
            <QuickAddButton
                startIcon={<Plus size={20} />}
                onClick={handleQuickAdd}
            >
                Quick Add
            </QuickAddButton>

            {/* Navigation */}
            <NavigationSection>
                <List sx={{ padding: 0 }}>
                    {navigationItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <NavListItem key={item.path} disablePadding>
                                <NavListItemButton
                                    active={item.isActive}
                                    onClick={() => handleNavigation(item.path)}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 40,
                                            color: item.isActive
                                                ? 'var(--primary-a0)'
                                                : 'rgba(255, 255, 255, 0.7)',
                                        }}
                                    >
                                        <IconComponent size={20} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        sx={{
                                            '& .MuiListItemText-primary': {
                                                fontSize: '0.95rem',
                                                fontWeight: item.isActive ? 600 : 400,
                                                color: item.isActive
                                                    ? 'white'
                                                    : 'rgba(255, 255, 255, 0.7)',
                                            },
                                        }}
                                    />
                                    {item.badge && (
                                        <Badge
                                            badgeContent={item.badge}
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    backgroundColor: 'var(--primary-a0)',
                                                    color: '#121212',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem',
                                                    minWidth: '20px',
                                                    height: '20px',
                                                },
                                            }}
                                        />
                                    )}
                                </NavListItemButton>
                            </NavListItem>
                        );
                    })}
                </List>
            </NavigationSection>

            {/* Bottom Section */}
            <BottomSection>
                {/* Settings */}
                {/* <List sx={{ padding: 0, mb: 2 }}>
                    <NavListItem disablePadding>
                        <NavListItemButton
                            active={false}
                            onClick={() => handleNavigation('/profile')}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 40,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                }}
                            >
                                <Settings size={20} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Settings"
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        fontSize: '0.95rem',
                                        fontWeight: 400,
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />
                        </NavListItemButton>
                    </NavListItem>
                </List> */}

                {/* User Profile */}
                {/* <UserSection>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: 'var(--primary-a0)',
                            color: '#121212',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {getUserName().charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                lineHeight: 1,
                                mb: 0.5,
                            }}
                        >
                            {getUserName()}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.75rem',
                                lineHeight: 1,
                            }}
                        >
                            Free Plan
                        </Typography>
                    </Box>
                </UserSection> */}

                {/* Sign Out */}
                <Button
                    startIcon={<LogOut size={18} />}
                    onClick={handleSignOut}
                    sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: 'rgba(255, 255, 255, 0.7)',
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 400,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                        },
                    }}
                >
                    Sign Out
                </Button>
            </BottomSection>
        </SidebarContainer>
    );
}
