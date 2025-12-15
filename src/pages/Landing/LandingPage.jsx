import {
    Box,
    Typography,
    Button,
    Container,
    Grid2,
    Card,
    CardContent,
    Avatar,
    Chip,
    useTheme,
    useMediaQuery,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdFitnessCenter,
    MdShowChart,
    MdHistory,
    MdTrendingUp,
    MdPhoneAndroid,
    MdCloud,
    MdSecurity,
    MdSpeed,
    MdArrowForward,
    MdCheckCircle,
    MdEmojiEvents
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import appLogo from '../../assets/appLogo.svg';

const HeroSection = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: '#121212',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'transparent',
        pointerEvents: 'none',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
            conic-gradient(from 0deg at 50% 50%, 
                transparent 0deg, 
                ${theme.palette.primary.main}10 60deg, 
                transparent 120deg, 
                ${theme.palette.secondary.main}10 180deg, 
                transparent 240deg, 
                ${theme.palette.info.main}10 300deg, 
                transparent 360deg)
        `,
        animation: 'rotate 20s linear infinite',
        pointerEvents: 'none',
    },
    '@keyframes rotate': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
    }
}));

// Phone mockup to showcase the timer in the hero section
const PhoneMock = styled('div')(({ theme }) => ({
    width: 320,
    maxWidth: '80vw',
    height: 620,
    borderRadius: 36,
    padding: 14,
    background:
        `radial-gradient(1200px 600px at -20% -10%, ${theme.palette.primary.main}30, transparent 60%),
         radial-gradient(800px 400px at 120% 110%, ${theme.palette.secondary.main}25, transparent 60%),
         linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
    border: `1px solid ${theme.palette.border.strong}`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const PhoneScreen = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    borderRadius: 28,
    background: 'linear-gradient(160deg, #0e1015 0%, #141925 70%)',
    border: `1px solid ${theme.palette.border.light}`,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
}));

const FeatureCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(145deg, rgba(21, 27, 38, 0.9) 0%, rgba(26, 34, 48, 0.85) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(221, 237, 0, 0.5), transparent)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    '&:hover': {
        transform: 'translateY(-12px) scale(1.02)',
        boxShadow: `0 25px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px ${theme.palette.primary.main}30`,
        border: `1px solid ${theme.palette.primary.main}40`,
        '&::before': {
            opacity: 1,
        }
    }
}));

const GlowingButton = styled(Button)(({ theme }) => ({
    background: theme.palette.background.gradient.button,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    fontSize: '1.2rem',
    padding: '16px 40px',
    borderRadius: '50px',
    textTransform: 'none',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
        transition: 'left 0.6s ease',
    },
    '&:hover': {
        background: theme.palette.background.gradient.buttonHover,
        transform: 'translateY(-3px) scale(1.05)',
        boxShadow: `0 15px 45px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        '&::before': {
            left: '100%',
        }
    },
    '&:active': {
        transform: 'translateY(-1px) scale(1.02)',
    }
}));

// StatsCard removed - not needed anymore

export default function LandingPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    // No animated stats needed anymore

    const features = [
        {
            icon: MdTrendingUp,
            title: 'Progressive Overload Tracking',
            description: 'Automatically track weight increases and get suggestions for when to progress',
            color: theme.palette.primary.main
        },
        {
            icon: MdEmojiEvents,
            title: 'Auto PR Detection',
            description: 'Celebrate personal records automatically - never miss a strength milestone',
            color: '#ffc107'
        },
        {
            icon: MdShowChart,
            title: 'Smart Analytics',
            description: 'Visual progress charts and insights that show your strength gains over time',
            color: '#9c27b0'
        },
        {
            icon: MdFitnessCenter,
            title: '800+ Exercises',
            description: 'Comprehensive exercise library with detailed instructions for proper form',
            color: '#ff9800'
        },
        {
            icon: MdHistory,
            title: 'Intelligent History',
            description: 'Complete workout logs with progression insights and performance comparisons',
            color: '#00bcd4'
        },
        {
            icon: MdPhoneAndroid,
            title: 'Better Than Notes',
            description: 'Purpose-built for gym use - no more messy notes or forgotten weights',
            color: '#4caf50'
        }
    ];

    const benefits = [
        'Get stronger faster with progressive overload tracking',
        'Never forget your previous weights again',
        'Automatic personal record detection and celebration',
        'Smart suggestions for when to increase weights',
        'Visual progress charts that motivate you',
        'Purpose-built for serious lifters'
    ];

    const handleGetStarted = () => {
        if (currentUser) {
            navigate('/');
        } else {
            navigate('/signup');
        }
    };

    const handleSignIn = () => {
        navigate('/signin');
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
            {/* Hero Section */}
            <HeroSection>
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Navigation */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="img"
                                src={appLogo}
                                alt="FitForge Logo"
                                sx={{
                                    height: 120,
                                    width: 'auto'
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {currentUser ? (
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/')}
                                    sx={{
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.light,
                                            backgroundColor: `${theme.palette.primary.main}10`
                                        }
                                    }}
                                >
                                    Go to App
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="text"
                                        onClick={handleSignIn}
                                        sx={{ color: theme.palette.text.primary }}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleGetStarted}
                                        sx={{
                                            borderColor: theme.palette.primary.main,
                                            color: theme.palette.primary.main
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Hero Content */}
                    <Grid2 container spacing={4} sx={{ alignItems: 'center', py: { xs: 4, md: 8 } }}>
                        <Grid2 xs={12} md={7}>
                            <Box sx={{ position: 'relative', zIndex: 2 }}>
                                <Box sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.2) 0%, rgba(227, 239, 63, 0.1) 100%)',
                                    padding: '8px 20px',
                                    borderRadius: '25px',
                                    border: '1px solid rgba(221, 237, 0, 0.4)',
                                    mb: 3,
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 8px 32px rgba(221, 237, 0, 0.2)'
                                }}>
                                    <Typography sx={{ fontSize: '1.2rem' }}>💪</Typography>
                                    <Typography sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem'
                                    }}>
                                        Smart Progressive Overload Tracking
                                    </Typography>
                                </Box>

                                <Typography
                                    variant={isMobile ? 'h2' : 'h1'}
                                    sx={{
                                        fontWeight: 800,
                                        mb: 3,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 40%, ${theme.palette.secondary.main} 100%)`,
                                        backgroundSize: '200% 200%',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        lineHeight: 1.05,
                                        letterSpacing: { xs: '-0.5px', md: '-1.5px' },
                                        animation: 'gradientShift 8s ease-in-out infinite',
                                        '@keyframes gradientShift': {
                                            '0%, 100%': { backgroundPosition: '0% 50%' },
                                            '50%': { backgroundPosition: '100% 50%' }
                                        }
                                    }}
                                >
                                    Track Your Strength Progress Like Never Before! 🏋️‍♂️
                                </Typography>

                                <Typography
                                    variant={isMobile ? 'h6' : 'h5'}
                                    sx={{
                                        color: theme.palette.text.primary,
                                        mb: 4,
                                        lineHeight: 1.7,
                                        maxWidth: 720,
                                        fontWeight: 500,
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    Ditch the Notes app! Track your <span style={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold',
                                        textShadow: `0 0 10px ${theme.palette.primary.main}50`
                                    }}>progressive overload intelligently</span> — get personalized suggestions for when to increase weights, celebrate PRs automatically, and build muscle more effectively than ever.
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                                    <GlowingButton size="large" endIcon={<MdArrowForward />} onClick={handleGetStarted}>
                                        {currentUser ? 'Open FitForge' : 'Start Your Journey'}
                                    </GlowingButton>
                                    <Button
                                        variant="text"
                                        onClick={handleSignIn}
                                        sx={{ color: theme.palette.text.secondary }}
                                    >
                                        Already have an account? Sign In
                                    </Button>
                                </Box>

                                {/* Key Benefits */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {[
                                        { icon: '📈', text: 'Progressive Overload' },
                                        { icon: '🏆', text: 'Auto PR Detection' },
                                        { icon: '💡', text: 'Smart Suggestions' },
                                        { icon: '📱', text: 'Better Than Notes' }
                                    ].map((item, index) => (
                                        <Box key={index} sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            background: `${theme.palette.primary.main}18`,
                                            padding: '10px 16px',
                                            borderRadius: '20px',
                                            border: `1px solid ${theme.palette.primary.main}30`,
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: `${theme.palette.primary.main}28`,
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 8px 25px ${theme.palette.primary.main}30`
                                            }
                                        }}>
                                            <Typography sx={{ fontSize: '1.25rem' }}>{item.icon}</Typography>
                                            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                {item.text}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid2>
                    </Grid2>

                    {/* Problem Statement */}
                    <Box sx={{
                        mt: 10,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}14 0%, ${theme.palette.info.main}14 100%)`,
                        borderRadius: '24px',
                        border: `1px solid ${theme.palette.secondary.main}30`,
                        p: { xs: 4, md: 6 },
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 30% 70%, rgba(255, 0, 102, 0.15) 0%, transparent 50%)',
                            pointerEvents: 'none'
                        }} />

                        <Typography variant="h3" sx={{
                            color: theme.palette.secondary.light,
                            fontWeight: 'bold',
                            mb: 2,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            Tired of Using Notes App for Gym Progress? 😤
                        </Typography>

                        <Typography variant="h6" sx={{
                            color: theme.palette.text.muted,
                            maxWidth: 700,
                            mx: 'auto',
                            mb: 3,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            Scribbling weights in Notes, forgetting last session&apos;s numbers, no progress insights — there&apos;s a better way!
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 2.5,
                            position: 'relative',
                            zIndex: 1
                        }}>
                            {[
                                '📝 Notes app = Messy tracking',
                                '🤔 Forgot last weight = Guessing',
                                '📊 No insights = Slow progress',
                                '😵 Manual calculations = Wasted time'
                            ].map((problem, index) => (
                                <Box key={index} sx={{
                                    background: 'rgba(255, 0, 102, 0.2)',
                                    padding: '10px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 0, 102, 0.3)',
                                    color: '#ff6b9d',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}>
                                    {problem}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Container>
            </HeroSection>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 12 }}>
                <Box sx={{ textAlign: 'center', mb: 10 }}>
                    <Typography variant="h2" sx={{
                        fontWeight: 'bold',
                        mb: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Built for Progressive Overload 💪
                    </Typography>
                    <Typography variant="h6" sx={{
                        color: theme.palette.text.primary,
                        maxWidth: '700px',
                        mx: 'auto',
                        fontWeight: 500
                    }}>
                        Everything you need to track strength gains and build muscle more effectively than Notes app
                    </Typography>
                </Box>

                <Grid2 container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid2 xs={12} md={6} lg={4} key={index}>
                            <FeatureCard>
                                <CardContent sx={{ p: 4 }}>
                                    <Avatar sx={{
                                        width: 64,
                                        height: 64,
                                        backgroundColor: `${feature.color}20`,
                                        color: feature.color,
                                        mb: 3
                                    }}>
                                        <feature.icon style={{ fontSize: '2rem' }} />
                                    </Avatar>

                                    <Typography variant="h6" sx={{
                                        color: theme.palette.text.primary,
                                        fontWeight: 'bold',
                                        mb: 2
                                    }}>
                                        {feature.title}
                                    </Typography>

                                    <Typography variant="body2" sx={{
                                        color: theme.palette.text.muted,
                                        lineHeight: 1.6
                                    }}>
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid2>
                    ))}
                </Grid2>
            </Container>

            {/* Benefits Section */}
            <Box sx={{
                background: `linear-gradient(135deg, ${theme.palette.surface.primary} 0%, ${theme.palette.surface.secondary} 100%)`,
                py: 12
            }}>
                <Container maxWidth="lg">
                    <Grid2 container spacing={8} alignItems="center">
                        <Grid2 xs={12} md={6}>
                            <Typography variant="h2" sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 'bold',
                                mb: 3
                            }}>
                                Why Choose FitForge?
                            </Typography>

                            <Box sx={{ mb: 4 }}>
                                {benefits.map((benefit, index) => (
                                    <Box key={index} sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        mb: 2
                                    }}>
                                        <MdCheckCircle style={{ color: theme.palette.primary.main, fontSize: '1.5rem' }} />
                                        <Typography variant="body1" sx={{
                                            color: theme.palette.text.primary
                                        }}>
                                            {benefit}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            <GlowingButton
                                size="large"
                                endIcon={<MdArrowForward />}
                                onClick={handleGetStarted}
                            >
                                Get Started Now
                            </GlowingButton>
                        </Grid2>

                        <Grid2 xs={12} md={6}>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 3
                            }}>
                                {[
                                    { icon: MdSpeed, title: 'Fast & Reliable', desc: 'Optimized performance' },
                                    { icon: MdSecurity, title: 'Secure', desc: 'Your data is protected' },
                                    { icon: MdCloud, title: 'Cloud Sync', desc: 'Access anywhere' },
                                    { icon: MdTrendingUp, title: 'Analytics', desc: 'Track your progress' }
                                ].map((item, index) => (
                                    <Card key={index} sx={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${theme.palette.border.main}`,
                                        p: 3,
                                        textAlign: 'center'
                                    }}>
                                        <item.icon style={{
                                            fontSize: '3rem',
                                            color: theme.palette.primary.main,
                                            marginBottom: '1rem'
                                        }} />
                                        <Typography variant="h6" sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 'bold',
                                            mb: 1
                                        }}>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: theme.palette.text.muted
                                        }}>
                                            {item.desc}
                                        </Typography>
                                    </Card>
                                ))}
                            </Box>
                        </Grid2>
                    </Grid2>
                </Container>
            </Box>

            {/* CTA Section */}
            <Container maxWidth="lg" sx={{ py: 12 }}>
                <Box sx={{
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
                    borderRadius: '24px',
                    border: `1px solid ${theme.palette.primary.main}20`,
                    p: 8
                }}>
                    <Typography variant="h2" sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 'bold',
                        mb: 2
                    }}>
                        Ready to Get Stronger?
                    </Typography>

                    <Typography variant="h6" sx={{
                        color: theme.palette.text.muted,
                        mb: 4,
                        maxWidth: '600px',
                        mx: 'auto'
                    }}>
                        Join serious lifters who track their progressive overload intelligently.
                        Build muscle faster with FitForge&apos;s smart tracking system.
                    </Typography>

                    <GlowingButton
                        size="large"
                        endIcon={<MdArrowForward />}
                        onClick={handleGetStarted}
                        sx={{ fontSize: '1.2rem', py: 2, px: 4 }}
                    >
                        {currentUser ? 'Open FitForge' : 'Start Free Today'}
                    </GlowingButton>
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{
                borderTop: `1px solid ${theme.palette.border.main}`,
                py: 4,
                backgroundColor: theme.palette.background.dark
            }}>
                <Container maxWidth="lg">
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="img"
                                src={appLogo}
                                alt="FitForge Logo"
                                sx={{
                                    height: 40,
                                    width: 'auto'
                                }}
                            />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                © 2024 FitForge. Built with ❤️ for fitness enthusiasts.
                            </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Free & Open Source
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}