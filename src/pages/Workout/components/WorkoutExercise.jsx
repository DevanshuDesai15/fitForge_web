import { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import { MdExpandMore, MdFitnessCenter, MdAdd, MdDelete } from 'react-icons/md';
import ExerciseSet from './ExerciseSet';

const WorkoutExercise = ({
    exercise,
    exerciseIndex,
    onSetChange,
    onToggleCompletion,
    onAddSet,
    onRemoveSet,
    weightUnit = 'kg',
    aiSuggestions = {},
    expanded = false,
    onExpandChange
}) => {
    const completedSets = exercise.sets?.filter(set => set.completed).length || 0;
    const totalSets = exercise.sets?.length || 0;
    const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    const exerciseSuggestion = aiSuggestions[exercise.name];

    return (
        <Card sx={{
            background: '#282828',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 2,
            '&:hover': {
                border: '1px solid rgba(221, 237, 0, 0.3)',
            }
        }}>
            <Accordion
                expanded={expanded}
                onChange={onExpandChange}
                sx={{
                    background: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                }}
            >
                <AccordionSummary
                    expandIcon={<MdExpandMore style={{ color: '#dded00' }} />}
                    sx={{
                        '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <MdFitnessCenter style={{ color: '#dded00', fontSize: '20px' }} />
                            <Box>
                                <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem' }}>
                                    {exercise.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {completedSets}/{totalSets} sets completed
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {exerciseSuggestion && (
                                <Chip
                                    label="AI"
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                        color: '#dded00',
                                        fontSize: '0.7rem',
                                        height: '20px'
                                    }}
                                />
                            )}
                            <Box sx={{
                                width: '60px',
                                height: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    width: `${completionPercentage}%`,
                                    height: '100%',
                                    backgroundColor: completionPercentage === 100 ? '#4caf50' : '#dded00',
                                    transition: 'width 0.3s ease'
                                }} />
                            </Box>
                        </Box>
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0 }}>
                    {/* Exercise Details */}
                    {exercise.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            {exercise.description}
                        </Typography>
                    )}

                    {/* Sets */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#dded00', mb: 1 }}>
                            Sets
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {exercise.sets?.map((set, setIndex) => (
                                <ExerciseSet
                                    key={setIndex}
                                    set={set}
                                    setIndex={setIndex}
                                    exerciseIndex={exerciseIndex}
                                    onSetChange={onSetChange}
                                    onToggleCompletion={onToggleCompletion}
                                    weightUnit={weightUnit}
                                    aiSuggestion={exerciseSuggestion}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Add/Remove Set Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                            size="small"
                            startIcon={<MdAdd />}
                            onClick={() => onAddSet(exerciseIndex)}
                            sx={{
                                color: '#4caf50',
                                borderColor: '#4caf50',
                                '&:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    borderColor: '#66bb6a',
                                }
                            }}
                            variant="outlined"
                        >
                            Add Set
                        </Button>
                        {totalSets > 1 && (
                            <Button
                                size="small"
                                startIcon={<MdDelete />}
                                onClick={() => onRemoveSet(exerciseIndex)}
                                sx={{
                                    color: '#f44336',
                                    borderColor: '#f44336',
                                    '&:hover': {
                                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                        borderColor: '#ef5350',
                                    }
                                }}
                                variant="outlined"
                            >
                                Remove Set
                            </Button>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Card>
    );
};

export default WorkoutExercise;
