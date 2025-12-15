import { useState, useEffect } from 'react';
import { Box, Typography, Tab, Tabs, Alert, CircularProgress, CardContent } from '@mui/material';
import { MdPsychology, MdShowChart, MdTrackChanges, MdEmojiEvents } from 'react-icons/md';
import { useUnits } from '../../contexts/UnitsContext';
import { StyledCard } from './components/shared/StyledComponents';
import { useProgressData } from './hooks/useProgressData';
import { useAIInsights } from './hooks/useAIInsights';
import { usePlateauDetection } from './hooks/usePlateauDetection';
import AIDashboard from './AIDashboard';
import GoalsSection from './components/GoalsSection';
import AchievementsSection from './components/AchievementsSection';

const Progress = () => {
    // Main navigation state
    const [activeMainTab, setActiveMainTab] = useState(0);
    const { weightUnit } = useUnits();

    // Progress data states
    const [selectedExercise, setSelectedExercise] = useState('');
    const [timeRange, setTimeRange] = useState('3months');
    const [showOnlyRecent, setShowOnlyRecent] = useState(false);

    // Custom hooks for data management
    const {
        exercises,
        goals,
        loading,
        error,
        progressData,
        personalRecords,
        availableExercises,
        loadGoals,
        setError
    } = useProgressData(activeMainTab);

    const {
        aiInsights,
        progressionAnalyses,
        loadAIInsights
    } = useAIInsights();

    const {
        plateauAlerts,
        appliedInterventions,
        dismissedAlerts,
        loadPlateauAlerts,
        handleInterventionApply,
        handleAlertDismiss
    } = usePlateauDetection();

    // Weight unit is now automatically provided by UnitsContext

    // Load AI data when exercises are available
    useEffect(() => {
        if (availableExercises.length > 0 && (activeMainTab === 0 || activeMainTab === 1 || activeMainTab === 3)) {
            loadAIInsights(availableExercises);
            loadPlateauAlerts(availableExercises);
        }
    }, [availableExercises, activeMainTab, loadAIInsights, loadPlateauAlerts]);

    // Set default selected exercise
    useEffect(() => {
        if (!selectedExercise && Object.keys(progressData).length > 0) {
            setSelectedExercise(Object.keys(progressData)[0]);
        }
    }, [progressData, selectedExercise]);

    const renderOverview = () => {
        return (
            <Box>
                <Typography variant="h6" sx={{ color: '#dded00', mb: 2 }}>
                    Overview
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Comprehensive view of your fitness progress and achievements
                </Typography>

                {/* This could be expanded with overview-specific content */}
                <AchievementsSection
                    personalRecords={personalRecords}
                    progressionAnalyses={progressionAnalyses}
                    showOnlyRecent={showOnlyRecent}
                    setShowOnlyRecent={setShowOnlyRecent}
                    weightUnit={weightUnit}
                />
            </Box>
        );
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: '#121212',
            padding: '1rem',
        }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Typography
                    variant="h4"
                    sx={{
                        color: '#dded00',
                        fontWeight: 'bold',
                        mb: 1
                    }}
                >
                    Progress & Goals
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        mb: 3
                    }}
                >
                    Track your fitness journey, achievements, and goals
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff4444' }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {/* Main Navigation */}
                <StyledCard sx={{ mb: 3 }}>
                    <Tabs
                        value={activeMainTab}
                        onChange={(event, newValue) => setActiveMainTab(newValue)}
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .Mui-selected': { color: '#dded00 !important' },
                            '& .MuiTabs-indicator': { backgroundColor: '#dded00' },
                        }}
                    >
                        <Tab icon={<MdPsychology />} label="AI Dashboard" />
                        <Tab icon={<MdShowChart />} label="Overview" />
                        <Tab icon={<MdTrackChanges />} label="Goals" />
                        <Tab icon={<MdEmojiEvents />} label="Achievements" />
                    </Tabs>
                </StyledCard>

                {/* Main Content */}
                <StyledCard>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress sx={{ color: '#dded00' }} />
                            </Box>
                        ) : (
                            <>
                                {activeMainTab === 0 && (
                                    <AIDashboard
                                        progressionAnalyses={progressionAnalyses}
                                        plateauAlerts={plateauAlerts}
                                        appliedInterventions={appliedInterventions}
                                        dismissedAlerts={dismissedAlerts}
                                        onInterventionApply={handleInterventionApply}
                                        onAlertDismiss={handleAlertDismiss}
                                        progressData={progressData}
                                        selectedExercise={selectedExercise}
                                        setSelectedExercise={setSelectedExercise}
                                        timeRange={timeRange}
                                        setTimeRange={setTimeRange}
                                        exercises={exercises}
                                        personalRecords={personalRecords}
                                        weightUnit={weightUnit}
                                    />
                                )}
                                {activeMainTab === 1 && renderOverview()}
                                {activeMainTab === 2 && (
                                    <GoalsSection
                                        goals={goals}
                                        exercises={exercises}
                                        availableExercises={availableExercises}
                                        weightUnit={weightUnit}
                                        onGoalsUpdate={loadGoals}
                                        setError={setError}
                                    />
                                )}
                                {activeMainTab === 3 && (
                                    <AchievementsSection
                                        personalRecords={personalRecords}
                                        progressionAnalyses={progressionAnalyses}
                                        showOnlyRecent={showOnlyRecent}
                                        setShowOnlyRecent={setShowOnlyRecent}
                                        weightUnit={weightUnit}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </StyledCard>
            </div>
        </Box>
    );
};

export default Progress;
