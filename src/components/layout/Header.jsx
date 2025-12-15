import { AppBar, Toolbar, Typography, useTheme, useMediaQuery, Box } from '@mui/material';
import shortLogo from '../../assets/shortLogo.svg';

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
                    <Box
                        component="img"
                        src={shortLogo}
                        alt="FitForge Logo"
                        sx={{
                            height: 32,
                            width: 'auto'
                        }}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}
