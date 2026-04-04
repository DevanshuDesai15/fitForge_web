import { Box, Typography } from '@mui/material';
import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import logo from '../../../public/logo.svg';
import signInHero from '../../assets/image/Signin.png';

export default function SignIn() {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0A0A0A' }}>
            {/* Left Column: Auth Form */}
            <Box
                sx={{
                    flex: '1 1 50%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: { xs: 4, sm: 8, md: 12 },
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Subtle top-left branding */}
                <Box sx={{ position: 'absolute', top: 40, left: 40, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 800, letterSpacing: '-0.5px', color: '#dded00' }}>
                        <img src={logo} alt="FitForge Logo" style={{ width: 40, height: 40, marginRight: 8 }} />
                        FitForge
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 1, letterSpacing: '-0.5px' }}>
                            Welcome back
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Enter your credentials to access your dashboard.
                        </Typography>
                    </Box>

                    <ClerkSignIn
                        routing="path"
                        path="/signin"
                        signUpUrl="/signup"
                        appearance={{
                            layout: {
                                socialButtonsPlacement: 'bottom',
                                socialButtonsVariant: 'blockButton',
                                showOptionalFields: false,
                            },
                            variables: {
                                colorPrimary: '#dded00',
                                colorBackground: 'transparent',
                                colorText: '#ffffff',
                                colorTextSecondary: 'rgba(255,255,255,0.6)',
                                colorInputBackground: '#121212',
                                colorInputText: '#ffffff',
                                borderRadius: '12px',
                                fontFamily: 'Inter, sans-serif',
                            },
                            elements: {
                                rootBox: {
                                    width: '100%',
                                },
                                card: {
                                    background: 'transparent',
                                    boxShadow: 'none',
                                    border: 'none',
                                    padding: 0,
                                },
                                headerTitle: {
                                    display: 'none',
                                },
                                headerSubtitle: {
                                    display: 'none',
                                },
                                socialButtonsBlock: {
                                    flexDirection: 'column',
                                    gap: '12px',
                                    width: '100%',
                                },
                                socialButtonsBlockButton: {
                                    backgroundColor: '#1E1E1E',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    transition: 'all 0.2s ease',
                                    height: '52px',
                                    width: '100%',
                                    '&:hover': {
                                        backgroundColor: '#2A2A2A',
                                        borderColor: '#dded00',
                                        transform: 'translateY(-2px)'
                                    }
                                },
                                socialButtonsBlockButton__apple: {
                                    '& img': {
                                        filter: 'invert(1)',
                                    }
                                },
                                socialButtonsBlockButtonText: {
                                    fontWeight: 600,
                                    fontSize: '15px',
                                },
                                dividerLine: {
                                    background: 'rgba(255,255,255,0.3)',
                                    height: '1px'
                                },
                                dividerText: {
                                    color: 'rgba(255,255,255,0.8)',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    letterSpacing: '1px',
                                    fontWeight: 700
                                },
                                formFieldInput: {
                                    backgroundColor: '#121212',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: '12px 16px',
                                    transition: 'all 0.2s ease',
                                    '&:focus': {
                                        borderColor: '#dded00',
                                        boxShadow: '0 0 0 2px rgba(221, 237, 0, 0.1)',
                                    }
                                },
                                formFieldLabel: {
                                    color: 'rgba(255,255,255,0.8)',
                                    fontWeight: 500,
                                },
                                formButtonPrimary: {
                                    backgroundColor: '#dded00',
                                    color: '#000',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    padding: '12px',
                                    textTransform: 'none',
                                    letterSpacing: '0px',
                                    transition: 'all 0.2s ease',
                                    border: 'none',
                                    '&:hover': {
                                        backgroundColor: '#e8f15d',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 20px rgba(221, 237, 0, 0.2)',
                                    }
                                },
                                footerActionText: {
                                    color: 'rgba(255,255,255,0.6)',
                                },
                                footerActionLink: {
                                    color: '#dded00',
                                    fontWeight: 600,
                                    '&:hover': {
                                        color: '#e8f15d',
                                    }
                                }
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Right Column: Hero Graphic */}
            <Box
                sx={{
                    flex: '1 1 50%',
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#121212',
                }}
            >
                {/* Modern Mesh Gradient Background */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.8,
                        background: `
                            radial-gradient(circle at 15% 50%, rgba(221, 237, 0, 0.15), transparent 25%),
                            radial-gradient(circle at 85% 30%, rgba(221, 237, 0, 0.1), transparent 25%)
                        `,
                        zIndex: 0,
                    }}
                />

                {/* A glowing orb/accent in the center */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '600px',
                        height: '600px',
                        background: 'radial-gradient(circle, rgba(221, 237, 0, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        filter: 'blur(40px)',
                        zIndex: 0,
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480, textAlign: 'center', px: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                        component="img"
                        src={signInHero}
                        alt="FitForge Interface"
                        sx={{
                            width: '100%',
                            maxWidth: '380px',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(221, 237, 0, 0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            mb: 3,
                            perspective: '2000px',
                            transform: 'rotateY(-10deg) rotateX(5deg) scale(1.02)',
                            transition: 'all 0.5s ease-in-out',
                            '@keyframes float': {
                                '0%, 100%': { transform: 'translateY(0) rotateY(-10deg) rotateX(5deg) scale(1.02)' },
                                '50%': { transform: 'translateY(-10px) rotateY(-8deg) rotateX(4deg) scale(1.03)' },
                            },
                            animation: 'float 6s ease-in-out infinite',
                            '&:hover': {
                                transform: 'rotateY(0deg) rotateX(0deg) scale(1.05)',
                                animationPlayState: 'paused',
                                boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(221, 237, 0, 0.15)',
                            }
                        }}
                    />
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            color: '#fff',
                            fontSize: '2.75rem',
                            lineHeight: 1.1,
                            letterSpacing: '-1.5px',
                            mb: 2
                        }}
                    >
                        Precision training. <br />
                        Powered by AI.
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255,255,255,0.5)',
                            fontWeight: 400,
                            lineHeight: 1.5
                        }}
                    >
                        Unlock your ultimate potential with intelligent programming, progressive overload tracking, and hyper-personalized analytics.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}