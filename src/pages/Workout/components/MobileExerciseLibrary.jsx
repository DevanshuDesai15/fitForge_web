import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  ButtonBase,
  Chip,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronRight, Info, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSupabase } from '../../../hooks/useSupabase';
import { useCustomExercises } from '../../../hooks/useCustomExercises';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import CustomExerciseForm from './CustomExerciseForm';
import MobileExerciseDetail from './MobileExerciseDetail';

const normalizeExerciseKey = (name) => (name || '').trim().toLowerCase();

const catalogSx = {
  chipRow: {
    display: 'flex',
    gap: 0.75,
    overflowX: 'auto',
    minWidth: 0,
    width: '100%',
    pb: 0.5,
    mb: 2,
    '&::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  },
};

export default function MobileExerciseLibrary() {
  const { currentUser } = useAuth();
  const supabase = useSupabase();

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ searchTerm: '', primaryMuscle: '', page: 1, pageSize: 100 });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [deletingExercise, setDeletingExercise] = useState(null);
  const [addSuccessOpen, setAddSuccessOpen] = useState(false);
  const [addDuplicateOpen, setAddDuplicateOpen] = useState(false);

  const { items, filterOptions, loading, error } = useExerciseCatalog({ supabase, filters });
  const { customExercises, saveCustomExercise, editCustomExercise, deleteCustomExercise } = useCustomExercises();

  useEffect(() => {
    if (searchInput === filters.searchTerm) return undefined;
    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, searchTerm: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm, searchInput]);

  const muscleChips = useMemo(() => ['All', ...filterOptions.primaryMuscles], [filterOptions.primaryMuscles]);
  const activeMuscle = filters.primaryMuscle || 'All';

  const handleMuscleSelect = (muscle) => {
    setFilters((current) => ({ ...current, primaryMuscle: muscle === 'All' ? '' : muscle, page: 1 }));
  };

  const filteredCustomExercises = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return customExercises
      .filter((exercise) => {
        const matchesSearch = !term || exercise.name.toLowerCase().includes(term);
        const matchesMuscle = !filters.primaryMuscle
          || (exercise.primaryMuscles || []).includes(filters.primaryMuscle)
          || exercise.muscles === filters.primaryMuscle;
        return matchesSearch && matchesMuscle;
      })
      .map((exercise) => ({
        id: `custom-${exercise.name}`,
        name: exercise.name,
        primaryMuscle: exercise.muscles || 'Various',
        equipment: exercise.equipment ? [exercise.equipment] : [],
        isCustom: true,
        raw: { ...exercise, id: `custom-${exercise.name}`, isCustom: true },
      }));
  }, [customExercises, searchInput, filters.primaryMuscle]);

  const catalogExercises = useMemo(() => items.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle || 'Unknown',
    equipment: exercise.equipmentNeeded || [],
    isCustom: false,
    raw: exercise,
  })), [items]);

  const visibleExercises = useMemo(
    () => [...filteredCustomExercises, ...catalogExercises],
    [filteredCustomExercises, catalogExercises]
  );

  const trimmedSearch = searchInput.trim();
  const showEmptySearchForm = trimmedSearch.length > 0 && visibleExercises.length === 0 && !loading;

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise.raw);
  };

  const handleAddCustomExercise = async ({ name, muscleGroup }) => {
    const isDuplicate = customExercises.some(
      (exercise) => normalizeExerciseKey(exercise.name) === normalizeExerciseKey(name)
    );
    if (isDuplicate) {
      setAddDuplicateOpen(true);
      return;
    }
    await saveCustomExercise({ name, muscleGroup });
    setAddingExercise(false);
    setAddSuccessOpen(true);
    setSearchInput('');
  };

  const handleEditCustomExercise = async ({ name, muscleGroup }) => {
    await editCustomExercise(editingExercise.name, { name, muscleGroup });
    setEditingExercise(null);
  };

  const handleDeleteConfirm = async () => {
    await deleteCustomExercise(deletingExercise.name);
    setDeletingExercise(null);
  };

  if (error) {
    return (
      <Box role="alert" sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary' }}>Could not load the exercise library.</Typography>
      </Box>
    );
  }

  if (selectedExercise) {
    return <MobileExerciseDetail exercise={selectedExercise} onBack={() => setSelectedExercise(null)} />;
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.25, minWidth: 0 }}>
      <TextField
        fullWidth
        placeholder="Search exercises"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        inputProps={{ 'aria-label': 'Search exercises' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
        sx={{ '& .MuiOutlinedInput-root': { minHeight: 52, borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.16)' } }}
      />

      <Box sx={catalogSx.chipRow}>
        {muscleChips.map((muscle) => (
          <Chip
            key={muscle}
            label={muscle}
            clickable
            onClick={() => handleMuscleSelect(muscle)}
            sx={{
              flexShrink: 0,
              height: 32,
              fontWeight: 700,
              backgroundColor: activeMuscle === muscle ? 'primary.main' : 'rgba(255,255,255,0.06)',
              color: activeMuscle === muscle ? 'primary.contrastText' : 'text.primary',
              border: '1px solid',
              borderColor: activeMuscle === muscle ? 'primary.main' : 'border.main',
            }}
          />
        ))}
      </Box>

      {showEmptySearchForm ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
            No exercises match &ldquo;{trimmedSearch}&rdquo;.
          </Typography>
          <CustomExerciseForm key={trimmedSearch} initialName={trimmedSearch} onAdd={handleAddCustomExercise} compact />
        </Box>
      ) : (
        <>
          {visibleExercises.map((exercise) => (
            <Box
              key={exercise.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                minHeight: 60,
                borderRadius: '14px',
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'border.main',
              }}
            >
              <ButtonBase
                aria-label={`Open ${exercise.name} details`}
                onClick={() => handleExerciseClick(exercise)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, p: 1.5, textAlign: 'left' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exercise.name}
                    </Typography>
                    {exercise.isCustom ? (
                      <Chip label="Custom" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(221,237,0,0.16)', color: 'primary.main' }} />
                    ) : null}
                  </Box>
                  <Typography sx={{ mt: 0.4, color: 'text.secondary', fontSize: '0.85rem' }}>
                    {exercise.primaryMuscle}
                  </Typography>
                </Box>

                {exercise.equipment?.[0] ? (
                  <Chip
                    label={exercise.equipment[0]}
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0, height: 26, borderColor: 'border.main', color: 'text.secondary' }}
                  />
                ) : null}

                {!exercise.isCustom ? (
                  <ChevronRight size={19} color="var(--text-secondary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                ) : null}
              </ButtonBase>

              {exercise.isCustom ? (
                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, pr: 1 }}>
                  <IconButton
                    aria-label={`Edit ${exercise.name}`}
                    size="small"
                    onClick={() => setEditingExercise(exercise.raw)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${exercise.name}`}
                    size="small"
                    onClick={() => setDeletingExercise(exercise.raw)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              ) : null}
            </Box>
          ))}

          {addingExercise ? (
            <CustomExerciseForm onAdd={handleAddCustomExercise} compact />
          ) : (
            <ButtonBase
              aria-label="Add a custom exercise"
              onClick={() => setAddingExercise(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                width: '100%',
                minHeight: 52,
                p: 1.5,
                borderRadius: '14px',
                border: '1px dashed',
                borderColor: 'border.main',
                color: 'text.secondary',
                fontWeight: 700,
              }}
            >
              <Plus size={18} />
              Add a custom exercise
            </ButtonBase>
          )}
        </>
      )}

      {editingExercise ? (
        <Box sx={{ display: 'grid', gap: 1, p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'border.main' }} role="dialog" aria-label="Edit exercise">
          <Typography sx={{ fontWeight: 700 }}>Edit exercise</Typography>
          <CustomExerciseForm initialName={editingExercise?.name} onAdd={handleEditCustomExercise} compact />
          <ButtonBase onClick={() => setEditingExercise(null)} sx={{ justifySelf: 'start', color: 'text.secondary', fontWeight: 700, py: 0.5 }}>
            Cancel
          </ButtonBase>
        </Box>
      ) : null}

      {deletingExercise ? (
        <Box sx={{ display: 'grid', gap: 1.25, p: 2, borderRadius: '14px', border: '1px solid', borderColor: 'error.main' }} role="alertdialog" aria-label="Delete exercise">
          <Typography sx={{ fontWeight: 700 }}>Delete &ldquo;{deletingExercise?.name}&rdquo;?</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            This permanently removes it from your library.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <ButtonBase onClick={() => setDeletingExercise(null)} sx={{ px: 1.5, py: 0.75, borderRadius: '10px', color: 'text.secondary', fontWeight: 700 }}>
              Cancel
            </ButtonBase>
            <ButtonBase
              onClick={handleDeleteConfirm}
              sx={{ px: 1.5, py: 0.75, borderRadius: '10px', bgcolor: 'error.main', color: '#fff', fontWeight: 700 }}
            >
              Delete
            </ButtonBase>
          </Box>
        </Box>
      ) : null}

      <Snackbar open={addSuccessOpen} autoHideDuration={3000} onClose={() => setAddSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setAddSuccessOpen(false)} sx={{ width: '100%' }}>
          Exercise added to your library!
        </Alert>
      </Snackbar>

      <Snackbar open={addDuplicateOpen} autoHideDuration={3000} onClose={() => setAddDuplicateOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => setAddDuplicateOpen(false)} sx={{ width: '100%' }}>
          An exercise with this name already exists in your library.
        </Alert>
      </Snackbar>

      {!currentUser ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
          <Info size={14} />
          Sign in to save custom exercises.
        </Box>
      ) : null}
    </Box>
  );
}
