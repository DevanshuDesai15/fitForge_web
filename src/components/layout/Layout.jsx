import { Box, useTheme, useMediaQuery } from '@mui/material';
import Navigation from './Navigation';
import ModernSidebar from './ModernSidebar';
import Header from './Header';

export default function Layout({ children }) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const sidebarWidth = 280;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Desktop Sidebar */}
            {isDesktop && <ModernSidebar />}

            {/* Mobile Header and Navigation */}
            {!isDesktop && (
                <>
                    <Header />
                    <Navigation />
                </>
            )}

            {/* Main content area */}
            <Box
                id="main-content"
                component="main"
                aria-label="Main content"
                tabIndex={-1}
                sx={{
                    flexGrow: 1,
                    width: isDesktop ? `calc(100% - ${sidebarWidth}px)` : '100%',
                    marginLeft: isDesktop ? `${sidebarWidth}px` : 0,
                    paddingTop: isDesktop ? 0 : '64px', // Space for header on mobile
                    paddingBottom: isDesktop ? 0 : '80px', // Space for bottom nav on mobile
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.standard,
                    }),
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
