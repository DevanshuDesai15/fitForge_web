import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdCalendarMonth,
    MdHistory,
    MdFitnessCenter,
    MdTimer,
    MdToday
} from 'react-icons/md';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const StyledCard = styled(Card)(({ theme }) => ({
    background: 'rgba(30, 30, 30, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 255, 159, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
}));

export default function History() {
    const [activeTab, setActiveTab] = useState(0);
    const [workouts, setWorkouts] = useState([]);
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 1) { // Past Workouts
                const workoutsQuery = query(
                    collection(db, 'workouts'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const workoutDocs = await getDocs(workoutsQuery);
                setWorkouts(workoutDocs.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } else if (activeTab === 2) { // Exercise History
                const exercisesQuery = query(
                    collection(db, 'exercises'),
                    where('userId', '==', currentUser.uid),
                    orderBy('timestamp', 'desc')
                );
                const exerciseDocs = await getDocs(exercisesQuery);
                setExerciseHistory(exerciseDocs.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            }
        } catch (err) {
            console.error('Error details:', err);
            if (err.code === 'failed-precondition') {
                setError('Please wait while we set up the database indexes...');
            } else if (err.code === 'permission-denied') {
                setError('Permission denied. Please try logging out and back in.');
            } else {
                setError('Error loading history: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const renderPastWorkouts = () => (
        <List>
            {workouts.map((workout) => (
                <StyledCard key={workout.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#00ff9f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MdToday /> {format(new Date(workout.timestamp), 'MMM dd, yyyy')}
                            </Typography>
                            <Chip
                                icon={<MdTimer />}
                                label={formatTime(workout.duration)}
                                sx={{
                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                    color: '#00ff9f',
                                    '& .MuiChip-icon': { color: '#00ff9f' }
                                }}
                            />
                        </Box>
                        <Divider sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                        {workout.exercises.map((exercise, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                                <Typography sx={{ color: '#fff' }}>
                                    {exercise.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {`${exercise.weight}kg × ${exercise.reps} reps × ${exercise.sets} sets`}
                                </Typography>
                                {exercise.notes && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        Note: {exercise.notes}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </CardContent>
                </StyledCard>
            ))}
        </List>
    );

    const renderExerciseHistory = () => (
        <List>
            {exerciseHistory.map((exercise) => (
                <StyledCard key={exercise.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                {exercise.exerciseName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {format(new Date(exercise.timestamp), 'MMM dd, yyyy')}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            {`${exercise.weight}kg × ${exercise.reps} reps × ${exercise.sets} sets`}
                        </Typography>
                        {exercise.notes && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
                                Note: {exercise.notes}
                            </Typography>
                        )}
                    </CardContent>
                </StyledCard>
            ))}
        </List>
    );

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Typography
                    variant="h4"
                    sx={{
                        color: '#00ff9f',
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    Workout History
                </Typography>

                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#00ff9f !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#00ff9f' },
                        }}
                    >
                        <Tab icon={<MdCalendarMonth />} label="Calendar" />
                        <Tab icon={<MdHistory />} label="Past Workouts" />
                        <Tab icon={<MdFitnessCenter />} label="Exercise History" />
                    </Tabs>
                </StyledCard>

                <StyledCard>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress sx={{ color: '#00ff9f' }} />
                            </Box>
                        ) : error ? (
                            <Typography variant="body1" sx={{ color: '#ff4444' }}>
                                {error}
                            </Typography>
                        ) : (
                            <>
                                {activeTab === 0 && (
                                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                        Calendar View Coming Soon
                                    </Typography>
                                )}
                                {activeTab === 1 && renderPastWorkouts()}
                                {activeTab === 2 && renderExerciseHistory()}
                            </>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
}