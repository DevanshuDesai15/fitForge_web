import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Typography,
    Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdFitnessCenter, MdHistory, MdAccountCircle, MdLogout } from "react-icons/md";

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

export default function Home() {
    const [exercises, setExercises] = useState([]);
    const [formData, setFormData] = useState({
        exerciseName: "",
        weight: "",
        reps: "",
        sets: "",
        repLimit: "",
    });
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            loadExercises();
        }
    }, [currentUser]);

    const loadExercises = async () => {
        setLoading(true);
        setError('');
        try {
            const exercisesRef = collection(db, 'exercises');
            const q = query(
                exercisesRef,
                where("userId", "==", currentUser.uid),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const exerciseData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExercises(exerciseData);
        } catch (error) {
            console.error("Error loading exercises:", error);
            setError('Failed to load exercises. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const exercisesRef = collection(db, 'exercises');
            await addDoc(exercisesRef, {
                ...formData,
                userId: currentUser.uid,
                timestamp: new Date().toISOString(),
            });

            setFormData({
                exerciseName: "",
                weight: "",
                reps: "",
                sets: "",
                repLimit: "",
            });
            await loadExercises();
        } catch (error) {
            console.error("Error saving exercise:", error);
            setError('Failed to save exercise. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-7xl mx-auto">
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 4,
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            color: '#ff4444'
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                <StyledCard className="mb-8">
                    <CardHeader
                        title={
                            <Typography variant="h4" sx={{
                                color: '#00ff9f',
                                fontWeight: 'bold',
                            }}>
                                FitForge
                            </Typography>
                        }
                        subheader={
                            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                                Track your progress, achieve your goals
                            </Typography>
                        }
                        action={
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* <Button
                                    startIcon={<MdAccountCircle />}
                                    onClick={() => navigate('/profile')}
                                    variant="outlined"
                                    sx={{
                                        borderColor: '#00ff9f',
                                        color: '#00ff9f',
                                        '&:hover': {
                                            borderColor: '#00e676',
                                            backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                        },
                                    }}
                                >
                                    Profile
                                </Button> */}
                                <Button
                                    startIcon={<MdLogout />}
                                    onClick={handleLogout}
                                    variant="outlined"
                                    color="error"
                                >
                                    Logout
                                </Button>
                            </Box>
                        }
                    />
                </StyledCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StyledCard>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdFitnessCenter size={24} color="#00ff9f" />
                                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                        Add Exercise
                                    </Typography>
                                </Box>
                            }
                        />
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <StyledTextField
                                    fullWidth
                                    label="Exercise Name"
                                    value={formData.exerciseName}
                                    onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <StyledTextField
                                    fullWidth
                                    type="number"
                                    label="Weight (kg)"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <StyledTextField
                                    fullWidth
                                    type="number"
                                    label="Reps per Set"
                                    value={formData.reps}
                                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <StyledTextField
                                    fullWidth
                                    type="number"
                                    label="Number of Sets"
                                    value={formData.sets}
                                    onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <StyledTextField
                                    fullWidth
                                    type="number"
                                    label="Rep Limit"
                                    value={formData.repLimit}
                                    onChange={(e) => setFormData({ ...formData, repLimit: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <Button
                                    variant="contained"
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
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
                                    {loading ? <CircularProgress size={24} /> : 'Add Exercise'}
                                </Button>
                            </form>
                        </CardContent>
                    </StyledCard>

                    <StyledCard>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MdHistory size={24} color="#00ff9f" />
                                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                        Exercise History
                                    </Typography>
                                </Box>
                            }
                        />
                        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress sx={{ color: '#00ff9f' }} />
                                </Box>
                            )}
                            {!loading && exercises.length === 0 && (
                                <Typography
                                    align="center"
                                    sx={{ color: 'text.secondary', py: 4 }}
                                >
                                    No exercises added yet
                                </Typography>
                            )}
                            {exercises.map((exercise) => (
                                <StyledCard key={exercise.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ color: '#00ff9f', mb: 1 }}>
                                            {exercise.exerciseName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            Weight: {exercise.weight}kg | Reps: {exercise.reps} | Sets: {exercise.sets} | Limit: {exercise.repLimit}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                                            {new Date(exercise.timestamp).toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </StyledCard>
                            ))}
                        </CardContent>
                    </StyledCard>
                </div>
            </div>
        </Box>
    );
} 