import { useState } from 'react';
import {
    Box,
    Typography,
    CardContent,
    Chip,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Collapse,
    CircularProgress
} from '@mui/material';
import { MdWarning, MdPsychology, MdTimeline, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { format } from 'date-fns';
import { PlateauWarningCard } from './shared/StyledComponents';

const PlateauInterventionCard = ({ alert, onInterventionApply, onAlertDismiss, appliedInterventions, dismissedAlerts }) => {
    const [selectedIntervention, setSelectedIntervention] = useState('');
    const [showInterventions, setShowInterventions] = useState(false);
    const [applying, setApplying] = useState(false);

    const isApplied = appliedInterventions[alert.id];
    const isDismissed = dismissedAlerts.has(alert.id);

    if (isDismissed) return null;

    const interventionOptions = [
        {
            id: 'deload',
            title: 'Deload Week',
            description: 'Reduce weight by 10% for 1 week to allow recovery',
            type: 'weight_reduction',
            implementation: { weightReduction: 0.1, duration: 7 }
        },
        {
            id: 'rep_range',
            title: 'Change Rep Range',
            description: 'Switch to higher reps (12-15) with lighter weight',
            type: 'rep_modification',
            implementation: { repRange: '12-15', weightReduction: 0.15 }
        },
        {
            id: 'exercise_variation',
            title: 'Exercise Variation',
            description: 'Try a similar exercise with different angle or grip',
            type: 'exercise_substitution',
            implementation: { suggestAlternatives: true }
        },
        {
            id: 'rest_increase',
            title: 'Increase Rest Time',
            description: 'Add 30-60 seconds between sets for better recovery',
            type: 'rest_modification',
            implementation: { restIncrease: 45 }
        },
        {
            id: 'frequency_change',
            title: 'Training Frequency',
            description: 'Reduce frequency or add extra rest day',
            type: 'frequency_modification',
            implementation: { frequencyReduction: true }
        }
    ];

    const handleApplyIntervention = async () => {
        if (!selectedIntervention) return;

        setApplying(true);
        try {
            const intervention = interventionOptions.find(opt => opt.id === selectedIntervention);
            await onInterventionApply(alert.id, intervention);
            setShowInterventions(false);
        } catch (error) {
            console.error('Error applying intervention:', error);
        } finally {
            setApplying(false);
        }
    };

    return (
        <PlateauWarningCard severity={alert.severity}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                        {alert.exerciseName} Plateau
                    </Typography>
                    <Chip
                        label={`${alert.severity.charAt(0).toUpperCase()}${alert.severity.slice(1)} Priority`}
                        size="small"
                        sx={{
                            backgroundColor: alert.severity === 'severe' ? '#ff4444' :
                                alert.severity === 'moderate' ? '#ff9800' : '#ffc107',
                            color: '#000',
                            fontWeight: 'bold'
                        }}
                    />
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    <MdTimeline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    No progress for {alert.duration} sessions
                    <Typography component="span" sx={{ color: 'text.secondary', ml: 2 }}>
                        Last progress: {format(new Date(alert.lastProgressDate), 'MMM dd, yyyy')}
                    </Typography>
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {alert.message}
                </Typography>

                {isApplied ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            Intervention &quot;{isApplied.intervention.title}&quot; applied on {format(isApplied.appliedAt, 'MMM dd, yyyy')}
                        </Typography>
                    </Alert>
                ) : (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#dded00' }}>
                                Recommended Interventions:
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => setShowInterventions(!showInterventions)}
                                sx={{ color: '#dded00' }}
                                endIcon={showInterventions ? <MdExpandLess /> : <MdExpandMore />}
                            >
                                {showInterventions ? 'Hide' : 'Show'} Options
                            </Button>
                        </Box>

                        <Collapse in={showInterventions}>
                            <Box sx={{ mb: 2 }}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Select Intervention
                                    </InputLabel>
                                    <Select
                                        value={selectedIntervention}
                                        onChange={(e) => setSelectedIntervention(e.target.value)}
                                        sx={{
                                            color: '#fff',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                            },
                                        }}
                                    >
                                        {interventionOptions.map(option => (
                                            <MenuItem key={option.id} value={option.id}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {option.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {option.description}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {selectedIntervention && (
                                    <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(221, 237, 0, 0.1)', borderRadius: '8px' }}>
                                        {(() => {
                                            const intervention = interventionOptions.find(opt => opt.id === selectedIntervention);
                                            return (
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ color: '#dded00', mb: 1 }}>
                                                        Implementation Details:
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {intervention.description}
                                                    </Typography>
                                                </Box>
                                            );
                                        })()}
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleApplyIntervention}
                                        disabled={!selectedIntervention || applying}
                                        sx={{
                                            background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                            color: '#000',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                            },
                                        }}
                                    >
                                        {applying ? <CircularProgress size={20} /> : 'Apply Intervention'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowInterventions(false)}
                                        sx={{ color: 'text.secondary', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                        size="small"
                        onClick={() => onAlertDismiss(alert.id)}
                        sx={{ color: 'text.secondary' }}
                    >
                        Dismiss
                    </Button>
                </Box>
            </CardContent>
        </PlateauWarningCard>
    );
};

const PlateauAlerts = ({
    plateauAlerts,
    appliedInterventions,
    dismissedAlerts,
    onInterventionApply,
    onAlertDismiss
}) => {
    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#ff9800', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdWarning />
                Plateau Alert System
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {plateauAlerts.length} active plateaus detected
                </Typography>
            </Typography>

            {plateauAlerts.length > 0 ? (
                <Box>
                    <Typography variant="h6" sx={{ color: '#ff9800', mb: 2 }}>
                        Active Plateaus
                    </Typography>
                    {plateauAlerts.map((alert) => (
                        <PlateauInterventionCard
                            key={alert.id}
                            alert={alert}
                            onInterventionApply={onInterventionApply}
                            onAlertDismiss={onAlertDismiss}
                            appliedInterventions={appliedInterventions}
                            dismissedAlerts={dismissedAlerts}
                        />
                    ))}
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <MdPsychology style={{ fontSize: '48px', color: '#4caf50', marginBottom: '16px' }} />
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
                        No Active Plateaus!
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        Your training is progressing well. Keep up the great work!
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PlateauAlerts;
