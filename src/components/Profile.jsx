import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    Grid,
    CircularProgress,
    Switch,
    useMediaQuery,
    useTheme,
    Avatar,
    Chip,
    Paper,
    Container,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db } from '../firebase/config';
import { MdArrowBack, MdPerson, MdEmail, MdLock, MdSave, MdLogout, MdSettings, MdCleaningServices, MdFitnessCenter, MdAccountCircle, MdVerified } from "react-icons/md";
import maleAvatar from '../assets/image/avatars/maleAv.png';
import femaleAvatar from '../assets/image/avatars/femaleAv.png';

const ProfileHeaderCard = styled(Paper)(() => ({
    background: '#282828',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: '#dded00',
        animation: 'shimmer 2s ease-in-out infinite',
    },
    '@keyframes shimmer': {
        '0%': { backgroundPosition: '-200px 0' },
        '100%': { backgroundPosition: '200px 0' },
    },
}));

const SectionCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        boxShadow: '0 4px 20px rgba(221, 237, 0, 0.1)',
    },
}));

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(221, 237, 0, 0.5)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#dded00',
            borderWidth: '2px',
            boxShadow: '0 0 0 3px rgba(221, 237, 0, 0.1)',
        },
        '&.Mui-focused': {
            backgroundColor: 'rgba(221, 237, 0, 0.05)',
        },
    },
    '& label.Mui-focused': {
        color: '#dded00',
        fontWeight: '500',
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiOutlinedInput-input': {
        color: '#ffffff',
        fontSize: '16px',
    },
});

const GradientButton = styled(Button)(({ variant }) => ({
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: '600',
    fontSize: '16px',
    padding: '12px 24px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(variant === 'primary' && {
        background: 'linear-gradient(135deg, #dded00 0%, #e8f15d 100%)',
        color: '#000',
        border: 'none',
        '&:hover': {
            background: 'linear-gradient(135deg, #e8f15d 0%, #edf377 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(221, 237, 0, 0.3)',
        },
        '&:disabled': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.3)',
        },
    }),
    ...(variant === 'secondary' && {
        background: 'transparent',
        color: '#dded00',
        border: '2px solid rgba(221, 237, 0, 0.3)',
        '&:hover': {
            backgroundColor: 'rgba(221, 237, 0, 0.1)',
            borderColor: '#dded00',
            transform: 'translateY(-1px)',
        },
    }),
}));

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'lb'
    const [userData, setUserData] = useState({
        username: '',
        fullName: '',
        age: '',
        weight: '',
        gender: 'male', // default to male
        email: currentUser?.email || '',
        newPassword: '',
        confirmPassword: '',
    });

    const loadWeightUnit = () => {
        const savedUnit = localStorage.getItem('weightUnit') || 'kg';
        setWeightUnit(savedUnit);
    };

    const convertWeight = (weight, fromUnit, toUnit) => {
        if (!weight || fromUnit === toUnit) return weight;

        if (fromUnit === 'kg' && toUnit === 'lb') {
            return (parseFloat(weight) * 2.20462).toFixed(1);
        } else if (fromUnit === 'lb' && toUnit === 'kg') {
            return (parseFloat(weight) / 2.20462).toFixed(1);
        }
        return weight;
    };

    const handleWeightUnitChange = (newUnit) => {
        const currentWeight = userData.weight;
        const convertedWeight = convertWeight(currentWeight, weightUnit, newUnit);

        setWeightUnit(newUnit);
        setUserData(prev => ({
            ...prev,
            weight: convertedWeight
        }));

        // Save to localStorage immediately
        localStorage.setItem('weightUnit', newUnit);
    };

    const loadUserData = useCallback(async () => {
        if (!currentUser) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();

                // Load weight unit preference from Firebase if available
                const savedWeightUnit = data.weightUnit || localStorage.getItem('weightUnit') || 'kg';
                setWeightUnit(savedWeightUnit);
                localStorage.setItem('weightUnit', savedWeightUnit);

                setUserData(prev => ({
                    ...prev,
                    username: data.username || '',
                    fullName: data.fullName || '',
                    age: data.age || '',
                    weight: data.weight || '',
                    gender: data.gender || 'male',
                }));
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        loadUserData();
        loadWeightUnit();
    }, [loadUserData]);

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
            // Update user profile data including weight unit preference and gender
            await setDoc(doc(db, 'users', currentUser.uid), {
                username: userData.username,
                fullName: userData.fullName,
                age: userData.age,
                weight: userData.weight,
                gender: userData.gender,
                weightUnit: weightUnit, // Save weight unit preference
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
            background: '#121212',
            position: 'relative',
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
        }}>
            <Container maxWidth="lg" sx={{
                py: { xs: 2, sm: 4 },
                px: { xs: 1, sm: 2 },
                paddingBottom: { xs: '120px', sm: '2rem' },
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Header Section */}
                <ProfileHeaderCard elevation={0}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'flex-start' },
                        gap: 3,
                        mb: 2
                    }}>
                        <Avatar
                            src={userData.gender === 'female' ? femaleAvatar : maleAvatar}
                            sx={{
                                width: { xs: 80, sm: 100 },
                                height: { xs: 80, sm: 100 },
                                border: '3px solid #dded00',
                                boxShadow: '0 8px 25px rgba(221, 237, 0, 0.3)',
                            }}
                        />


                        <Box sx={{
                            flex: 1,
                            textAlign: { xs: 'center', sm: 'left' },
                            minWidth: 0
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1 }}>
                                <Typography
                                    variant={isMobile ? "h4" : "h3"}
                                    sx={{
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #dded00 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Profile Settings
                                </Typography>
                                <MdVerified style={{ color: '#dded00', fontSize: '24px' }} />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                                <Chip
                                    icon={<MdEmail />}
                                    label={currentUser?.email}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                        color: '#dded00',
                                        border: '1px solid rgba(221, 237, 0, 0.3)',
                                        '& .MuiChip-icon': { color: '#dded00' }
                                    }}
                                />
                                <Chip
                                    label="Premium User"
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                        color: '#ffd700',
                                        border: '1px solid rgba(255, 215, 0, 0.3)',
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Action buttons */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'row' },
                            gap: 2,
                            flexShrink: 0,
                        }}>
                            <GradientButton
                                variant="secondary"
                                startIcon={<MdArrowBack />}
                                onClick={() => navigate('/')}
                                size={isMobile ? "small" : "medium"}
                            >
                                {isMobile ? 'Back' : 'Back to Home'}
                            </GradientButton>
                            <Button
                                onClick={logout}
                                startIcon={<MdLogout />}
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: '600',
                                    color: '#ff4444',
                                    border: '2px solid rgba(255, 68, 68, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                        borderColor: '#ff4444',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                Logout
                            </Button>
                        </Box>
                    </Box>
                </ProfileHeaderCard>

                {/* Alerts */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444',
                            border: '1px solid rgba(211, 47, 47, 0.3)',
                            borderRadius: '12px',
                        }}
                    >
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            color: '#dded00',
                            border: '1px solid rgba(221, 237, 0, 0.3)',
                            borderRadius: '12px',
                        }}
                    >
                        {success}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Data Management Section */}
                    <Grid item xs={12}>
                        <SectionCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: '#dded00',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontWeight: '600'
                                }}>
                                    <MdSettings /> Data Management
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={6}>
                                        <GradientButton
                                            variant="secondary"
                                            fullWidth
                                            startIcon={<MdCleaningServices />}
                                            onClick={() => navigate('/exercise-manager')}
                                            sx={{ minHeight: '52px' }}
                                        >
                                            Exercise Data Manager
                                        </GradientButton>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            lineHeight: 1.6,
                                            textAlign: { xs: 'center', md: 'left' }
                                        }}>
                                            Find and merge duplicate exercises, fix spelling mistakes, and clean up your exercise data.
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </SectionCard>
                    </Grid>

                    {/* Personal Information Section */}
                    <Grid item xs={12}>
                        <SectionCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: '#dded00',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontWeight: '600'
                                }}>
                                    <MdPerson /> Personal Information
                                </Typography>

                                <form onSubmit={handleUpdateProfile}>
                                    <Grid container spacing={3}>
                                        {/* Avatar Selection */}
                                        <Grid item xs={12}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: { xs: 2, sm: 3 },
                                                p: 3,
                                                background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.05) 0%, rgba(227, 239, 63, 0.02) 100%)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(221, 237, 0, 0.2)',
                                                mb: 2
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                                                    <MdPerson style={{ color: '#dded00', fontSize: '24px' }} />
                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: '600' }}>
                                                        Avatar Selection
                                                    </Typography>
                                                </Box>

                                                <FormControl component="fieldset">
                                                    <RadioGroup
                                                        row
                                                        value={userData.gender}
                                                        onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                                                        sx={{
                                                            gap: 3,
                                                            '& .MuiFormControlLabel-root': {
                                                                margin: 0,
                                                            },
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value="male"
                                                            control={
                                                                <Radio
                                                                    sx={{
                                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                                        '&.Mui-checked': {
                                                                            color: '#dded00',
                                                                        },
                                                                    }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography sx={{
                                                                    color: userData.gender === 'male' ? '#dded00' : 'rgba(255, 255, 255, 0.8)',
                                                                    fontWeight: userData.gender === 'male' ? '600' : '400',
                                                                    ml: 1
                                                                }}>
                                                                    Male
                                                                </Typography>
                                                            }
                                                        />
                                                        <FormControlLabel
                                                            value="female"
                                                            control={
                                                                <Radio
                                                                    sx={{
                                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                                        '&.Mui-checked': {
                                                                            color: '#dded00',
                                                                        },
                                                                    }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography sx={{
                                                                    color: userData.gender === 'female' ? '#dded00' : 'rgba(255, 255, 255, 0.8)',
                                                                    fontWeight: userData.gender === 'female' ? '600' : '400',
                                                                    ml: 1
                                                                }}>
                                                                    Female
                                                                </Typography>
                                                            }
                                                        />
                                                    </RadioGroup>
                                                </FormControl>

                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontStyle: 'italic',
                                                    mt: { xs: 0, sm: 0 }
                                                }}>
                                                    Choose your avatar representation
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        {/* Weight Unit Preference */}
                                        <Grid item xs={12}>
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: { xs: 2, sm: 3 },
                                                p: 3,
                                                background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.05) 0%, rgba(227, 239, 63, 0.02) 100%)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(221, 237, 0, 0.2)'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                                                    <MdFitnessCenter style={{ color: '#dded00', fontSize: '24px' }} />
                                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: '600' }}>
                                                        Weight Unit Preference
                                                    </Typography>
                                                </Box>

                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    flexShrink: 0
                                                }}>
                                                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}>
                                                        kg
                                                    </Typography>
                                                    <Switch
                                                        checked={weightUnit === 'lb'}
                                                        onChange={(e) => handleWeightUnitChange(e.target.checked ? 'lb' : 'kg')}
                                                        sx={{
                                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                                color: '#dded00',
                                                            },
                                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                backgroundColor: '#dded00',
                                                            },
                                                            '& .MuiSwitch-track': {
                                                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                            },
                                                        }}
                                                    />
                                                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}>
                                                        lb
                                                    </Typography>
                                                </Box>

                                                <Typography variant="body2" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontStyle: 'italic',
                                                    mt: { xs: 0, sm: 0 }
                                                }}>
                                                    Weight will be converted automatically
                                                </Typography>
                                            </Box>
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
                                                label={`Weight (${weightUnit})`}
                                                name="weight"
                                                value={userData.weight}
                                                onChange={handleChange}
                                                helperText={weightUnit === 'kg' ? 'Enter weight in kilograms' : 'Enter weight in pounds'}
                                                FormHelperTextProps={{
                                                    sx: { color: 'rgba(255, 255, 255, 0.6)' }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </SectionCard>
                    </Grid>

                    {/* Account Settings Section */}
                    <Grid item xs={12} md={6}>
                        <SectionCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: '#dded00',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontWeight: '600'
                                }}>
                                    <MdEmail /> Email Settings
                                </Typography>
                                <StyledTextField
                                    fullWidth
                                    type="email"
                                    label="Email Address"
                                    name="email"
                                    value={userData.email}
                                    onChange={handleChange}
                                />
                            </CardContent>
                        </SectionCard>
                    </Grid>

                    {/* Security Section */}
                    <Grid item xs={12} md={6}>
                        <SectionCard>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{
                                    color: '#dded00',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontWeight: '600'
                                }}>
                                    <MdLock /> Security Settings
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            type="password"
                                            label="New Password"
                                            name="newPassword"
                                            value={userData.newPassword}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField
                                            fullWidth
                                            type="password"
                                            label="Confirm New Password"
                                            name="confirmPassword"
                                            value={userData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </SectionCard>
                    </Grid>

                    {/* Save Button */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <GradientButton
                                variant="primary"
                                type="submit"
                                disabled={loading}
                                onClick={handleUpdateProfile}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MdSave />}
                                sx={{
                                    minWidth: { xs: '100%', sm: '300px' },
                                    minHeight: '56px',
                                    fontSize: '18px',
                                }}
                            >
                                {loading ? 'Saving Changes...' : 'Save All Changes'}
                            </GradientButton>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}