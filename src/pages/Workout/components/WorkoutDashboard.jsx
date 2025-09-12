import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdAdd, MdShowChart, MdLibraryBooks } from 'react-icons/md';
import WorkoutsTab from './WorkoutsTab';
import ExerciseLibraryTab from './ExerciseLibraryTab';
import CreateWorkoutModal from './CreateWorkoutModal';

const TabButton = styled(Button)(({ active, theme }) => ({
    background: active
        ? 'rgba(40, 40, 40, 0.9)'
        : 'transparent',
    color: active ? '#fff' : 'rgba(255, 255, 255, 0.6)',
    borderRadius: '50px',
    padding: '10px 20px',
    textTransform: 'none',
    fontSize: '0.9rem',
    fontWeight: active ? 'bold' : 'medium',
    border: active ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
    backdropFilter: active ? 'blur(10px)' : 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 'auto',
    [theme.breakpoints.down('sm')]: {
        padding: '8px 16px',
        fontSize: '0.8rem',
        gap: '4px',
        '& .MuiButton-startIcon': {
            marginRight: '4px',
            '& svg': {
                fontSize: '16px',
            },
        },
    },
    [theme.breakpoints.down('xs')]: {
        padding: '6px 12px',
        fontSize: '0.75rem',
        gap: '2px',
        '& .MuiButton-startIcon': {
            marginRight: '2px',
            '& svg': {
                fontSize: '14px',
            },
        },
    },
    '&:hover': {
        background: active
            ? 'rgba(40, 40, 40, 0.9)'
            : 'rgba(255, 255, 255, 0.05)',
        color: active ? '#fff' : 'rgba(255, 255, 255, 0.8)',
    },
}));

const WorkoutDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const handleTabChange = (tabIndex) => {
        setActiveTab(tabIndex);
    };

    const handleNewWorkout = () => {
        setCreateModalOpen(true);
    };

    const handleWorkoutCreated = () => {
        // Refresh the page to reload templates
        window.location.reload();
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                        Workouts & Exercises
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        Track routines and browse exercise library
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={handleNewWorkout}
                    sx={{
                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                        color: '#000',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        px: 3,
                        '&:hover': {
                            background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                        },
                    }}
                >
                    NEW WORKOUT
                </Button>
            </Box>

            {/* Navigation Tabs */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                px: { xs: 2, sm: 0 }
            }}>
                <Box sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 1 },
                    background: 'rgba(20, 20, 20, 0.5)',
                    borderRadius: '50px',
                    padding: { xs: '4px', sm: '6px' },
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    width: 'fit-content',
                    maxWidth: { xs: '100%', sm: 'none' }
                }}>
                    <TabButton
                        active={activeTab === 0}
                        onClick={() => handleTabChange(0)}
                        startIcon={<MdShowChart />}
                    >
                        Workouts
                    </TabButton>
                    <TabButton
                        active={activeTab === 1}
                        onClick={() => handleTabChange(1)}
                        startIcon={<MdLibraryBooks />}
                    >
                        Exercise Library
                    </TabButton>
                </Box>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && <WorkoutsTab />}
            {activeTab === 1 && <ExerciseLibraryTab />}

            {/* Create Workout Modal */}
            <CreateWorkoutModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onWorkoutCreated={handleWorkoutCreated}
            />
        </Box>
    );
};

export default WorkoutDashboard;
