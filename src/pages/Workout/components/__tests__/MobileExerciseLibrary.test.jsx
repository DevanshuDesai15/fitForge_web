import 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MobileExerciseLibrary from '../MobileExerciseLibrary';
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog';
import { useAuth } from '../../../../contexts/AuthContext';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useCustomExercises } from '../../../../hooks/useCustomExercises';
import { useWorkoutReader } from '../../../../hooks/useWorkouts';

vi.mock('../../hooks/useExerciseCatalog', () => ({
  useExerciseCatalog: vi.fn(),
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../hooks/useSupabase', () => ({
  useSupabase: vi.fn(),
}));

vi.mock('../../../../hooks/useCustomExercises', () => ({
  useCustomExercises: vi.fn(),
}));

vi.mock('../../../../hooks/useWorkouts', () => ({
  useWorkoutReader: vi.fn(),
}));

const catalogExercises = [
  { id: 'ex-1', name: 'Barbell Bench Press', primaryMuscle: 'Chest', equipmentNeeded: ['Barbell'] },
  { id: 'ex-2', name: 'Kettlebell Single Arm Row', primaryMuscle: 'Back', equipmentNeeded: ['Kettlebell'] },
];

const defaultFilterOptions = {
  primaryMuscles: ['Back', 'Chest'],
  equipment: [],
  difficulties: [],
  tags: [],
};

const defaultCustomExercisesReturn = {
  customExercises: [],
  loading: false,
  error: null,
  saveCustomExercise: vi.fn(),
  editCustomExercise: vi.fn(),
  deleteCustomExercise: vi.fn(),
  refresh: vi.fn(),
};

const renderLibrary = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MobileExerciseLibrary />
  </QueryClientProvider>
);

describe('MobileExerciseLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user-1' } });
    useSupabase.mockReturnValue({});
    useCustomExercises.mockReturnValue({ ...defaultCustomExercisesReturn });
    useWorkoutReader.mockReturnValue(vi.fn().mockResolvedValue([]));
    useExerciseCatalog.mockImplementation(({ filters }) => {
      let items = catalogExercises;
      if (filters.primaryMuscle) {
        items = items.filter((exercise) => exercise.primaryMuscle === filters.primaryMuscle);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        items = items.filter((exercise) => exercise.name.toLowerCase().includes(term));
      }

      return {
        items,
        totalCount: items.length,
        filterOptions: defaultFilterOptions,
        loading: false,
        error: '',
      };
    });
  });

  it('renders catalog exercises with muscle group and equipment chip', async () => {
    renderLibrary();

    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Kettlebell Single Arm Row')).toBeInTheDocument();
    expect(screen.getAllByText('Chest').length).toBeGreaterThan(0);
    expect(screen.getByText('Barbell')).toBeInTheDocument();
  });

  it('filters live as the user types in the search field', async () => {
    renderLibrary();

    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search exercises'), { target: { value: 'kettlebell' } });

    await waitFor(() => {
      expect(useExerciseCatalog).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ searchTerm: 'kettlebell' }) })
      );
    }, { timeout: 1000 });

    await waitFor(() => {
      expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Kettlebell Single Arm Row')).toBeInTheDocument();
  });

  it('filters exercises when a muscle chip is selected', async () => {
    renderLibrary();

    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Back')[0]);

    await waitFor(() => {
      expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Kettlebell Single Arm Row')).toBeInTheDocument();
  });

  it('sorts custom exercises before catalog results and tags them Custom', async () => {
    useCustomExercises.mockReturnValue({
      ...defaultCustomExercisesReturn,
      customExercises: [{ name: 'My Custom Curl', muscles: 'Biceps', primaryMuscles: ['Biceps'], equipment: 'Dumbbell' }],
    });

    renderLibrary();

    const rowNames = await screen.findAllByRole('button', { name: /Open .* details/i });
    expect(rowNames[0]).toHaveAccessibleName('Open My Custom Curl details');
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('opens a prefilled custom exercise form when search yields no results', async () => {
    renderLibrary();

    fireEvent.change(screen.getByLabelText('Search exercises'), { target: { value: 'nonexistent exercise' } });

    await waitFor(() => {
      expect(screen.getByText('No exercises match “nonexistent exercise”.')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByPlaceholderText('Exercise name')).toHaveValue('nonexistent exercise');
  });

  it('opens a full-screen exercise detail when a catalog row is tapped', async () => {
    renderLibrary();

    fireEvent.click(await screen.findByRole('button', { name: 'Open Barbell Bench Press details' }));

    expect(await screen.findByRole('heading', { name: 'Barbell Bench Press' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to library' })).toBeInTheDocument();
    expect(await screen.findByText(/Your last sessions/i)).toBeInTheDocument();
  });

  it('opens exercise detail when a custom row is tapped', async () => {
    useCustomExercises.mockReturnValue({
      ...defaultCustomExercisesReturn,
      customExercises: [{ name: 'My Custom Curl', muscles: 'Biceps', primaryMuscles: ['Biceps'], equipment: 'Dumbbell' }],
    });

    renderLibrary();

    fireEvent.click(await screen.findByRole('button', { name: 'Open My Custom Curl details' }));

    expect(await screen.findByRole('heading', { name: 'My Custom Curl' })).toBeInTheDocument();
  });

  it('shows a permanent add-custom-exercise row when results exist', async () => {
    renderLibrary();

    expect(await screen.findByRole('button', { name: 'Add a custom exercise' })).toBeInTheDocument();
  });

  it('warns instead of saving when a duplicate custom exercise name is submitted', async () => {
    const saveCustomExercise = vi.fn();
    useCustomExercises.mockReturnValue({
      ...defaultCustomExercisesReturn,
      customExercises: [{ name: 'My Custom Curl', muscles: 'Biceps', primaryMuscles: ['Biceps'], equipment: 'Dumbbell' }],
      saveCustomExercise,
    });

    renderLibrary();

    fireEvent.click(await screen.findByRole('button', { name: 'Add a custom exercise' }));
    fireEvent.change(screen.getByPlaceholderText('Exercise name'), { target: { value: 'My Custom Curl' } });
    fireEvent.click(screen.getByRole('button', { name: /Add to Workout/i }));

    expect(await screen.findByText(/already exists in your library/i)).toBeInTheDocument();
    expect(saveCustomExercise).not.toHaveBeenCalled();
  });
});
