import { Box, Typography, Card, CardContent, Button, Chip, IconButton, TextField } from '@mui/material';
import { MdInfo, MdRemove, MdAdd, MdCheckCircle, MdClose } from 'react-icons/md';
import PropTypes from 'prop-types';

const ModernWorkoutExercise = ({
    exercise,
    exerciseIndex,
    currentSetIndex,
    onSetChange,
    onCompleteSet,
    onRemoveSet,
    onAddExtraSet,
    weightUnit = 'kg',
    aiTip,
    totalExercises,
    onPreviousExercise,
    onNextExercise
}) => {
    const completedSets = exercise.sets?.filter(set => set.completed) || [];
    const currentSet = exercise.sets?.[currentSetIndex];
    const targetSets = exercise.targetSets || 3;
    const targetReps = exercise.targetReps || '8-10';

    const setsToShow = exercise.sets?.filter((_, index) => index < currentSetIndex) || [];
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
                            <Chip
                                label={exercise.difficulty || 'Intermediate'}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    fontSize: '0.75rem'
                                }}
                            />
                            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                {exercise.muscleGroups || exercise.muscles || 'Chest, Triceps, Shoulders'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <MdInfo />
                    </IconButton>
                </Box>

                {/* Target Stats */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    mb: 3,
                    p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '12px'
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            Target Sets
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            {targetSets}
                        </Typography>
                    </Box>
                    <Box sx={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            Target Reps
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            {targetReps}
                        </Typography>
                    </Box>
                </Box>

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
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1.5,
                                        backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                        border: '1px solid rgba(76, 175, 80, 0.3)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <MdCheckCircle style={{ color: '#4caf50', fontSize: '20px' }} />
                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                                            Set {index + 1}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                            {set.reps} reps × {set.weight || 'BW'} {set.weight ? weightUnit : ''}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveSet(exerciseIndex, exercise.sets.findIndex(s => s === set))}
                                            sx={{
                                                color: '#f44336',
                                                padding: '4px',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                }
                                            }}
                                        >
                                            <MdClose fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Log Next Set or Add Extra Set Button */}
                {!hasIncompleteSet && isTargetCompleted ? (
                    <Box sx={{ mb: 3 }}>
                        <Card sx={{
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '2px dashed rgba(76, 175, 80, 0.3)',
                            borderRadius: '12px',
                            p: 3,
                            textAlign: 'center'
                        }}>
                            <MdCheckCircle style={{ color: '#4caf50', fontSize: '40px', marginBottom: '12px' }} />
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                                Target Sets Completed!
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                Great job! You've completed all {targetSets} target sets.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<MdAdd />}
                                onClick={() => onAddExtraSet(exerciseIndex)}
                                sx={{
                                    color: '#dded00',
                                    borderColor: '#dded00',
                                    borderWidth: '2px',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    '&:hover': {
                                        borderWidth: '2px',
                                        borderColor: '#dded00',
                                        backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                    }
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

                        {/* AI Tip */}
                        {aiTip && (
                            <Box sx={{
                                p: 1.5,
                                backgroundColor: 'rgba(221, 237, 0, 0.1)',
                                border: '1px solid rgba(221, 237, 0, 0.3)',
                                borderRadius: '8px',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Chip
                                    label="AI Tip"
                                    size="small"
                                    sx={{
                                        backgroundColor: '#dded00',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        height: '20px'
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#dded00', fontSize: '0.875rem' }}>
                                    {aiTip}
                                </Typography>
                            </Box>
                        )}

                        {/* Reps and Weight Inputs */}
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            mb: 2,
                        }}>
                            {/* Reps */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                    Reps
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton
                                        onClick={() => {
                                            const newValue = Math.max(0, parseInt(currentSet.reps || 0) - 1);
                                            onSetChange(exerciseIndex, currentSetIndex, 'reps', newValue.toString());
                                        }}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <MdRemove />
                                    </IconButton>
                                    <TextField
                                        type="number"
                                        value={currentSet.reps || ''}
                                        onChange={(e) => onSetChange(exerciseIndex, currentSetIndex, 'reps', e.target.value)}
                                        sx={{
                                            flex: 1,
                                            '& input': {
                                                textAlign: 'center',
                                                color: '#fff',
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                                padding: '12px'
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.1)'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(221, 237, 0, 0.5)'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#dded00'
                                                }
                                            }
                                        }}
                                    />
                                    <IconButton
                                        onClick={() => {
                                            const newValue = parseInt(currentSet.reps || 0) + 1;
                                            onSetChange(exerciseIndex, currentSetIndex, 'reps', newValue.toString());
                                        }}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <MdAdd />
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Weight */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                    Weight ({weightUnit})
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton
                                        onClick={() => {
                                            const newValue = Math.max(0, parseFloat(currentSet.weight || 0) - 2.5);
                                            onSetChange(exerciseIndex, currentSetIndex, 'weight', newValue.toString());
                                        }}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <MdRemove />
                                    </IconButton>
                                    <TextField
                                        type="number"
                                        value={currentSet.weight || ''}
                                        onChange={(e) => onSetChange(exerciseIndex, currentSetIndex, 'weight', e.target.value)}
                                        sx={{
                                            flex: 1,
                                            '& input': {
                                                textAlign: 'center',
                                                color: '#fff',
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                                padding: '12px'
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.1)'
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(221, 237, 0, 0.5)'
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#dded00'
                                                }
                                            }
                                        }}
                                    />
                                    <IconButton
                                        onClick={() => {
                                            const newValue = parseFloat(currentSet.weight || 0) + 2.5;
                                            onSetChange(exerciseIndex, currentSetIndex, 'weight', newValue.toString());
                                        }}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <MdAdd />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>

                        {/* Complete Set Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<MdCheckCircle />}
                            onClick={() => onCompleteSet(exerciseIndex, currentSetIndex)}
                            disabled={!currentSet.reps}
                            sx={{
                                background: 'linear-gradient(45deg, #dded00 30%, #e8f15d 90%)',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                padding: '14px',
                                borderRadius: '12px',
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #e8f15d 30%, #dded00 90%)',
                                },
                                '&:disabled': {
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.3)'
                                }
                            }}
                        >
                            {isTargetCompleted ? 'Complete Extra Set' : 'Complete Set'}
                        </Button>
                    </Box>
                )}

                {/* Previous/Next Exercise Navigation */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Button
                        variant="text"
                        onClick={onPreviousExercise}
                        disabled={exerciseIndex === 0}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:disabled': {
                                color: 'rgba(255, 255, 255, 0.2)'
                            }
                        }}
                    >
                        Previous Exercise
                    </Button>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {exerciseIndex + 1} / {totalExercises}
                    </Typography>
                    <Button
                        variant="text"
                        onClick={onNextExercise}
                        disabled={exerciseIndex === totalExercises - 1}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:disabled': {
                                color: 'rgba(255, 255, 255, 0.2)'
                            }
                        }}
                    >
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
    weightUnit: PropTypes.string,
    aiTip: PropTypes.string,
    totalExercises: PropTypes.number.isRequired,
    onPreviousExercise: PropTypes.func.isRequired,
    onNextExercise: PropTypes.func.isRequired
};

export default ModernWorkoutExercise;

