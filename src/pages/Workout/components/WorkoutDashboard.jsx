import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { Plus, LineChart as MdShowChart, BookOpen as MdLibraryBooks } from 'lucide-react';
import WorkoutsTab from './WorkoutsTab';
import ExerciseLibraryTab from './ExerciseLibraryTab';
import CreateWorkoutModal from './CreateWorkoutModal';
import CreateProgramModal from './CreateProgramModal';
import MobileWorkoutDashboard from './MobileWorkoutDashboard';
import MobilePrograms, { MobileProgramDetail } from './MobilePrograms';
import { getWorkoutTabFromSearchParams } from './workoutDashboardUtils';
import { useWorkoutPrograms } from '../hooks/useWorkoutPrograms';
import { buildWorkoutStartState } from './workoutRecommendationEngine';
import { useWorkoutMutations } from '../hooks/useWorkoutMutations';
import { MobileScreen } from '../../../components/mobile';

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
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { programs, loading: programsLoading, error: programsError, loadPrograms } = useWorkoutPrograms();
    const { deleteProgram } = useWorkoutMutations();
    const activeTab = getWorkoutTabFromSearchParams(searchParams);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [deleteProgramOpen, setDeleteProgramOpen] = useState(false);

    const requestedMobileTab = searchParams.get('tab');
    const activeMobileTab = ['workouts', 'programs', 'library'].includes(requestedMobileTab)
        ? requestedMobileTab
        : 'workouts';
    const selectedProgram = activeMobileTab === 'programs'
        ? programs.find((program) => String(program.id) === searchParams.get('program'))
        : null;

    const handleMobileTabChange = (tab) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', tab);
        setSearchParams(nextParams, { replace: false });
    };

    const handleTabChange = (tabIndex) => {
        const nextParams = new URLSearchParams(searchParams);
        if (tabIndex === 1) nextParams.set('tab', 'library');
        else nextParams.delete('tab');
        setSearchParams(nextParams, { replace: true });
    };

    const handleNewWorkout = () => {
        setCreateModalOpen(true);
    };

    const handleWorkoutCreated = () => {
        // Refresh the page to reload templates
        window.location.reload();
    };

    const handleOpenProgram = (programId) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'programs');
        nextParams.set('program', programId);
        setSearchParams(nextParams, { replace: false });
    };

    const handleStartProgramDay = (program, day) => {
        navigate('/workout/start', { state: buildWorkoutStartState(program, day) });
    };

    const handleCloseProgram = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('program');
        setSearchParams(nextParams, { replace: false });
    };

    const handleEditProgram = () => {
        setEditingProgram(selectedProgram);
        setCreateProgramModalOpen(true);
    };

    const handleDeleteSelectedProgram = async () => {
        await deleteProgram(selectedProgram.id);
        setDeleteProgramOpen(false);
        handleCloseProgram();
        loadPrograms();
    };

    if (!isDesktop) {
        if (selectedProgram) {
            return (
                <>
                    <MobileScreen>
                        <MobileProgramDetail
                            program={selectedProgram}
                            onBack={handleCloseProgram}
                            onStart={handleStartProgramDay}
                            onEdit={handleEditProgram}
                            onOpenDay={handleEditProgram}
                            onAddDay={handleEditProgram}
                            onDelete={() => setDeleteProgramOpen(true)}
                        />
                    </MobileScreen>
                    <CreateProgramModal
                        open={createProgramModalOpen}
                        editData={editingProgram}
                        onClose={() => {
                            setCreateProgramModalOpen(false);
                            setEditingProgram(null);
                        }}
                        onProgramCreated={() => {
                            setCreateProgramModalOpen(false);
                            setEditingProgram(null);
                            loadPrograms();
                        }}
                    />
                    <Dialog open={deleteProgramOpen} onClose={() => setDeleteProgramOpen(false)}>
                        <DialogTitle>Delete {selectedProgram.name}?</DialogTitle>
                        <DialogContent>This permanently removes the program. Your completed workout history remains available.</DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteProgramOpen(false)}>Cancel</Button>
                            <Button color="error" onClick={handleDeleteSelectedProgram}>Delete program</Button>
                        </DialogActions>
                    </Dialog>
                </>
            );
        }

        return (
            <>
                <MobileWorkoutDashboard
                    activeTab={activeMobileTab}
                    onTabChange={handleMobileTabChange}
                    onNewWorkout={handleNewWorkout}
                    onNewProgram={() => setCreateProgramModalOpen(true)}
                    panels={{
                        workouts: <WorkoutsTab key="workouts" initialSubTab={0} hideSubTabs />,
                        programs: (
                            <MobilePrograms
                                programs={programs}
                                loading={programsLoading}
                                error={programsError}
                                onRetry={loadPrograms}
                                onOpen={handleOpenProgram}
                                onStart={handleStartProgramDay}
                                onNew={() => setCreateProgramModalOpen(true)}
                            />
                        ),
                        library: <ExerciseLibraryTab />,
                    }}
                />
                <CreateWorkoutModal
                    open={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onWorkoutCreated={handleWorkoutCreated}
                />
                <CreateProgramModal
                    open={createProgramModalOpen}
                    editData={editingProgram}
                    onClose={() => {
                        setCreateProgramModalOpen(false);
                        setEditingProgram(null);
                    }}
                    onProgramCreated={() => {
                        setCreateProgramModalOpen(false);
                        setEditingProgram(null);
                        loadPrograms();
                    }}
                />
            </>
        );
    }

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
                    startIcon={<Plus size={18} />}
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
