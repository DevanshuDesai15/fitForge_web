import { useState } from 'react';
import { Box, TextField, IconButton, Chip, Tooltip } from '@mui/material';
import { MdCheckCircle, MdCancel, MdAutoAwesome } from 'react-icons/md';
import { getWeightLabel } from '../../../utils/weightUnit';

const ExerciseSet = ({
    set,
    setIndex,
    exerciseIndex,
    onSetChange,
    onToggleCompletion,
    weightUnit = 'kg',
    aiSuggestion
}) => {
    const [localWeight, setLocalWeight] = useState(set.weight || '');
    const [localReps, setLocalReps] = useState(set.reps || '');

    const handleWeightChange = (value) => {
        setLocalWeight(value);
        onSetChange(exerciseIndex, setIndex, 'weight', value);
    };

    const handleRepsChange = (value) => {
        setLocalReps(value);
        onSetChange(exerciseIndex, setIndex, 'reps', value);
    };

    const applySuggestion = () => {
        if (aiSuggestion) {
            if (aiSuggestion.suggestedWeight) {
                handleWeightChange(aiSuggestion.suggestedWeight.toString());
            }
            if (aiSuggestion.suggestedReps) {
                handleRepsChange(aiSuggestion.suggestedReps.toString());
            }
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: '8px',
            backgroundColor: set.completed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: set.completed ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s'
        }}>
            {/* Set Number */}
            <Chip
                label={setIndex + 1}
                size="small"
                sx={{
                    backgroundColor: set.completed ? '#4caf50' : 'rgba(255, 255, 255, 0.1)',
                    color: set.completed ? '#fff' : 'text.secondary',
                    minWidth: '32px',
                    fontWeight: 'bold'
                }}
            />

            {/* Weight Input */}
            <TextField
                size="small"
                label={getWeightLabel(weightUnit)}
                value={localWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                type="number"
                inputProps={{ min: 0, step: 0.5 }}
                sx={{
                    width: '80px',
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(221, 237, 0, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#dded00',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.8rem',
                    },
                    '& .MuiOutlinedInput-input': {
                        color: '#fff',
                        fontSize: '0.9rem',
                    },
                }}
            />

            {/* Reps Input */}
            <TextField
                size="small"
                label="Reps"
                value={localReps}
                onChange={(e) => handleRepsChange(e.target.value)}
                type="number"
                inputProps={{ min: 1, max: 100 }}
                sx={{
                    width: '70px',
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(221, 237, 0, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#dded00',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.8rem',
                    },
                    '& .MuiOutlinedInput-input': {
                        color: '#fff',
                        fontSize: '0.9rem',
                    },
                }}
            />

            {/* AI Suggestion Button */}
            {aiSuggestion && (aiSuggestion.suggestedWeight || aiSuggestion.suggestedReps) && (
                <Tooltip title={`AI suggests: ${aiSuggestion.suggestedWeight || localWeight}${weightUnit} × ${aiSuggestion.suggestedReps || localReps} reps`}>
                    <IconButton
                        size="small"
                        onClick={applySuggestion}
                        sx={{
                            color: '#dded00',
                            backgroundColor: 'rgba(221, 237, 0, 0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(221, 237, 0, 0.2)',
                            },
                        }}
                    >
                        <MdAutoAwesome />
                    </IconButton>
                </Tooltip>
            )}

            {/* Complete/Incomplete Toggle */}
            <IconButton
                size="small"
                onClick={() => onToggleCompletion(exerciseIndex, setIndex)}
                sx={{
                    color: set.completed ? '#4caf50' : 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                        color: set.completed ? '#66bb6a' : '#4caf50',
                        backgroundColor: set.completed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                    },
                }}
            >
                {set.completed ? <MdCheckCircle /> : <MdCancel />}
            </IconButton>
        </Box>
    );
};

export default ExerciseSet;
