import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, FormControl, Select, MenuItem } from '@mui/material';
import PropTypes from 'prop-types';

const MUSCLE_GROUPS = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core',
    'Glutes', 'Hamstrings', 'Quadriceps', 'Calves'
];

const CustomExerciseForm = ({ initialName, onAdd, compact = false }) => {
    const [name, setName] = useState(initialName || '');
    const [muscleGroup, setMuscleGroup] = useState('');

    useEffect(() => {
        setName(initialName || '');
    }, [initialName]);

    const handleSubmit = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd({ name: trimmed, muscleGroup });
        setName('');
        setMuscleGroup('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
                fullWidth
                placeholder="Exercise name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                size={compact ? 'small' : 'medium'}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                        '&:hover fieldset': { borderColor: '#dded00' },
                        '&.Mui-focused fieldset': { borderColor: '#dded00' },
                    },
                }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <FormControl size={compact ? 'small' : 'medium'} sx={{ flex: 1 }}>
                    <Select
                        displayEmpty
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value)}
                        renderValue={(v) => v || <span style={{ color: 'rgba(255,255,255,0.4)' }}>Muscle group (optional)</span>}
                        sx={{
                            color: '#fff',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#dded00' },
                        }}
                    >
                        <MenuItem value=""><em>None / Other</em></MenuItem>
                        {MUSCLE_GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    disabled={!name.trim()}
                    onClick={handleSubmit}
                    size={compact ? 'small' : 'medium'}
                    sx={{
                        backgroundColor: '#dded00',
                        color: '#000',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': { backgroundColor: '#c8d800' },
                        '&:disabled': { backgroundColor: 'rgba(221, 237, 0, 0.3)', color: 'rgba(0,0,0,0.4)' },
                    }}
                >
                    Add to Workout
                </Button>
            </Box>
            {muscleGroup && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: -0.5 }}>
                    Muscle group helps the AI track your progression after the first completed workout.
                </Typography>
            )}
        </Box>
    );
};

CustomExerciseForm.propTypes = {
    initialName: PropTypes.string,
    onAdd: PropTypes.func.isRequired,
    compact: PropTypes.bool,
};

export { MUSCLE_GROUPS };
export default CustomExerciseForm;
