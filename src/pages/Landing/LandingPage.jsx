import {
    Box,
    Typography,
    Button,
    Container,
    Grid2,
    Card,
    CardContent,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useRef } from 'react';
import { styled } from '@mui/material/styles';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
    History as MdHistory,
    LineChart as MdShowChart,
    TrendingUp as MdTrendingUp,
    ArrowRight as MdArrowForward,
    CheckCircle as MdCheckCircle,
    Trophy as MdEmojiEvents
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import appLogo from '../../assets/appLogo.svg';
import appScreenshot from '../../assets/appScreenshot.png';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HeroSection = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: '#121212',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `
            radial-gradient(circle at 18% 18%, ${theme.palette.primary.main}16 0%, transparent 34%),
            radial-gradient(circle at 84% 22%, ${theme.palette.info.main}14 0%, transparent 32%),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 42%)
        `,
        pointerEvents: 'none',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `
            conic-gradient(from 0deg at 50% 50%,
                transparent 0deg,
                ${theme.palette.primary.main}08 70deg,
                transparent 140deg,
                ${theme.palette.secondary.main}08 210deg,
                transparent 280deg,
                ${theme.palette.info.main}08 360deg)
        `,
        animation: 'rotate 24s linear infinite',
        pointerEvents: 'none',
    },
    '@keyframes rotate': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
    }
}));

const PhoneMock = styled('div')(({ theme }) => ({
    width: 320,
    maxWidth: '100%',
    height: 680,
    borderRadius: 36,
    padding: 14,
    background:
        `radial-gradient(1200px 600px at -20% -10%, ${theme.palette.primary.main}30, transparent 60%),
         radial-gradient(800px 400px at 120% 110%, ${theme.palette.secondary.main}25, transparent 60%),
         linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
    border: `1px solid ${theme.palette.border.strong}`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(145deg, rgba(21, 27, 38, 0.92) 0%, rgba(26, 34, 48, 0.88) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: `1px solid ${theme.palette.border.main}`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: '0 0 auto 0',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        opacity: 0.7
    },
    '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: theme.palette.border.strong,
        boxShadow: '0 24px 54px rgba(0, 0, 0, 0.28)'
    }
}));

const GlowingButton = styled(Button)(({ theme }) => ({
    background: theme.palette.background.gradient.button,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    fontSize: '1.1rem',
    padding: '16px 36px',
    borderRadius: '999px',
    textTransform: 'none',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent)',
        transition: 'left 0.6s ease',
    },
    '&:hover': {
        background: theme.palette.background.gradient.buttonHover,
        transform: 'translateY(-3px)',
        boxShadow: '0 18px 42px rgba(0, 0, 0, 0.34)',
        '&::before': {
            left: '100%',
        }
    }
}));

export default function LandingPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const rootRef = useRef(null);

    const transformationPanels = [
        {
            testId: 'landing-transformation-panel-baseline',
            storyKey: 'baseline',
            icon: MdHistory,
            eyebrow: 'Baseline',
            title: 'See where effort turns into uncertainty',
            description:
                'You trained hard, but your notes still leave you wondering if your body is actually adapting.',
            accent: theme.palette.secondary.main
        },
        {
            testId: 'landing-transformation-panel-analysis',
            storyKey: 'analysis',
            icon: MdShowChart,
            eyebrow: 'Analysis',
            title: 'Let the coach read your progress signal',
            description:
                'FitForge interprets consistency, output, and recovery patterns so your next decision comes from evidence.',
            accent: theme.palette.info.main
        },
        {
            testId: 'landing-transformation-panel-momentum',
            storyKey: 'momentum',
            icon: MdTrendingUp,
            eyebrow: 'Momentum',
            title: 'Build visible transformation momentum',
            description:
                'Every session compounds into a clearer read on what is working and how to keep pushing forward.',
            accent: theme.palette.primary.main
        }
    ];

    const trustSignals = [
        'Real session timelines',
        'Progress snapshots',
        'Coaching cues grounded in logged effort'
    ];

    const premiumCapabilities = [
        {
            title: 'Adaptive progression',
            description: 'Weekly recommendations tighten volume, intensity, and exercise focus around the signal your body is actually sending.',
            accent: theme.palette.primary.main
        },
        {
            title: 'Recovery-aware coaching',
            description: 'Momentum reads account for recent output and fatigue patterns so the next push feels deliberate instead of random.',
            accent: theme.palette.info.main
        },
        {
            title: 'Transformation proof',
            description: 'Every phase keeps a visible trail of what changed, which blocks are working, and where momentum is accelerating.',
            accent: theme.palette.secondary.main
        }
    ];

    const proofMetrics = [
        {
            // Keep this synced with the current coached-session export or analytics snapshot.
            // If the metric changes, update the copy here and in any launch/reporting materials.
            value: '42K coached workouts',
            detail: 'Logged sessions feeding live momentum reads across strength, volume, and consistency.'
        },
        {
            value: 'Live progress timelines',
            detail: 'Session history, performance context, and coach takeaways stitched into one clear signal.'
        }
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

    useGSAP(() => {
        const mm = gsap.matchMedia();
        const desktopQuery = `(min-width: ${theme.breakpoints.values.md}px)`;

        mm.add('(prefers-reduced-motion: reduce)', () => {
            gsap.set('[data-animate]', {
                autoAlpha: 1,
                clearProps: 'opacity,visibility,transform'
            });
        });

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const heroTimeline = gsap.timeline({
                defaults: {
                    duration: 0.75,
                    ease: 'power2.out'
                }
            });

            heroTimeline
                .from('[data-animate="nav"]', { autoAlpha: 0, y: -18 })
                .from('[data-animate="hero-badge"]', { autoAlpha: 0, y: 18 }, '-=0.45')
                .from('[data-animate="hero-title"]', { autoAlpha: 0, y: 24 }, '-=0.4')
                .from('[data-animate="hero-copy"]', { autoAlpha: 0, y: 20 }, '-=0.45')
                .from('[data-animate="hero-cta"]', { autoAlpha: 0, y: 18 }, '-=0.4')
                .from('[data-animate="hero-proof"]', {
                    autoAlpha: 0,
                    y: 14,
                    stagger: 0.08
                }, '-=0.35')
                .from('[data-animate="hero-visual"]', {
                    autoAlpha: 0,
                    y: 28,
                    scale: 0.97
                }, '-=0.6')
                .from('[data-animate="hero-floating-card"]', {
                    autoAlpha: 0,
                    y: 16,
                    scale: 0.98,
                    stagger: 0.08
                }, '-=0.45');

            gsap.to('[data-animate="hero-visual"]', {
                y: -10,
                rotation: -1,
                duration: 4.8,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });

            gsap.to('[data-animate-variant="hero-floating-card-top"]', {
                y: -12,
                duration: 4.2,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });

            gsap.to('[data-animate-variant="hero-floating-card-bottom"]', {
                y: 10,
                duration: 5,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });

            [
                '[data-animate="problem-section"]',
                '[data-animate="trust-section"]'
            ].forEach((selector) => {
                gsap.fromTo(
                    selector,
                    { autoAlpha: 0, y: isMobile ? 18 : 28 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: selector,
                            start: 'top 82%',
                            once: true
                        }
                    }
                );
            });

            if (isMobile) {
                gsap.fromTo(
                    '[data-animate="transformation-section"]',
                    { autoAlpha: 0, y: 18 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: '[data-animate="transformation-section"]',
                            start: 'top 82%',
                            once: true
                        }
                    }
                );

                gsap.fromTo(
                    '[data-animate="transformation-panel"]',
                    { autoAlpha: 0, y: 18 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.72,
                        ease: 'power2.out',
                        stagger: 0.12,
                        scrollTrigger: {
                            trigger: '[data-animate="transformation-grid"]',
                            start: 'top 78%',
                            once: true
                        }
                    }
                );

                gsap.fromTo(
                    '[data-animate="transformation-capability"]',
                    { autoAlpha: 0, y: 18 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.65,
                        ease: 'power2.out',
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: '[data-animate="transformation-capability-rail"]',
                            start: 'top 82%',
                            once: true
                        }
                    }
                );
            }

            mm.add(desktopQuery, () => {
                gsap.set('[data-animate="transformation-section"]', { autoAlpha: 1 });
                gsap.set('[data-animate="transformation-intro"]', { autoAlpha: 1, y: 0 });
                gsap.set('[data-animate="transformation-grid"]', { y: 0 });
                gsap.set('[data-animate="transformation-capability-rail"]', { y: 0 });
                gsap.set('[data-animate="transformation-panel"]', {
                    autoAlpha: 0.3,
                    y: 36,
                    scale: 0.94
                });
                gsap.set('[data-animate="transformation-capability"]', {
                    autoAlpha: 0.35,
                    y: 24
                });
                gsap.set('[data-animate-variant="transformation-panel-baseline"]', {
                    autoAlpha: 0.96,
                    y: 0,
                    scale: 1,
                    xPercent: 0
                });
                gsap.set('[data-animate-variant="transformation-panel-analysis"]', {
                    xPercent: 0
                });
                gsap.set('[data-animate-variant="transformation-panel-momentum"]', {
                    xPercent: 0
                });

                const transformationTimeline = gsap.timeline({
                    defaults: {
                        duration: 0.42,
                        ease: 'power2.out'
                    },
                    scrollTrigger: {
                        trigger: '[data-animate="transformation-section"]',
                        start: 'top top+=96',
                        end: '+=150%',
                        pin: true,
                        scrub: true,
                        anticipatePin: 1
                    }
                });

                transformationTimeline
                    .to('[data-animate="transformation-intro"]', {
                        y: -30,
                        autoAlpha: 0.45
                    }, 0.08)
                    .to('[data-animate-variant="transformation-panel-baseline"]', {
                        autoAlpha: 0.58,
                        xPercent: -8,
                        y: 10,
                        scale: 0.96
                    }, 0.52)
                    .to('[data-animate-variant="transformation-panel-analysis"]', {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1
                    }, 0.52)
                    .to('[data-animate="transformation-grid"]', {
                        y: -10
                    }, 0.52)
                    .to('[data-animate-variant="transformation-panel-baseline"]', {
                        autoAlpha: 0.24,
                        xPercent: -14,
                        y: 20,
                        scale: 0.92
                    }, 0.98)
                    .to('[data-animate-variant="transformation-panel-analysis"]', {
                        autoAlpha: 0.62,
                        xPercent: -6,
                        y: 10,
                        scale: 0.96
                    }, 0.98)
                    .to('[data-animate-variant="transformation-panel-momentum"]', {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1
                    }, 0.98)
                    .to('[data-animate="transformation-capability"]', {
                        autoAlpha: 1,
                        y: 0,
                        stagger: 0.1,
                        duration: 0.28
                    }, 1.24)
                    .to('[data-animate="transformation-capability-rail"]', {
                        y: -8,
                        duration: 0.28
                    }, 1.24);
            });
        });

        return () => {
            mm.revert();
        };
    }, { scope: rootRef, dependencies: [isMobile] });

    return (
        <Box
            ref={rootRef}
            data-testid="landing-root"
            sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}
        >
            <HeroSection data-testid="landing-hero-section">
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                        data-animate="nav"
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 3,
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="img"
                                src={appLogo}
                                alt="FitForge Logo"
                                sx={{ height: 48, width: 'auto' }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

                    <Grid2 container spacing={{ xs: 5, md: 6 }} sx={{ alignItems: 'center', py: { xs: 4, md: 8 } }}>
                        <Grid2 size={{ xs: 12, md: 7 }}>
                            <Box sx={{ position: 'relative', zIndex: 2 }}>
                                <Box
                                    data-animate="hero-badge"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.18) 0%, rgba(227, 239, 63, 0.08) 100%)',
                                        padding: '8px 18px',
                                        borderRadius: '999px',
                                        border: '1px solid rgba(221, 237, 0, 0.32)',
                                        mb: 3
                                    }}
                                >
                                    <Typography sx={{ color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.9rem' }}>
                                        Premium AI coaching for measurable change
                                    </Typography>
                                </Box>

                                <Typography
                                    variant={isMobile ? 'h2' : 'h1'}
                                    data-animate="hero-title"
                                    sx={{
                                        fontWeight: 800,
                                        mb: 3,
                                        lineHeight: 1.02,
                                        letterSpacing: { xs: '-0.6px', md: '-1.6px' },
                                        maxWidth: 760,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 42%, ${theme.palette.info.light || theme.palette.info.main} 100%)`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}
                                >
                                    Transform your body with an AI coach that tracks momentum
                                </Typography>

                                <Typography
                                    variant={isMobile ? 'h6' : 'h5'}
                                    data-animate="hero-copy"
                                    sx={{
                                        color: theme.palette.text.primary,
                                        mb: 4,
                                        lineHeight: 1.6,
                                        maxWidth: 700,
                                        fontWeight: 500
                                    }}
                                >
                                    Stop guessing. Start reading your body's progress signal.
                                </Typography>

                                <Box
                                    data-animate="hero-cta"
                                    sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 4 }}
                                >
                                    <GlowingButton size="large" endIcon={<MdArrowForward />} onClick={handleGetStarted}>
                                        {currentUser ? 'Open FitForge' : 'Start Transforming'}
                                    </GlowingButton>
                                    {!currentUser && (
                                        <Button
                                            variant="text"
                                            onClick={handleSignIn}
                                            sx={{ color: theme.palette.text.secondary }}
                                        >
                                            Already training? Sign In
                                        </Button>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {[
                                        'Progress signal clarity',
                                        'AI session analysis',
                                        'Momentum you can measure'
                                    ].map((signal) => (
                                        <Box
                                            key={signal}
                                            data-animate="hero-proof"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 2,
                                                py: 1.25,
                                                borderRadius: '999px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${theme.palette.border.main}`
                                            }}
                                        >
                                            <MdCheckCircle size={16} color={theme.palette.primary.main} />
                                            <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', fontWeight: 600 }}>
                                                {signal}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid2>

                        <Grid2 size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box
                                data-testid="landing-hero-visual"
                                data-animate="hero-visual"
                                sx={{ position: 'relative', width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'center' }}
                            >
                                <Box
                                    data-animate="hero-floating-card"
                                    data-animate-variant="hero-floating-card-top"
                                    sx={{
                                        position: 'absolute',
                                        top: '10%',
                                        right: { xs: 12, md: -36 },
                                        background: `linear-gradient(135deg, ${theme.palette.info.main}20, transparent)`,
                                        border: `1px solid ${theme.palette.info.main}40`,
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '18px',
                                        px: 2,
                                        py: 1.5,
                                        zIndex: 2,
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: theme.palette.text.muted, display: 'block', mb: 0.5 }}>
                                        Momentum signal
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                                        +3 strong sessions
                                    </Typography>
                                </Box>

                                <Box
                                    data-animate="hero-floating-card"
                                    data-animate-variant="hero-floating-card-bottom"
                                    sx={{
                                        position: 'absolute',
                                        bottom: '14%',
                                        left: { xs: 12, md: -28 },
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}22, transparent)`,
                                        border: `1px solid ${theme.palette.primary.main}40`,
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '18px',
                                        px: 2,
                                        py: 1.5,
                                        zIndex: 2,
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: theme.palette.text.muted, display: 'block', mb: 0.5 }}>
                                        Coach insight
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 700 }}>
                                        Push lower-body volume
                                    </Typography>
                                </Box>

                                <PhoneMock>
                                    <Box
                                        component="img"
                                        src={appScreenshot}
                                        alt="FitForge App Screenshot"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '28px',
                                        }}
                                    />
                                </PhoneMock>
                            </Box>
                        </Grid2>
                    </Grid2>
                </Container>
            </HeroSection>

            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
                <Box
                    data-testid="landing-problem-progress-section"
                    data-animate="problem-section"
                    sx={{
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}12 0%, ${theme.palette.info.main}12 100%)`,
                        borderRadius: '28px',
                        border: `1px solid ${theme.palette.border.main}`,
                        px: { xs: 3, md: 6 },
                        py: { xs: 4, md: 5.5 },
                        mb: { xs: 8, md: 10 }
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{ color: theme.palette.text.primary, fontWeight: 800, mb: 2, maxWidth: 840, mx: 'auto' }}
                    >
                        From baseline confusion to visible transformation momentum
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ color: theme.palette.text.muted, maxWidth: 760, mx: 'auto', lineHeight: 1.7 }}
                    >
                        Most training tools tell you what you did. FitForge is built to show whether that work is compounding into measurable change.
                    </Typography>
                </Box>

                <Box
                    component="section"
                    data-testid="landing-transformation-section"
                    data-animate="transformation-section"
                    sx={{ mb: { xs: 8, md: 10 } }}
                >
                    <Box data-animate="transformation-intro" sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography variant="h2" sx={{ color: theme.palette.text.primary, fontWeight: 800, mb: 2 }}>
                            The transformation story
                        </Typography>
                        <Typography variant="body1" sx={{ color: theme.palette.text.muted, maxWidth: 720, mx: 'auto', lineHeight: 1.7 }}>
                            A simple coaching loop: understand your starting point, interpret the signal, then build forward momentum with clarity.
                        </Typography>
                    </Box>

                    <Grid2 data-animate="transformation-grid" container spacing={3}>
                        {transformationPanels.map((panel) => {
                            const Icon = panel.icon;

                            return (
                                <Grid2 key={panel.testId} size={{ xs: 12, md: 4 }}>
                                    <FeatureCard
                                        data-testid={panel.testId}
                                        data-animate="transformation-panel"
                                        data-animate-variant={`transformation-panel-${panel.storyKey}`}
                                        sx={{
                                            borderColor: `${panel.accent}35`,
                                            background: `linear-gradient(145deg, rgba(21, 27, 38, 0.95) 0%, ${panel.accent}12 100%)`
                                        }}
                                    >
                                        <CardContent sx={{ p: 4 }}>
                                            <Box
                                                sx={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 3,
                                                    backgroundColor: `${panel.accent}20`,
                                                    color: panel.accent
                                                }}
                                            >
                                                <Icon size={24} />
                                            </Box>
                                            <Typography sx={{ color: panel.accent, fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}>
                                                {panel.eyebrow}
                                            </Typography>
                                            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 2, lineHeight: 1.25 }}>
                                                {panel.title}
                                            </Typography>
                                            <Typography sx={{ color: theme.palette.text.muted, lineHeight: 1.7 }}>
                                                {panel.description}
                                            </Typography>
                                        </CardContent>
                                    </FeatureCard>
                                </Grid2>
                            );
                        })}
                    </Grid2>

                    <Grid2
                        container
                        spacing={2.5}
                        sx={{ mt: 3.5 }}
                        data-animate="transformation-capability-rail"
                    >
                        {premiumCapabilities.map((capability) => (
                            <Grid2 key={capability.title} size={{ xs: 12, md: 4 }}>
                                <Box
                                    data-testid={`landing-premium-capability-${capability.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                    data-animate="transformation-capability"
                                    sx={{
                                        height: '100%',
                                        px: 3,
                                        py: 2.75,
                                        borderRadius: '22px',
                                        background: `linear-gradient(180deg, ${capability.accent}14 0%, rgba(10, 14, 20, 0.96) 100%)`,
                                        border: `1px solid ${capability.accent}30`,
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                                    }}
                                >
                                    <Typography sx={{ color: capability.accent, fontWeight: 700, mb: 1.1, letterSpacing: '0.03em' }}>
                                        {capability.title}
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.muted, lineHeight: 1.7 }}>
                                        {capability.description}
                                    </Typography>
                                </Box>
                            </Grid2>
                        ))}
                    </Grid2>
                </Box>

                <Box
                    component="section"
                    data-testid="landing-final-cta"
                    data-animate="trust-section"
                    sx={{
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${theme.palette.surface.primary} 0%, ${theme.palette.surface.secondary} 100%)`,
                        borderRadius: '28px',
                        border: `1px solid ${theme.palette.border.main}`,
                        px: { xs: 3, md: 6 },
                        py: { xs: 4, md: 6 }
                    }}
                >
                    <Typography variant="h2" sx={{ color: theme.palette.text.primary, fontWeight: 800, mb: 2 }}>
                        Trusted by lifters building measurable momentum
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.text.muted, maxWidth: 720, mx: 'auto', mb: 4, lineHeight: 1.7 }}>
                        Real proof from real training sessions.
                    </Typography>

                    <Grid2 container spacing={3} sx={{ mb: 4 }}>
                        <Grid2 size={{ xs: 12, md: 4 }}>
                            <FeatureCard data-testid="landing-session-backed-wins-card">
                                <CardContent sx={{ p: 3.5 }}>
                                    <MdEmojiEvents size={24} color={theme.palette.primary.main} />
                                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, mt: 2, mb: 1 }}>
                                        Session-backed wins
                                    </Typography>
                                    <Typography sx={{ color: theme.palette.text.muted, lineHeight: 1.7 }}>
                                        PR moments and consistency streaks are tied back to the training sessions that created them.
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid2>
                        <Grid2 size={{ xs: 12, md: 8 }}>
                            <FeatureCard data-testid="landing-proof-metrics-card">
                                <CardContent sx={{ p: 3.5 }}>
                                    <Grid2 container spacing={2} sx={{ mb: 2.5 }} data-testid="landing-proof-metrics-grid">
                                        {proofMetrics.map((metric) => (
                                            <Grid2
                                                key={metric.value}
                                                size={{ xs: 12, md: 6 }}
                                                data-testid={`landing-proof-metric-${metric.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                            >
                                                <Box
                                                    sx={{
                                                        height: '100%',
                                                        textAlign: 'left',
                                                        px: 2.25,
                                                        py: 2,
                                                        borderRadius: '18px',
                                                        background: 'rgba(255,255,255,0.04)',
                                                        border: `1px solid ${theme.palette.border.main}`
                                                    }}
                                                >
                                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 800, mb: 1 }}>
                                                        {metric.value}
                                                    </Typography>
                                                    <Typography sx={{ color: theme.palette.text.muted, lineHeight: 1.65 }}>
                                                        {metric.detail}
                                                    </Typography>
                                                </Box>
                                            </Grid2>
                                        ))}
                                    </Grid2>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.25, mb: 2.5 }}>
                                        {trustSignals.map((signal) => (
                                            <Box
                                                key={signal}
                                                sx={{
                                                    px: 1.75,
                                                    py: 0.9,
                                                    borderRadius: '999px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${theme.palette.border.main}`
                                                }}
                                            >
                                                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.88rem' }}>
                                                    {signal}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Typography sx={{ color: theme.palette.text.muted, lineHeight: 1.7, maxWidth: 640, mx: 'auto' }}>
                                        FitForge closes on earned trust: premium coaching language backed by session history, measurable momentum, and proof that feels specific to lifters.
                                    </Typography>
                                </CardContent>
                            </FeatureCard>
                        </Grid2>
                    </Grid2>

                    <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600, maxWidth: 680, mx: 'auto', mb: 3 }}>
                        Turn every workout into a clearer read on what is changing, what is stalling, and where your next breakthrough is coming from.
                    </Typography>

                    <GlowingButton size="large" endIcon={<MdArrowForward />} onClick={handleGetStarted}>
                        {currentUser ? 'Open FitForge' : 'Begin Your Transformation'}
                    </GlowingButton>
                </Box>
            </Container>

            <Box
                sx={{
                    borderTop: `1px solid ${theme.palette.border.main}`,
                    py: 4,
                    backgroundColor: theme.palette.background.dark
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                component="img"
                                src={appLogo}
                                alt="FitForge Logo"
                                sx={{ height: 40, width: 'auto' }}
                            />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                © 2024 FitForge. Built for lifters chasing visible change.
                            </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            Built to turn training data into visible momentum
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
