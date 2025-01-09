import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, TextField, Button, Avatar, Menu, MenuItem, Alert, CircularProgress } from '@mui/material';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RiAccountPinCircleLine, RiLogoutBoxRLine } from "react-icons/ri";

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
        <div className="min-h-screen p-4 md:p-8 bg-[#f5f5f5]">
            <div className="max-w-4xl mx-auto">
                {error && (
                    <Alert severity="error" className="mb-4" onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Card className="mb-8">
                    <CardHeader
                        title="FitForge"
                        subheader="Track your progress, achieve your goals"
                        action={
                            <div className="flex items-center gap-2">
                                <Button
                                    startIcon={<RiAccountPinCircleLine />}
                                    onClick={handleProfile}
                                    variant="outlined"
                                >
                                    Profile
                                </Button>
                                <Button
                                    startIcon={<RiLogoutBoxRLine />}
                                    onClick={handleLogout}
                                    variant="outlined"
                                    color="error"
                                >
                                    Logout
                                </Button>
                            </div>
                        }
                    />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader
                            title="Add Exercise"
                        />
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <TextField
                                    fullWidth
                                    label="Exercise Name"
                                    value={formData.exerciseName}
                                    onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Weight (kg)"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Reps per Set"
                                    value={formData.reps}
                                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Number of Sets"
                                    value={formData.sets}
                                    onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                                    required
                                    margin="normal"
                                />
                                <TextField
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
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Add Exercise'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader
                            title="Exercise History"
                        />
                        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                            {loading && <CircularProgress />}
                            {!loading && exercises.length === 0 && (
                                <p className="text-center text-gray-500">No exercises added yet</p>
                            )}
                            {exercises.map((exercise) => (
                                <Card key={exercise.id} className="hover:-translate-y-1 transition-transform">
                                    <CardContent className="pt-4">
                                        <h3 className="font-semibold">{exercise.exerciseName}</h3>
                                        <p className="text-sm text-gray-600">
                                            Weight: {exercise.weight}kg | Reps: {exercise.reps} | Sets: {exercise.sets} | Limit: {exercise.repLimit}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(exercise.timestamp).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 