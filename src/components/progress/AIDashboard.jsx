import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Chip } from '@mui/material';
import { MdPsychology, MdWarning, MdShowChart, MdTimeline, MdEmojiEvents } from 'react-icons/md';
import AIInsights from './components/AIInsights';
import PlateauAlerts from './components/PlateauAlerts';
import PerformanceCharts from './components/PerformanceCharts';
import StatisticsDashboard from './components/StatisticsDashboard';

const OverviewDashboard = ({
    progressionAnalyses,
    plateauAlerts,
    progressData,
    selectedExercise,
    setSelectedExercise,
    weightUnit
}) => {
    const exerciseNames = Object.keys(progressData);

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdShowChart />
                Overview
            </Typography>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#282828', borderRadius: '12px' }}>
                    <Typography variant="h4" sx={{ color: '#dded00' }}>{progressionAnalyses.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>AI Insights</Typography>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#282828', borderRadius: '12px' }}>
                    <Typography variant="h4" sx={{ color: '#ff9800' }}>{plateauAlerts.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Active Plateaus</Typography>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#282828', borderRadius: '12px' }}>
                    <Typography variant="h4" sx={{ color: '#4caf50' }}>67%</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Improving</Typography>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#282828', borderRadius: '12px' }}>
                    <Typography variant="h4" sx={{ color: '#2196f3' }}>91%</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Avg Confidence</Typography>
                </div>
            </div>

            {/* Exercise Selector */}
            {exerciseNames.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        style={{
                            minWidth: '200px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="">Select Exercise</option>
                        {exerciseNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </Box>
            )}

            {/* Latest AI Insights and Active Plateaus */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#282828', borderRadius: '12px', padding: '16px', height: '400px' }}>
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                        Latest AI Insights
                    </Typography>
                    {progressionAnalyses.slice(0, 3).map((insight, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
                            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                {insight.exerciseName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Strong improvement trend with +{insight.progressionRate?.toFixed(1) || 0}kg/week progress
                            </Typography>
                        </div>
                    ))}
                </div>

                <div style={{ backgroundColor: '#282828', borderRadius: '12px', padding: '16px', height: '400px' }}>
                    <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                        Active Plateau Alerts
                    </Typography>
                    {plateauAlerts.slice(0, 3).map((alert, index) => (
                        <div key={index} style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: '8px' }}>
                            <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                                {alert.exerciseName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {alert.severity} - deload recommended
                            </Typography>
                        </div>
                    ))}
                    {plateauAlerts.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={{ color: 'text.secondary' }}>
                                No active plateaus detected
                            </Typography>
                        </Box>
                    )}
                </div>
            </div>
        </Box>
    );
};

const AIDashboard = ({
    progressionAnalyses,
    plateauAlerts,
    appliedInterventions,
    dismissedAlerts,
    onInterventionApply,
    onAlertDismiss,
    progressData,
    selectedExercise,
    setSelectedExercise,
    timeRange,
    setTimeRange,
    exercises,
    personalRecords,
    weightUnit = 'kg'
}) => {
    const [activeSubTab, setActiveSubTab] = useState(0);

    return (
        <Box>
            {/* AI-Powered Progress Dashboard Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, rgba(221, 237, 0, 0.1), rgba(221, 237, 0, 0.05))',
                border: '1px solid rgba(221, 237, 0, 0.2)',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MdPsychology style={{ color: '#dded00', fontSize: '32px' }} />
                    <Box>
                        <Typography variant="h5" sx={{ color: '#dded00', fontWeight: 'bold' }}>
                            AI-Powered Progress Dashboard
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Intelligent analysis of your fitness journey with actionable insights
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        label="Real-time Analysis"
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            color: '#4caf50',
                            fontWeight: 'bold'
                        }}
                    />
                    <Chip
                        label="AI Enhanced"
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(221, 237, 0, 0.2)',
                            color: '#dded00',
                            fontWeight: 'bold'
                        }}
                    />
                </Box>
            </Box>

            {/* Sub-navigation for AI Dashboard */}
            <Box sx={{ mb: 3 }}>
                <Tabs
                    value={activeSubTab}
                    onChange={(event, newValue) => setActiveSubTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            minWidth: 'auto',
                            px: 2
                        },
                        '& .Mui-selected': { color: '#dded00 !important' },
                        '& .MuiTabs-indicator': { backgroundColor: '#dded00' },
                    }}
                >
                    <Tab icon={<MdPsychology />} label="AI Insights" />
                    <Tab icon={<MdWarning />} label="Plateaus" />
                    <Tab icon={<MdShowChart />} label="Charts" />
                    <Tab icon={<MdTimeline />} label="Statistics" />
                    <Tab icon={<MdEmojiEvents />} label="Overview" />
                </Tabs>
            </Box>

            {/* Render content based on sub-tab */}
            {activeSubTab === 0 && (
                <AIInsights
                    progressionAnalyses={progressionAnalyses}
                    weightUnit={weightUnit}
                />
            )}
            {activeSubTab === 1 && (
                <PlateauAlerts
                    plateauAlerts={plateauAlerts}
                    appliedInterventions={appliedInterventions}
                    dismissedAlerts={dismissedAlerts}
                    onInterventionApply={onInterventionApply}
                    onAlertDismiss={onAlertDismiss}
                />
            )}
            {activeSubTab === 2 && (
                <PerformanceCharts
                    progressData={progressData}
                    selectedExercise={selectedExercise}
                    setSelectedExercise={setSelectedExercise}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    weightUnit={weightUnit}
                />
            )}
            {activeSubTab === 3 && (
                <StatisticsDashboard
                    exercises={exercises}
                    personalRecords={personalRecords}
                    progressionAnalyses={progressionAnalyses}
                    weightUnit={weightUnit}
                />
            )}
            {activeSubTab === 4 && (
                <OverviewDashboard
                    progressionAnalyses={progressionAnalyses}
                    plateauAlerts={plateauAlerts}
                    progressData={progressData}
                    selectedExercise={selectedExercise}
                    setSelectedExercise={setSelectedExercise}
                    weightUnit={weightUnit}
                />
            )}
        </Box>
    );
};

export default AIDashboard;
