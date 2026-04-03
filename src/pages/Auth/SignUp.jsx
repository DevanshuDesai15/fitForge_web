import { Box, Typography } from '@mui/material';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export default function SignUp() {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
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
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#dded00' }}>
                        FitForge <span style={{ color: '#fff', opacity: 0.5 }}>//</span>
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 1, letterSpacing: '-0.5px' }}>
                            Join the forge
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Create an account to start building your ultimate self.
                        </Typography>
                    </Box>

                    <ClerkSignUp
                        routing="path"
                        path="/signup"
                        signInUrl="/signin"
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

                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480, textAlign: 'center', px: 4 }}>
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            fontWeight: 900, 
                            color: '#fff', 
                            fontSize: '3.5rem',
                            lineHeight: 1.1,
                            letterSpacing: '-1.5px',
                            mb: 2 
                        }}
                    >
                        Built for <br />
                        High Performers.
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: 'rgba(255,255,255,0.5)', 
                            fontWeight: 400,
                            lineHeight: 1.5
                        }}
                    >
                        Stop guessing in the gym. Join FitForge and let personalized AI intelligence drive your next personal record.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}