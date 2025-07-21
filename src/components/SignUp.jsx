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
            borderColor: '#00ff9f',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#00ff9f',
        },
    },
    '& label.Mui-focused': {
        color: '#00ff9f',
    },
});

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
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
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
                padding: '1rem',
            }}
        >
            <StyledCard sx={{ width: '100%', maxWidth: '400px' }}>
                <CardHeader
                    title={
                        <Typography variant="h4" sx={{
                            color: '#00ff9f',
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <StyledTextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            margin="normal"
                            variant="outlined"
                        />
                        <StyledTextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            margin="normal"
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
                            margin="normal"
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
                                mt: 3,
                                mb: 2,
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                },
                            }}
                            startIcon={<MdPersonAddAlt />}
                        >
                            Sign Up
                        </Button>
                        <Divider sx={{ my: 2 }}>
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
                                mt: 2,
                                color: 'text.secondary'
                            }}
                        >
                            Already have an account?{' '}
                            <Link
                                to="/signin"
                                style={{
                                    color: '#00ff9f',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                Sign In
                            </Link>
                        </Typography>
                    </form>
                </CardContent>
            </StyledCard>
        </Box>
    );
} 