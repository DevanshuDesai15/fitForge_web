import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    Grid,
    CircularProgress,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db } from '../firebase/config';
import { MdArrowBack, MdPerson, MdEmail, MdLock, MdSave, MdLogout, MdSettings, MdCleaningServices } from "react-icons/md";

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

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

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userData, setUserData] = useState({
        username: '',
        fullName: '',
        age: '',
        weight: '',
        email: currentUser?.email || '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        loadUserData();
    }, [currentUser]);

    const loadUserData = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(prev => ({
                    ...prev,
                    username: data.username || '',
                    fullName: data.fullName || '',
                    age: data.age || '',
                    weight: data.weight || '',
                }));
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Update user profile data
            await setDoc(doc(db, 'users', currentUser.uid), {
                username: userData.username,
                fullName: userData.fullName,
                age: userData.age,
                weight: userData.weight,
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            // Update email if changed
            if (userData.email !== currentUser.email) {
                await updateEmail(currentUser, userData.email);
            }

            // Update password if provided
            if (userData.newPassword) {
                if (userData.newPassword !== userData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                await updatePassword(currentUser, userData.newPassword);
            }

            setSuccess('Profile updated successfully!');
            // Clear password fields after successful update
            setUserData(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            setError('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <StyledCard>
                    <CardHeader
                        title={
                            <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                                Profile Settings
                            </Typography>
                        }
                        action={
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    startIcon={<MdArrowBack />}
                                    onClick={() => navigate('/')}
                                    sx={{
                                        color: '#00ff9f',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                        },
                                    }}
                                >
                                    Back to Home
                                </Button>
                                <Button
                                    onClick={logout}
                                    variant="outlined"
                                    color="error"
                                    startIcon={<MdLogout />}
                                >
                                    Logout
                                </Button>
                            </Box>
                        }
                    />
                    <CardContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff4444' }}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(0, 255, 159, 0.1)', color: '#00ff9f' }}>
                                {success}
                            </Alert>
                        )}

                        {/* Data Management Section */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdSettings /> Data Management
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<MdCleaningServices />}
                                        onClick={() => navigate('/exercise-manager')}
                                        sx={{
                                            borderColor: '#00ff9f',
                                            color: '#00ff9f',
                                            '&:hover': {
                                                borderColor: '#00e676',
                                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                            },
                                        }}
                                    >
                                        Exercise Data Manager
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        Find and merge duplicate exercises, fix spelling mistakes, and clean up your exercise data.
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

                        <form onSubmit={handleUpdateProfile}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdPerson /> Personal Information
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={userData.username}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={userData.fullName}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        type="number"
                                        label="Age"
                                        name="age"
                                        value={userData.age}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        type="number"
                                        label="Weight (kg)"
                                        name="weight"
                                        value={userData.weight}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdEmail /> Email Settings
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <StyledTextField
                                        fullWidth
                                        type="email"
                                        label="Email"
                                        name="email"
                                        value={userData.email}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                                    <Typography variant="h6" sx={{ color: '#00ff9f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MdLock /> Password Settings
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        type="password"
                                        label="New Password"
                                        name="newPassword"
                                        value={userData.newPassword}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <StyledTextField
                                        fullWidth
                                        type="password"
                                        label="Confirm New Password"
                                        name="confirmPassword"
                                        value={userData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <MdSave />}
                                        sx={{
                                            mt: 3,
                                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #00e676 30%, #00ff9f 90%)',
                                            },
                                        }}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
}