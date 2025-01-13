import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

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

export default function ExerciseLibrary() {
    const [exercises, setExercises] = useState([]);
    const [open, setOpen] = useState(false);
    const [newExercise, setNewExercise] = useState({
        name: '',
        category: '',
        description: '',
        defaultWeight: '',
        defaultReps: '',
        defaultSets: ''
    });
    const { currentUser } = useAuth();

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            const q = query(
                collection(db, 'exerciseLibrary'),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const exerciseData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExercises(exerciseData);
        } catch (error) {
            console.error("Error loading exercises:", error);
        }
    };

    const handleAddExercise = async () => {
        try {
            await addDoc(collection(db, 'exerciseLibrary'), {
                ...newExercise,
                userId: currentUser.uid,
                createdAt: new Date().toISOString()
            });
            setOpen(false);
            setNewExercise({
                name: '',
                category: '',
                description: '',
                defaultWeight: '',
                defaultReps: '',
                defaultSets: ''
            });
            loadExercises();
        } catch (error) {
            console.error("Error adding exercise:", error);
        }
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
                        Exercise Library
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => setOpen(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                        }}
                    >
                        Add Exercise
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {exercises.map((exercise) => (
                        <Grid item xs={12} sm={6} key={exercise.id}>
                            <StyledCard>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                        {exercise.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        {exercise.description}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                                        Default: {exercise.defaultWeight}kg × {exercise.defaultReps} reps × {exercise.defaultSets} sets
                                    </Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>

                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                    PaperProps={{
                        style: {
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{ color: '#00ff9f' }}>Add New Exercise</DialogTitle>
                    <DialogContent>
                        <StyledTextField
                            autoFocus
                            margin="dense"
                            label="Exercise Name"
                            fullWidth
                            value={newExercise.name}
                            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        />
                        {/* Add more fields for exercise details */}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddExercise} sx={{ color: '#00ff9f' }}>
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}