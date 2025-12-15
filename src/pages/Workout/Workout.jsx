import { Box } from '@mui/material';
import WorkoutDashboard from './components/WorkoutDashboard';

const Workout = () => {
    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-6xl mx-auto">
                <WorkoutDashboard />
            </div>
        </Box>
    );
};

export default Workout;
