import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import { MdToday, MdFitnessCenter } from 'react-icons/md';

const DaySelector = ({ template, onSelectDay, onBack }) => {
    if (!template || !template.workoutDays) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: 'text.secondary' }}>
                    No workout days found in this template.
                </Typography>
                <Button onClick={onBack} sx={{ mt: 2, color: '#dded00' }}>
                    Back to Templates
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#dded00', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdToday />
                    Select Workout Day
                </Typography>
                <Button onClick={onBack} sx={{ color: 'text.secondary' }}>
                    Back to Templates
                </Button>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Template: <strong>{template.name}</strong>
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
                {template.workoutDays.map((day, index) => (
                    <Card
                        key={index}
                        sx={{
                            background: '#282828',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                border: '1px solid rgba(221, 237, 0, 0.5)',
                                transform: 'translateY(-2px)',
                            }
                        }}
                        onClick={() => onSelectDay(day)}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    {day.name}
                                </Typography>
                                <Chip
                                    label={`${day.exercises?.length || 0} exercises`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                        color: '#dded00'
                                    }}
                                />
                            </Box>

                            {day.description && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    {day.description}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {day.exercises?.slice(0, 4).map((exercise, exerciseIndex) => (
                                    <Chip
                                        key={exerciseIndex}
                                        label={exercise.name}
                                        size="small"
                                        icon={<MdFitnessCenter style={{ fontSize: '14px' }} />}
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                ))}
                                {day.exercises?.length > 4 && (
                                    <Chip
                                        label={`+${day.exercises.length - 4} more`}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default DaySelector;
