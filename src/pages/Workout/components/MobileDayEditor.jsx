import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, ButtonBase, Card, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useHideProfileButton } from '../../../components/mobile';
import { ArrowLeft, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useSupabase } from '../../../hooks/useSupabase';
import { useCustomExercises } from '../../../hooks/useCustomExercises';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { useWorkoutMutations, mapWorkoutDayToTemplateInput } from '../hooks/useWorkoutMutations';

function renumberSets(sets) {
  return sets.map((set, index) => ({ setNumber: index + 1, reps: set.reps }));
}

function ExercisePicker({ existing, onClose, onAdd }) {
  const supabase = useSupabase();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ searchTerm: '', primaryMuscle: '', page: 1, pageSize: 50 });
  const { items } = useExerciseCatalog({ supabase, filters });
  const { customExercises } = useCustomExercises();

  useEffect(() => {
    if (searchInput === filters.searchTerm) return undefined;
    const timer = setTimeout(() => setFilters((current) => ({ ...current, searchTerm: searchInput })), 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm, searchInput]);

  const existingNames = useMemo(() => new Set(existing.map((exercise) => exercise.name.toLowerCase())), [existing]);

  const options = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    const custom = customExercises
      .filter((exercise) => !term || exercise.name.toLowerCase().includes(term))
      .map((exercise) => ({ name: exercise.name, muscleGroup: exercise.muscles || 'Various', equipment: exercise.equipment || '' }));
    const catalog = items.map((exercise) => ({ name: exercise.name, muscleGroup: exercise.primaryMuscle || 'Various', equipment: (exercise.equipmentNeeded || [])[0] || '' }));
    return [...custom, ...catalog].filter((exercise) => !existingNames.has(exercise.name.toLowerCase()));
  }, [customExercises, items, searchInput, existingNames]);

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, backgroundColor: 'background.default', display: 'grid', gridTemplateRows: 'auto 1fr', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <IconButton aria-label="Close exercise picker" onClick={onClose}><X /></IconButton>
        <Typography component="h2" sx={{ fontSize: '1.3rem', fontWeight: 800 }}>Add exercise</Typography>
      </Box>
      <Box sx={{ overflowY: 'auto', minHeight: 0 }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search exercises"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          inputProps={{ 'aria-label': 'Search exercises to add' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { minHeight: 52, borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.16)' } }}
        />
        <Box sx={{ display: 'grid', gap: 1 }}>
          {options.map((exercise) => (
            <ButtonBase
              key={exercise.name}
              aria-label={`Add ${exercise.name}`}
              onClick={() => onAdd(exercise)}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'border.main', textAlign: 'left' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{exercise.name}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{exercise.muscleGroup}</Typography>
              </Box>
              <Plus size={18} color="var(--mui-palette-primary-main, #dded00)" />
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function MobileDayEditor({ program, day, onBack, onDeleted }) {
  useHideProfileButton();
  const { updateTemplate, updateProgram, deleteTemplate } = useWorkoutMutations();
  const [localDay, setLocalDay] = useState(day);
  const [pickerOpen, setPickerOpen] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setLocalDay(day);
  }, [day]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const persist = (nextDay) => {
    updateTemplate(nextDay.templateId, mapWorkoutDayToTemplateInput(nextDay, { isCustom: true })).catch((error) => {
      console.error('Failed to save day changes:', error);
    });
  };

  const patch = (partial, options = {}) => {
    setLocalDay((current) => {
      const next = { ...current, ...partial };
      if (options.debounce) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => persist(next), 500);
      } else {
        persist(next);
      }
      return next;
    });
  };

  const patchExercise = (exerciseId, updater) => {
    patch({ exercises: localDay.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise)) });
  };

  const handleRemoveExercise = (exerciseId) => {
    patch({ exercises: localDay.exercises.filter((exercise) => exercise.id !== exerciseId) });
  };

  const handleAddExercise = (picked) => {
    patch({
      exercises: localDay.exercises.concat([{
        id: `ex-${Date.now()}`,
        name: picked.name,
        muscleGroup: picked.muscleGroup,
        equipment: picked.equipment,
        sets: [{ setNumber: 1, reps: '10' }],
      }]),
    });
    setPickerOpen(false);
  };

  const handleDeleteDay = async () => {
    if (!window.confirm(`Delete "${localDay.name}"? This action cannot be undone.`)) return;
    try {
      const remainingTemplateIds = (program.templateIds || []).filter((id) => id !== localDay.templateId);
      await updateProgram(program.id, { templateIds: remainingTemplateIds });
      await deleteTemplate(localDay.templateId);
      onDeleted();
    } catch (error) {
      console.error('Failed to delete day:', error);
    }
  };

  return (
    <Box>
      <Box component="header" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2.5 }}>
        <IconButton aria-label="Back to program" onClick={onBack} sx={{ mt: -0.5 }}><ArrowLeft /></IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: '1.5rem', lineHeight: 1.1, fontWeight: 800 }}>{localDay.name || 'Day'}</Typography>
          <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.85rem' }}>{program.name}</Typography>
        </Box>
        <IconButton aria-label="Delete day" onClick={handleDeleteDay} sx={{ mt: -0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}><Trash2 /></IconButton>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, mb: 4 }}>
        <TextField
          label="Day name"
          value={localDay.name}
          onChange={(event) => patch({ name: event.target.value }, { debounce: true })}
          fullWidth
        />
        <TextField
          label="Focus"
          placeholder="Chest, Shoulders, Triceps"
          value={localDay.focus}
          onChange={(event) => patch({ focus: event.target.value }, { debounce: true })}
          helperText="Shows under the day everywhere it appears."
          fullWidth
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography component="h2" sx={{ fontSize: '1.3rem', fontWeight: 800 }}>Exercises</Typography>
        <Typography sx={{ color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8rem' }}>{localDay.exercises.length}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {localDay.exercises.map((exercise) => (
          <Card key={exercise.id} sx={{ p: 1.75, borderRadius: '14px', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }}>{exercise.name}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.25 }}>
                  {exercise.muscleGroup}{exercise.equipment ? ` · ${exercise.equipment}` : ''}
                </Typography>
              </Box>
              <IconButton aria-label={`Remove ${exercise.name}`} size="small" onClick={() => handleRemoveExercise(exercise.id)}>
                <X size={17} />
              </IconButton>
            </Box>

            <Box sx={{ display: 'grid', gap: 1, mt: 1.5 }}>
              {exercise.sets.map((set, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography sx={{ width: 52, flexShrink: 0, color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem' }}>
                    SET {set.setNumber}
                  </Typography>
                  <TextField
                    value={set.reps}
                    inputProps={{ 'aria-label': `Set ${set.setNumber} reps`, inputMode: 'numeric', style: { textAlign: 'center' } }}
                    onChange={(event) => patchExercise(exercise.id, (current) => ({
                      ...current,
                      sets: current.sets.map((candidate, candidateIndex) => (candidateIndex === index ? { setNumber: candidate.setNumber, reps: event.target.value } : candidate)),
                    }))}
                    onBlur={() => persist(localDay)}
                    size="small"
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(0,0,0,0.16)' } }}
                  />
                  <Typography sx={{ width: 32, color: 'text.secondary', fontSize: '0.8rem' }}>reps</Typography>
                  <IconButton
                    aria-label={`Remove set ${set.setNumber}`}
                    size="small"
                    disabled={exercise.sets.length <= 1}
                    onClick={() => patchExercise(exercise.id, (current) => ({ ...current, sets: renumberSets(current.sets.filter((_, candidateIndex) => candidateIndex !== index)) }))}
                  >
                    <Minus size={16} />
                  </IconButton>
                </Box>
              ))}
              <Button
                onClick={() => patchExercise(exercise.id, (current) => ({ ...current, sets: current.sets.concat([{ setNumber: current.sets.length + 1, reps: current.sets[current.sets.length - 1]?.reps || '10' }]) }))}
                startIcon={<Plus size={15} />}
                sx={{ justifySelf: 'start', color: 'primary.main', fontWeight: 700, textTransform: 'none' }}
              >
                Add set
              </Button>
            </Box>
          </Card>
        ))}

        {!localDay.exercises.length ? (
          <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'border.main', borderRadius: '14px' }}>
            <Typography sx={{ color: 'text.secondary' }}>Nothing planned yet. Add the exercises for this day.</Typography>
          </Box>
        ) : null}

        <Button
          variant="outlined"
          startIcon={<Plus size={18} />}
          onClick={() => setPickerOpen(true)}
          sx={{ minHeight: 52, borderStyle: 'dashed' }}
        >
          Add exercise
        </Button>
      </Box>

      {pickerOpen ? (
        <ExercisePicker
          existing={localDay.exercises}
          onClose={() => setPickerOpen(false)}
          onAdd={handleAddExercise}
        />
      ) : null}
    </Box>
  );
}
