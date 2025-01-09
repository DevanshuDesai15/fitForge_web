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
    InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdOutlineLogin, MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";

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

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (error) {
            setError('Failed to sign in: ' + error.message);
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
                            Sign In
                        </Typography>
                    }
                    subheader={
                        <Typography variant="subtitle1" sx={{
                            color: 'text.secondary',
                            textAlign: 'center'
                        }}>
                            Welcome back to FitForge
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
                            startIcon={<MdOutlineLogin />}
                        >
                            Sign In
                        </Button>
                        <Typography
                            align="center"
                            sx={{
                                mt: 2,
                                color: 'text.secondary'
                            }}
                        >
                            Need an account?{' '}
                            <Link
                                to="/signup"
                                style={{
                                    color: '#00ff9f',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                Sign Up
                            </Link>
                        </Typography>
                    </form>
                </CardContent>
            </StyledCard>
        </Box>
    );
} 