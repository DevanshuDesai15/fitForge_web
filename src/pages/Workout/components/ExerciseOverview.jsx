import { Box, Typography, Card, IconButton } from '@mui/material';
import { MdCheckCircle, MdDelete } from 'react-icons/md';
import { UserPlus, Shuffle } from 'lucide-react';
import PropTypes from 'prop-types';

const ExerciseOverview = ({ exercises, currentExerciseIndex, onExerciseClick, onRemoveExercise, onAddExercise }) => {
    return (
        <Card sx={{
            background: 'rgba(40, 40, 40, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
        }}>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Exercise Overview
                    </Typography>
                    <Typography
                        variant="caption"
                        onClick={() => onAddExercise?.()}
                        sx={{
                            color: '#dded00',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        <UserPlus size={14} />
                        Add Exercise
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {exercises.map((exercise, index) => {
                        const completedSets = exercise.sets?.filter(set => set.completed).length || 0;
                        const targetSets = exercise.targetSets || 0;
                        const isActive = index === currentExerciseIndex;
                        const targetSetsMet = completedSets >= targetSets && targetSets > 0;

                        return (
                            <Box
                                key={index}
                                onClick={() => onExerciseClick?.(index)}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    backgroundColor: isActive
                                        ? 'rgba(221, 237, 0, 0.1)'
                                        : 'rgba(0, 0, 0, 0.2)',
                                    border: isActive
                                        ? '1px solid rgba(221, 237, 0, 0.5)'
                                        : '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: isActive
                                            ? 'rgba(221, 237, 0, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        borderColor: isActive
                                            ? 'rgba(221, 237, 0, 0.7)'
                                            : 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: isActive ? '#dded00' : '#fff',
                                                fontWeight: isActive ? 'bold' : 'medium',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            {exercise.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {completedSets}/{targetSets} sets completed
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: targetSetsMet
                                                ? 'rgba(76, 175, 80, 0.2)'
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: targetSetsMet
                                                ? '2px solid #4caf50'
                                                : '2px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {targetSetsMet && (
                                            <MdCheckCircle style={{ color: '#4caf50', fontSize: '18px' }} />
                                        )}
                                    </Box>
                                    <IconButton
                                        size="small"
                                        sx={{ color: '#dded00', padding: '4px' }}
                                    >
                                        <Shuffle size={14} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveExercise?.(index);
                                        }}
                                        sx={{
                                            color: '#f44336',
                                            padding: '4px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                            }
                                        }}
                                    >
                                        <MdDelete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Card>
    );
};

ExerciseOverview.propTypes = {
    exercises: PropTypes.array.isRequired,
    currentExerciseIndex: PropTypes.number.isRequired,
    onExerciseClick: PropTypes.func,
    onRemoveExercise: PropTypes.func,
    onAddExercise: PropTypes.func
};

export default ExerciseOverview;

