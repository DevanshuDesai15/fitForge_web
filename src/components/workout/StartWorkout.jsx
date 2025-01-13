import { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Fab,
    Chip,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    MdAdd, 
    MdDelete, 
    MdEdit, 
    MdSave,
    MdPlayArrow,
    MdStop,
    MdTimer
} from 'react-icons/md';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

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

export default function StartWorkout() {
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [workoutTime, setWorkoutTime] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [availableExercises, setAvailableExercises] = useState([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadExerciseLibrary();
        let interval;
        if (workoutStarted) {
            interval = setInterval(() => {
                setWorkoutTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [workoutStarted]);

    const loadExerciseLibrary = async () => {
        try {
            const q = query(
                collection(db, 'exerciseLibrary'),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            setAvailableExercises(querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error("Error loading exercise library:", error);
        }
    };

    const handleStartWorkout = () => {
        setWorkoutStarted(true);
        setWorkoutTime(0);
    };

    const handleFinishWorkout = async () => {
        try {
            await addDoc(collection(db, 'workouts'), {
                userId: currentUser.uid,
                exercises: exercises,
                duration: workoutTime,
                timestamp: new Date().toISOString()
            });
            setWorkoutStarted(false);
            setExercises([]);
            setWorkoutTime(0);
        } catch (error) {
            console.error("Error saving workout:", error);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #121212 0%, #2d2d2d 100%)',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ color: '#00ff9f', fontWeight: 'bold' }}>
                        {workoutStarted ? 'Active Workout' : 'Start Workout'}
                    </Typography>
                    {workoutStarted && (
                        <Chip
                            icon={<MdTimer />}
                            label={formatTime(workoutTime)}
                            sx={{
                                backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                color: '#00ff9f',
                                '& .MuiChip-icon': { color: '#00ff9f' }
                            }}
                        />
                    )}
                </Box>

                <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                        {!workoutStarted ? (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdPlayArrow />}
                                onClick={handleStartWorkout}
                                sx={{
                                    background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                                    color: '#000',
                                    fontWeight: 'bold',
                                }}
                            >
                                Start Workout
                            </Button>
                        ) : (
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<MdStop />}
                                onClick={handleFinishWorkout}
                                sx={{
                                    background: 'linear-gradient(45deg, #ff4444 30%, #ff1744 90%)',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                }}
                            >
                                Finish Workout
                            </Button>
                        )}
                    </CardContent>
                </StyledCard>

                {workoutStarted && (
                    <>
                        <List>
                            {exercises.map((exercise, index) => (
                                <StyledCard key={index} sx={{ mb: 2 }}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton edge="end" sx={{ color: '#ff4444' }}>
                                                <MdDelete />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ color: '#00ff9f' }}>
                                                    {exercise.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography sx={{ color: 'text.secondary' }}>
                                                    {`${exercise.weight}kg × ${exercise.reps} reps × ${exercise.sets} sets`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </StyledCard>
                            ))}
                        </List>

                        <Fab
                            color="primary"
                            sx={{
                                position: 'fixed',
                                bottom: 72,
                                right: 16,
                                background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            }}
                            onClick={() => setOpenDialog(true)}
                        >
                            <MdAdd />
                        </Fab>
                    </>
                )}

                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{
                        style: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>Add Exercise</DialogTitle>
                    <DialogContent>
                        {/* Exercise selection and details form */}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button onClick={() => {}} sx={{ color: '#00ff9f' }}>
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}