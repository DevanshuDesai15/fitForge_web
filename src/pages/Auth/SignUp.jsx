import { Box } from '@mui/material';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export default function SignUp() {
    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#121212',
                padding: { xs: '0.5rem', sm: '1rem' },
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <ClerkSignUp 
                routing="path" 
                path="/signup" 
                signInUrl="/signin" 
                appearance={{
                    variables: {
                        colorPrimary: '#dded00', 
                        colorBackground: '#282828', 
                        colorText: 'white',
                        colorTextSecondary: 'rgba(255,255,255,0.7)',
                        colorInputBackground: '#121212',
                        colorInputText: 'white',
                        borderRadius: '16px',
                        fontFamily: 'Inter, sans-serif'
                    },
                    elements: {
                        card: {
                            boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                        },
                        headerTitle: {
                            color: '#dded00',
                        },
                        formButtonPrimary: {
                            color: '#000',
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                            }
                        }
                    }
                }}
            />
        </Box>
    );
}