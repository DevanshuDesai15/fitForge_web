import { Box, Typography, Grid2, Card, CardContent, Chip, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdPlayArrow, MdTimer } from 'react-icons/md';
import { Brain, Clock, TrendingUp, Activity, Target, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WorkoutCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(221, 237, 0, 0.3)',
    },
}));

const AIPick = styled(Chip)(() => ({
    background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '0.7rem',
    height: '20px',
    '& .MuiChip-icon': {
        color: '#000',
    },
}));

const QuickStartSection = () => {
    const navigate = useNavigate();

    const quickWorkouts = [
        {
            id: 1,
            title: "Push Day",
            description: "Chest, Shoulders, Triceps",
            duration: "45-60 min",
            difficulty: "Intermediate",
            exercises: ["Bench Press", "Shoulder Press", "Tricep Dips"],
            isAIPick: true,
            icon: <Dumbbell size={24} />,
            color: '#ff6b6b',
            progress: 85
        },
        {
            id: 2,
            title: "Pull Day",
            description: "Back, Biceps, Rear Delts",
            duration: "40-55 min",
            difficulty: "Intermediate",
            exercises: ["Pull-ups", "Rows", "Bicep Curls"],
            isAIPick: false,
            icon: <TrendingUp size={24} />,
            color: '#4ecdc4',
            progress: 92
        },
        {
            id: 3,
            title: "Leg Day",
            description: "Quads, Hamstrings, Glutes, Calves",
            duration: "50-65 min",
            difficulty: "Advanced",
            exercises: ["Squats", "Deadlifts", "Leg Press"],
            isAIPick: true,
            icon: <Activity size={24} />,
            color: '#45b7d1',
            progress: 78
        },
        {
            id: 4,
            title: "Full Body",
            description: "Complete workout targeting all muscle groups",
            duration: "60-75 min",
            difficulty: "Beginner",
            exercises: ["Squats", "Push-ups", "Rows", "Planks"],
            isAIPick: false,
            icon: <Target size={24} />,
            color: '#96ceb4',
            progress: 65
        },
        {
            id: 5,
            title: "HIIT Cardio",
            description: "High-intensity interval training",
            duration: "20-30 min",
            difficulty: "Intermediate",
            exercises: ["Burpees", "Mountain Climbers", "Jump Squats"],
            isAIPick: true,
            icon: <Clock size={24} />,
            color: '#feca57',
            progress: 88
        },
        {
            id: 6,
            title: "Core Focus",
            description: "Abs, Obliques, Lower Back",
            duration: "25-35 min",
            difficulty: "Beginner",
            exercises: ["Planks", "Russian Twists", "Dead Bugs"],
            isAIPick: false,
            icon: <Brain size={24} />,
            color: '#ff9ff3',
            progress: 72
        }
    ];

    const handleWorkoutClick = (workout) => {
        navigate('/workout/start', { state: { selectedWorkout: workout } });
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdPlayArrow />
                Quick Start Workouts
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Jump right into a pre-designed workout routine
            </Typography>

            <Grid2 container spacing={3}>
                {quickWorkouts.map((workout) => (
                    <Grid2 key={workout.id} xs={12} sm={6} md={4}>
                        <WorkoutCard onClick={() => handleWorkoutClick(workout)}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Header with AI Pick badge */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ color: workout.color, display: 'flex' }}>
                                            {workout.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.1rem' }}>
                                            {workout.title}
                                        </Typography>
                                    </Box>
                                    {workout.isAIPick && (
                                        <AIPick
                                            icon={<Brain size={12} />}
                                            label="AI Pick"
                                            size="small"
                                        />
                                    )}
                                </Box>

                                {/* Description */}
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}>
                                    {workout.description}
                                </Typography>

                                {/* Workout Details */}
                                <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <MdTimer size={14} />
                                            {workout.duration}
                                        </Typography>
                                        <Chip
                                            label={workout.difficulty}
                                            size="small"
                                            sx={{
                                                backgroundColor: workout.difficulty === 'Beginner' ? 'rgba(76, 175, 80, 0.2)' :
                                                    workout.difficulty === 'Intermediate' ? 'rgba(255, 193, 7, 0.2)' :
                                                        'rgba(244, 67, 54, 0.2)',
                                                color: workout.difficulty === 'Beginner' ? '#4caf50' :
                                                    workout.difficulty === 'Intermediate' ? '#ffc107' :
                                                        '#f44336',
                                                fontSize: '0.7rem',
                                                height: '20px'
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Exercise Preview */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                                        Key Exercises:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {workout.exercises.slice(0, 3).map((exercise, index) => (
                                            <Chip
                                                key={index}
                                                label={exercise}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    color: 'text.secondary',
                                                    fontSize: '0.65rem',
                                                    height: '18px'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                {/* Progress Bar */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Your Progress
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: workout.color }}>
                                            {workout.progress}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={workout.progress}
                                        sx={{
                                            height: 4,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: workout.color,
                                                borderRadius: 2,
                                            },
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </WorkoutCard>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
};

export default QuickStartSection;
