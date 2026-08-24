import { Box, Typography, Card, TextField } from '@mui/material';
import { StickyNote } from 'lucide-react';
import PropTypes from 'prop-types';

const ExerciseNotesTab = ({ exercise, onNotesChange }) => {
    const noteText = exercise?.notes || '';

    return (
        <Box sx={{ mt: 3 }}>
            <Card sx={{
                background: 'rgba(40, 40, 40, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
            }}>
                <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: '10px',
                            background: 'rgba(221, 237, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <StickyNote size={20} color="#dded00" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                                Notes
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {exercise?.name || 'Exercise'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Notes Text Area */}
                    <TextField
                        multiline
                        minRows={4}
                        maxRows={10}
                        fullWidth
                        placeholder="Add notes for this exercise... (e.g. form cues, how it felt, weight progression ideas)"
                        value={noteText}
                        onChange={(e) => onNotesChange?.(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.95rem',
                                lineHeight: 1.6,
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(221, 237, 0, 0.4)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#dded00',
                                    borderWidth: '1.5px',
                                },
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: 'rgba(255, 255, 255, 0.35)',
                                opacity: 1,
                            },
                        }}
                    />

                    {/* Character Count */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Typography variant="caption" sx={{
                            color: noteText.length > 500
                                ? 'rgba(244, 67, 54, 0.8)'
                                : 'rgba(255, 255, 255, 0.3)',
                            fontSize: '0.7rem',
                        }}>
                            {noteText.length} / 500
                        </Typography>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

ExerciseNotesTab.propTypes = {
    exercise: PropTypes.object,
    onNotesChange: PropTypes.func.isRequired,
};

export default ExerciseNotesTab;
