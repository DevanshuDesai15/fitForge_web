import { Box, Button, IconButton, Typography } from '@mui/material';
import { Activity, Plus, X } from 'lucide-react';

const DESKTOP_SIDEBAR_WIDTH = 280;
const MOBILE_NAV_HEIGHT = 80;

export default function WelcomeModal({
    greeting,
    displayName,
    streakDays,
    onClose,
    onLogWorkout,
    onStartTraining
}) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: { xs: `${MOBILE_NAV_HEIGHT}px`, lg: 0 },
                left: { xs: 0, lg: `${DESKTOP_SIDEBAR_WIDTH}px` },
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 3, sm: 6, md: 8 },
                backgroundColor: 'rgba(10, 12, 8, 0.36)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                pointerEvents: 'auto'
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    pointerEvents: 'auto',
                    width: '100%',
                    maxWidth: '720px',
                    borderRadius: { xs: '24px', md: '30px' },
                    px: { xs: 2.25, sm: 3, md: 4 },
                    py: { xs: 2.5, sm: 3, md: 3.5 },
                    background: 'linear-gradient(180deg, rgba(40, 45, 20, 0.96) 0%, rgba(24, 29, 16, 0.98) 100%)',
                    border: '1px solid rgba(221, 237, 0, 0.16)',
                    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.38)',
                    backdropFilter: 'blur(18px)',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at top left, rgba(221, 237, 0, 0.12), transparent 34%)',
                        pointerEvents: 'none'
                    }
                }}
            >
                <IconButton
                    aria-label="Close welcome message"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: { xs: 14, md: 18 },
                        right: { xs: 14, md: 18 },
                        zIndex: 2,
                        width: 36,
                        height: 36,
                        color: 'rgba(255, 255, 255, 0.72)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
                >
                    <X size={18} />
                </IconButton>

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            display: 'block',
                            mb: 1,
                            color: 'rgba(221, 237, 0, 0.74)',
                            letterSpacing: '0.18em',
                            fontWeight: 700
                        }}
                    >
                        Daily Check-in
                    </Typography>

                    <Typography
                        variant="h4"
                        sx={{
                            color: '#ffffff',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            pr: { xs: 4, sm: 5 },
                            mb: 1,
                            fontSize: { xs: '1.45rem', sm: '1.9rem', md: '2.2rem' }
                        }}
                    >
                        {greeting.text}, {displayName}! {greeting.emoji}
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.76)',
                            fontWeight: 500,
                            mb: 0.75,
                            fontSize: { xs: '0.92rem', md: '1rem' }
                        }}
                    >
                        You&rsquo;re on a {streakDays}-day streak! Let&rsquo;s keep the momentum going.
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.52)',
                            fontStyle: 'italic',
                            mb: 2.5,
                            fontSize: { xs: '0.84rem', md: '0.95rem' }
                        }}
                    >
                        {greeting.message}
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            gap: 1.5
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={onLogWorkout}
                            sx={{
                                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                                backgroundColor: 'var(--primary-a0)',
                                color: '#121212',
                                fontWeight: 700,
                                borderRadius: '999px',
                                px: 2.75,
                                py: 1.1,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                '&:hover': {
                                    backgroundColor: 'var(--primary-a10)'
                                }
                            }}
                        >
                            Log Workout
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Activity size={18} />}
                            onClick={onStartTraining}
                            sx={{
                                alignSelf: { xs: 'stretch', sm: 'flex-start' },
                                borderColor: 'rgba(221, 237, 0, 0.42)',
                                color: 'var(--primary-a0)',
                                fontWeight: 600,
                                borderRadius: '999px',
                                px: 2.75,
                                py: 1.1,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                '&:hover': {
                                    borderColor: 'var(--primary-a0)',
                                    backgroundColor: 'rgba(221, 237, 0, 0.08)'
                                }
                            }}
                        >
                            Start Training
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
