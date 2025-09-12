import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material';
import { MdLibraryBooks, MdFitnessCenter } from 'react-icons/md';

const TemplateSelector = ({ templates, onSelectTemplate, loading }) => {
    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: 'text.secondary' }}>
                    Loading workout templates...
                </Typography>
            </Box>
        );
    }

    if (templates.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <MdLibraryBooks style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                    No Workout Templates Found
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                    Create your first workout template to get started!
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdLibraryBooks />
                Select Workout Template
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
                {templates.map((template) => (
                    <Card
                        key={template.id}
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
                        onClick={() => onSelectTemplate(template)}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    {template.name}
                                </Typography>
                                <Chip
                                    label={`${template.workoutDays?.length || 0} days`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(221, 237, 0, 0.2)',
                                        color: '#dded00'
                                    }}
                                />
                            </Box>

                            {template.description && (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    {template.description}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {template.workoutDays?.slice(0, 3).map((day, index) => (
                                    <Chip
                                        key={index}
                                        label={day.name}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                ))}
                                {template.workoutDays?.length > 3 && (
                                    <Chip
                                        label={`+${template.workoutDays.length - 3} more`}
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

export default TemplateSelector;
