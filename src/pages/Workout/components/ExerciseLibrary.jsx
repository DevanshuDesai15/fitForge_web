import { useState } from 'react';
import { Box, Typography, TextField, InputAdornment, Grid2, Card, CardContent, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MdSearch, MdFilterList, MdFitnessCenter } from 'react-icons/md';
import { Dumbbell, Target, Activity, Zap } from 'lucide-react';
import exerciseData from '../../../../MergedData.json';

const ExerciseCard = styled(Card)(() => ({
    background: 'rgba(40, 40, 40, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '100%',
    '&:hover': {
        border: '1px solid rgba(221, 237, 0, 0.3)',
        transform: 'translateY(-2px)',
    },
}));

const CategoryChip = styled(Chip)(({ active }) => ({
    backgroundColor: active ? 'rgba(221, 237, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: active ? '#dded00' : 'rgba(255, 255, 255, 0.7)',
    border: active ? '1px solid rgba(221, 237, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
    '&:hover': {
        backgroundColor: active ? 'rgba(221, 237, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
    },
}));

const ExerciseLibrary = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Get unique categories from exercise data
    const categories = ['All', ...new Set(exerciseData.map(ex => ex.bodyPart))];

    // Filter exercises based on search and category
    const filteredExercises = exerciseData.filter(exercise => {
        const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (exercise.equipment && exercise.equipment.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || exercise.bodyPart === selectedCategory;

        return matchesSearch && matchesCategory;
    }).slice(0, 12); // Limit to 12 exercises for performance

    const getExerciseIcon = (bodyPart) => {
        switch (bodyPart.toLowerCase()) {
            case 'chest':
            case 'shoulders':
            case 'upper arms':
                return <Dumbbell size={20} />;
            case 'back':
            case 'lower arms':
                return <Target size={20} />;
            case 'upper legs':
            case 'lower legs':
                return <Activity size={20} />;
            case 'waist':
            case 'cardio':
                return <Zap size={20} />;
            default:
                return <MdFitnessCenter size={20} />;
        }
    };

    const getBodyPartColor = (bodyPart) => {
        const colors = {
            'chest': '#ff6b6b',
            'back': '#4ecdc4',
            'shoulders': '#45b7d1',
            'upper arms': '#96ceb4',
            'lower arms': '#feca57',
            'upper legs': '#ff9ff3',
            'lower legs': '#54a0ff',
            'waist': '#5f27cd',
            'cardio': '#00d2d3',
            'neck': '#ff6348'
        };
        return colors[bodyPart.toLowerCase()] || '#dded00';
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: '#dded00', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdFitnessCenter />
                Exercise Library
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Explore our comprehensive database of exercises
            </Typography>

            {/* Search and Filter */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search exercises by name, body part, or equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <MdSearch style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        mb: 2,
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
                        '& .MuiOutlinedInput-input': {
                            color: '#fff',
                        },
                    }}
                />

                {/* Category Filter */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MdFilterList style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                        Filter by body part:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {categories.map((category) => (
                            <CategoryChip
                                key={category}
                                label={category}
                                size="small"
                                active={selectedCategory === category}
                                onClick={() => setSelectedCategory(category)}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Exercise Grid */}
            <Grid2 container spacing={2}>
                {filteredExercises.map((exercise, index) => (
                    <Grid2 key={index} xs={12} sm={6} md={4}>
                        <ExerciseCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                    <Box sx={{ color: getBodyPartColor(exercise.bodyPart), display: 'flex' }}>
                                        {getExerciseIcon(exercise.bodyPart)}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#fff', fontSize: '0.95rem', mb: 1 }}>
                                            {exercise.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                            <Chip
                                                label={exercise.bodyPart}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${getBodyPartColor(exercise.bodyPart)}20`,
                                                    color: getBodyPartColor(exercise.bodyPart),
                                                    fontSize: '0.7rem',
                                                    height: '20px'
                                                }}
                                            />
                                            {exercise.equipment && (
                                                <Chip
                                                    label={exercise.equipment}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        color: 'text.secondary',
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        {exercise.target && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Target: {exercise.target}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Exercise GIF placeholder */}
                                <Box sx={{
                                    height: '100px',
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2
                                }}>
                                    {exercise.gifUrl ? (
                                        <img
                                            src={exercise.gifUrl}
                                            alt={exercise.name}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Exercise Demo
                                        </Typography>
                                    )}
                                </Box>

                                {/* Secondary muscles */}
                                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                            Secondary muscles:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {exercise.secondaryMuscles.slice(0, 3).map((muscle, muscleIndex) => (
                                                <Chip
                                                    key={muscleIndex}
                                                    label={muscle}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        color: 'text.secondary',
                                                        fontSize: '0.65rem',
                                                        height: '18px'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </ExerciseCard>
                    </Grid2>
                ))}
            </Grid2>

            {filteredExercises.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                        No exercises found
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Try adjusting your search terms or category filter
                    </Typography>
                </Box>
            )}

            {filteredExercises.length > 0 && filteredExercises.length === 12 && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Showing first 12 results. Use search to find specific exercises.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ExerciseLibrary;
