import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Fab,
    Grid,
    Chip,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    MdAdd,
    MdDelete,
    MdEdit,
    MdContentCopy,
    MdPlayArrow,
    MdFitnessCenter
} from 'react-icons/md';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

export default function WorkoutTemplates() {
    const [templates, setTemplates] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        exercises: []
    });
    const [availableExercises, setAvailableExercises] = useState([]);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadTemplates();
        loadExerciseLibrary();
    }, []);

    const loadTemplates = async () => {
        try {
            const q = query(
                collection(db, 'workoutTemplates'),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const templateData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(templateData);
        } catch (error) {
            console.error("Error loading templates:", error);
        }
    };

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

    const handleCreateTemplate = async () => {
        try {
            await addDoc(collection(db, 'workoutTemplates'), {
                ...newTemplate,
                userId: currentUser.uid,
                createdAt: new Date().toISOString()
            });
            setOpenDialog(false);
            setNewTemplate({
                name: '',
                description: '',
                exercises: []
            });
            loadTemplates();
        } catch (error) {
            console.error("Error creating template:", error);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        try {
            await deleteDoc(doc(db, 'workoutTemplates', templateId));
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const handleStartTemplate = (template) => {
        // Navigate to start workout with template data
        navigate('/workout/start', { state: { template } });
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
                        Workout Templates
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<MdAdd />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #00ff9f 30%, #00e676 90%)',
                            color: '#000',
                            fontWeight: 'bold',
                        }}
                    >
                        Create Template
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {templates.map((template) => (
                        <Grid item xs={12} md={6} key={template.id}>
                            <StyledCard>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#00ff9f' }}>
                                            {template.name}
                                        </Typography>
                                        <Box>
                                            <IconButton
                                                onClick={() => handleStartTemplate(template)}
                                                sx={{ color: '#00ff9f' }}
                                            >
                                                <MdPlayArrow />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                sx={{ color: '#ff4444' }}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        {template.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {template.exercises.map((exercise, index) => (
                                            <Chip
                                                key={index}
                                                label={exercise.name}
                                                icon={<MdFitnessCenter />}
                                                sx={{
                                                    backgroundColor: 'rgba(0, 255, 159, 0.1)',
                                                    color: '#00ff9f',
                                                    '& .MuiChip-icon': { color: '#00ff9f' }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    ))}
                </Grid>

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
                    <DialogTitle sx={{ color: '#00ff9f' }}>Create Workout Template</DialogTitle>
                    <DialogContent>
                        <StyledTextField
                            autoFocus
                            margin="dense"
                            label="Template Name"
                            fullWidth
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <StyledTextField
                            margin="dense"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newTemplate.description}
                            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        />
                        {/* Exercise selection component will go here */}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTemplate} sx={{ color: '#00ff9f' }}>
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
}