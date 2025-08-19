import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdPersonAddAlt, MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
        },
        '&:hover fieldset': {
            borderColor: '#dded00',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#dded00',
        },
    },
    '& label.Mui-focused': {
        color: '#dded00',
    },
});

const StyledCard = styled(Card)(({ theme }) => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
    },
}));

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { signup, loginWithGoogle } = useAuth();

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch (error) {
            setError('Failed to create an account: ' + error.message);
        }
        setLoading(false);
    }

    async function handleGoogleSignUp() {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/');
        } catch (error) {
            setError('Failed to sign up with Google: ' + error.message);
        }
        setLoading(false);
    }

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
            <StyledCard sx={{
                width: '100%',
                maxWidth: '400px',
                maxHeight: '90vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#dded00',
                    borderRadius: '3px',
                },
            }}>
                <CardHeader
                    title={
                        <Typography variant="h4" sx={{
                            color: '#dded00',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            mb: 1
                        }}>
                            Sign Up
                        </Typography>
                    }
                    subheader={
                        <Typography variant="subtitle1" sx={{
                            color: 'text.secondary',
                            textAlign: 'center'
                        }}>
                            Create your FitForge account
                        </Typography>
                    }
                />
                <CardContent>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                color: '#ff4444'
                            }}
                        >
                            {error}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <StyledTextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            margin="dense"
                            variant="outlined"
                        />
                        <StyledTextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            margin="dense"
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                        >
                                            {showPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <StyledTextField
                            fullWidth
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            margin="dense"
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowConfirmPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                        >
                                            {showConfirmPassword ? <MdOutlineVisibilityOff /> : <MdOutlineVisibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            type="submit"
                            fullWidth
                            disabled={loading}
                            sx={{
                                mt: 2,
                                mb: 1,
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                            }}
                            startIcon={<MdPersonAddAlt />}
                        >
                            Sign Up
                        </Button>
                        <Divider sx={{ my: 1.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Or continue with
                            </Typography>
                        </Divider>
                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<FcGoogle />}
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            sx={{
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                mb: 1,
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                },
                            }}
                        >
                            Sign up with Google
                        </Button>
                        <Typography
                            align="center"
                            sx={{
                                mt: 1,
                                color: 'text.secondary'
                            }}
                        >
                            Already have an account?{' '}
                            <Link
                                to="/signin"
                                style={{
                                    color: '#dded00',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                Sign In
                            </Link>
                        </Typography>
                    </Box>
                </CardContent>
            </StyledCard>
        </Box>
    );
} 