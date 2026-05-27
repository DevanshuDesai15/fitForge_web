import { Box, Typography, Card, CardContent, Button, Chip, IconButton, TextField } from '@mui/material';
import { Info, Minus, Plus, CheckCircle, X } from 'lucide-react';
import PropTypes from 'prop-types';

const KM_TO_MI = 0.621371;

export function toDisplayDistance(km, weightUnit) {
    if (km === null || km === undefined) return '';
    return weightUnit === 'lbs' ? parseFloat((km * KM_TO_MI).toFixed(2)) : km;
}

export function toStoredKm(displayValue, weightUnit) {
    if (displayValue === '' || displayValue === null || displayValue === undefined) return null;
    const num = parseFloat(displayValue);
    if (isNaN(num)) return null;
    return weightUnit === 'lbs' ? num / KM_TO_MI : num;
}

const inputFieldSx = {
    flex: 1,
    '& input': { textAlign: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', padding: '12px' },
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(221, 237, 0, 0.5)' },
        '&.Mui-focused fieldset': { borderColor: '#dded00' },
    },
};

const stepperButtonSx = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
};

const ModernWorkoutExercise = ({
    exercise,
    exerciseIndex,
    currentSetIndex,
    onSetChange,
    onCompleteSet,
    onRemoveSet,
    onAddExtraSet,
    onCardioChange,
    onCompleteCardio,
    weightUnit = 'kg',
    aiTip,
    totalExercises,
    onPreviousExercise,
    onNextExercise,
}) => {
    const isCardio = exercise.exercise_type === 'cardio';
    const distanceUnit = weightUnit === 'lbs' ? 'mi' : 'km';
    const distanceStep = weightUnit === 'lbs' ? 0.25 : 0.5;

    // Strength-specific derived values (unused for cardio)
    const completedSets = exercise.sets?.filter(set => set.completed) || [];
    const currentSet = exercise.sets?.[currentSetIndex];
    const targetSets = exercise.targetSets || 3;
    const targetReps = exercise.targetReps || '8-10';
    const isTargetCompleted = completedSets.length >= targetSets;
    const hasIncompleteSet = currentSet !== undefined;

    return (
        <Card sx={{
            background: 'rgba(40, 40, 40, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            mb: 3
        }}>
            <CardContent sx={{ p: 3 }}>
                {/* Exercise Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" sx={{ color: '#dded00', fontWeight: 'bold', mb: 1 }}>
                            {exercise.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {isCardio ? (
                                <Chip
                                    label="Cardio"
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(221, 237, 0, 0.15)', color: '#dded00', fontSize: '0.75rem' }}
                                />
                            ) : (
                                <>
                                    <Chip
                                        label={exercise.difficulty || 'Intermediate'}
                                        size="small"
                                        sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem' }}
                                    />
                                    <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                        {exercise.muscleGroups || exercise.muscles || 'Chest, Triceps, Shoulders'}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <Info size={18} />
                    </IconButton>
                </Box>

                {/* Stats Bar */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-around', mb: 3, p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px'
                }}>
                    {isCardio ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Log duration and distance below
                        </Typography>
                    ) : (
                        <>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Target Sets</Typography>
                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>{targetSets}</Typography>
                            </Box>
                            <Box sx={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Target Reps</Typography>
                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>{targetReps}</Typography>
                            </Box>
                        </>
                    )}
                </Box>

                {/* ─── CARDIO SECTION ─── */}
                {isCardio && (
                    <Box sx={{ mb: 3 }}>
                        {exercise.cardio?.completed ? (
                            <Card sx={{
                                background: 'rgba(76, 175, 80, 0.1)',
                                border: '2px dashed rgba(76, 175, 80, 0.3)',
                                borderRadius: '12px',
                                p: 3,
                                textAlign: 'center',
                            }}>
                                <CheckCircle size={40} style={{ color: '#4caf50', marginBottom: '12px' }} />
                                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                                    Activity Logged!
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {exercise.cardio.duration_minutes} min
                                    {exercise.cardio.distance_km
                                        ? ` · ${toDisplayDistance(exercise.cardio.distance_km, weightUnit)} ${distanceUnit}`
                                        : ''}
                                </Typography>
                            </Card>
                        ) : (
                            <>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    Log Activity
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    {/* Duration */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                            Duration (min)
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                onClick={() => onCardioChange(exerciseIndex, 'duration_minutes', Math.max(0, (exercise.cardio.duration_minutes || 0) - 1))}
                                                sx={stepperButtonSx}
                                            >
                                                <Minus size={18} />
                                            </IconButton>
                                            <TextField
                                                type="number"
                                                value={exercise.cardio.duration_minutes ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                                    onCardioChange(exerciseIndex, 'duration_minutes', v);
                                                }}
                                                sx={inputFieldSx}
                                            />
                                            <IconButton
                                                onClick={() => onCardioChange(exerciseIndex, 'duration_minutes', (exercise.cardio.duration_minutes || 0) + 1)}
                                                sx={stepperButtonSx}
                                            >
                                                <Plus size={18} />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Distance */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                            Distance ({distanceUnit})
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                onClick={() => {
                                                    const cur = toDisplayDistance(exercise.cardio.distance_km, weightUnit) || 0;
                                                    onCardioChange(exerciseIndex, 'distance_km', toStoredKm(Math.max(0, cur - distanceStep), weightUnit));
                                                }}
                                                sx={stepperButtonSx}
                                            >
                                                <Minus size={18} />
                                            </IconButton>
                                            <TextField
                                                type="number"
                                                value={exercise.cardio.distance_km !== null ? toDisplayDistance(exercise.cardio.distance_km, weightUnit) : ''}
                                                onChange={(e) => {
                                                    onCardioChange(exerciseIndex, 'distance_km', toStoredKm(e.target.value, weightUnit));
                                                }}
                                                sx={inputFieldSx}
                                            />
                                            <IconButton
                                                onClick={() => {
                                                    const cur = toDisplayDistance(exercise.cardio.distance_km, weightUnit) || 0;
                                                    onCardioChange(exerciseIndex, 'distance_km', toStoredKm(cur + distanceStep, weightUnit));
                                                }}
                                                sx={stepperButtonSx}
                                            >
                                                <Plus size={18} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<CheckCircle size={18} />}
                                    onClick={() => onCompleteCardio(exerciseIndex)}
                                    disabled={!exercise.cardio.duration_minutes}
                                    sx={{
                                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        '&:hover': { background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)' },
                                        '&:disabled': { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' },
                                    }}
                                >
                                    Log Activity
                                </Button>
                            </>
                        )}
                    </Box>
                )}

                {/* ─── STRENGTH SECTION ─── */}
                {!isCardio && (
                    <>
                        {/* Completed Sets */}
                        {completedSets.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    Completed Sets
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {completedSets.map((set, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                                border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <CheckCircle size={20} style={{ color: '#4caf50' }} />
                                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>Set {index + 1}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                                    {set.reps} reps × {set.weight || 'BW'} {set.weight ? weightUnit : ''}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onRemoveSet(exerciseIndex, exercise.sets.findIndex(s => s === set))}
                                                    sx={{ color: '#f44336', padding: '4px', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                                                >
                                                    <X size={16} />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Log Next Set or Add Extra Set */}
                        {!hasIncompleteSet && isTargetCompleted ? (
                            <Box sx={{ mb: 3 }}>
                                <Card sx={{
                                    background: 'rgba(76, 175, 80, 0.1)', border: '2px dashed rgba(76, 175, 80, 0.3)',
                                    borderRadius: '12px', p: 3, textAlign: 'center',
                                }}>
                                    <CheckCircle size={40} style={{ color: '#4caf50', marginBottom: '12px' }} />
                                    <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                                        Target Sets Completed!
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        Great job! You've completed all {targetSets} target sets.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Plus size={18} />}
                                        onClick={() => onAddExtraSet(exerciseIndex)}
                                        sx={{
                                            color: '#dded00', borderColor: '#dded00', borderWidth: '2px',
                                            textTransform: 'none', fontWeight: 'bold', fontSize: '1rem',
                                            padding: '12px 24px', borderRadius: '12px',
                                            '&:hover': { borderWidth: '2px', borderColor: '#dded00', backgroundColor: 'rgba(221, 237, 0, 0.1)' },
                                        }}
                                    >
                                        Add Extra Set
                                    </Button>
                                </Card>
                            </Box>
                        ) : currentSet && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    {isTargetCompleted ? `Log Extra Set (${completedSets.length + 1})` : `Log Set ${completedSets.length + 1}`}
                                </Typography>

                                {aiTip && (
                                    <Box sx={{
                                        p: 1.5, backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                        border: '1px solid rgba(221, 237, 0, 0.3)', borderRadius: '8px', mb: 2,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <Chip label="AI Tip" size="small" sx={{ backgroundColor: '#dded00', color: '#000', fontWeight: 'bold', fontSize: '0.7rem', height: '20px' }} />
                                        <Typography variant="body2" sx={{ color: '#dded00', fontSize: '0.875rem' }}>{aiTip}</Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    {/* Reps */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Reps</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton onClick={() => onSetChange(exerciseIndex, currentSetIndex, 'reps', String(Math.max(0, parseInt(currentSet.reps || 0) - 1)))} sx={stepperButtonSx}>
                                                <Minus size={18} />
                                            </IconButton>
                                            <TextField type="number" value={currentSet.reps || ''} onChange={(e) => onSetChange(exerciseIndex, currentSetIndex, 'reps', e.target.value)} sx={inputFieldSx} />
                                            <IconButton onClick={() => onSetChange(exerciseIndex, currentSetIndex, 'reps', String(parseInt(currentSet.reps || 0) + 1))} sx={stepperButtonSx}>
                                                <Plus size={18} />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Weight */}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Weight ({weightUnit})</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton onClick={() => onSetChange(exerciseIndex, currentSetIndex, 'weight', String(Math.max(0, parseFloat(currentSet.weight || 0) - 2.5)))} sx={stepperButtonSx}>
                                                <Minus size={18} />
                                            </IconButton>
                                            <TextField type="number" value={currentSet.weight || ''} onChange={(e) => onSetChange(exerciseIndex, currentSetIndex, 'weight', e.target.value)} sx={inputFieldSx} />
                                            <IconButton onClick={() => onSetChange(exerciseIndex, currentSetIndex, 'weight', String(parseFloat(currentSet.weight || 0) + 2.5))} sx={stepperButtonSx}>
                                                <Plus size={18} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<CheckCircle size={18} />}
                                    onClick={() => onCompleteSet(exerciseIndex, currentSetIndex)}
                                    disabled={!currentSet.reps}
                                    sx={{
                                        background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                        color: '#000', fontWeight: 'bold', fontSize: '1rem',
                                        padding: '14px', borderRadius: '12px', textTransform: 'none',
                                        '&:hover': { background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)' },
                                        '&:disabled': { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' },
                                    }}
                                >
                                    {isTargetCompleted ? 'Complete Extra Set' : 'Complete Set'}
                                </Button>
                            </Box>
                        )}
                    </>
                )}

                {/* Navigation */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    <Button variant="text" onClick={onPreviousExercise} disabled={exerciseIndex === 0} sx={{ color: 'text.secondary', textTransform: 'none', '&:disabled': { color: 'rgba(255, 255, 255, 0.2)' } }}>
                        Previous Exercise
                    </Button>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {exerciseIndex + 1} / {totalExercises}
                    </Typography>
                    <Button variant="text" onClick={onNextExercise} disabled={exerciseIndex === totalExercises - 1} sx={{ color: 'text.secondary', textTransform: 'none', '&:disabled': { color: 'rgba(255, 255, 255, 0.2)' } }}>
                        Next Exercise
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

ModernWorkoutExercise.propTypes = {
    exercise: PropTypes.object.isRequired,
    exerciseIndex: PropTypes.number.isRequired,
    currentSetIndex: PropTypes.number.isRequired,
    onSetChange: PropTypes.func.isRequired,
    onCompleteSet: PropTypes.func.isRequired,
    onRemoveSet: PropTypes.func.isRequired,
    onAddExtraSet: PropTypes.func.isRequired,
    onCardioChange: PropTypes.func,
    onCompleteCardio: PropTypes.func,
    weightUnit: PropTypes.string,
    aiTip: PropTypes.string,
    totalExercises: PropTypes.number.isRequired,
    onPreviousExercise: PropTypes.func.isRequired,
    onNextExercise: PropTypes.func.isRequired,
};

export default ModernWorkoutExercise;
