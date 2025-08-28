import { AppBar, Toolbar, Typography, useTheme, useMediaQuery, Box } from '@mui/material';

export default function Header() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    if (!isMobile) {
        return null; // Don't render anything on desktop
    }

    return (
        <AppBar
            position="fixed"
            sx={{
                background: 'transparent',
                boxShadow: 'none',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(18, 18, 18, 0.8)',
            }}
        >
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #dded00 0%, #e8f15d 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        FitForge
                    </Typography>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
