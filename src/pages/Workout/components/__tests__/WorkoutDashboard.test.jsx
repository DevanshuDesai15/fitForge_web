import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkoutDashboard from '../WorkoutDashboard';
import { getWorkoutTabFromSearchParams } from '../workoutDashboardUtils';

const useMediaQueryMock = vi.hoisted(() => vi.fn());
const workoutProgramsMock = vi.hoisted(() => ({
  programs: [],
  loading: false,
  error: '',
  loadPrograms: vi.fn(),
}));

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return { ...actual, useMediaQuery: (...args) => useMediaQueryMock(...args) };
});

vi.mock('../WorkoutsTab', () => ({ default: () => <div>Workouts panel</div> }));
vi.mock('../ExerciseLibraryTab', () => ({ default: () => <div>Library panel</div> }));
vi.mock('../MobileExerciseLibrary', () => ({ default: () => <div>Library panel</div> }));
vi.mock('../MobileWorkoutsList', () => ({ default: () => <div>Workouts panel</div> }));
vi.mock('../CreateWorkoutModal', () => ({ default: () => null }));
vi.mock('../CreateProgramModal', () => ({ default: () => null }));
vi.mock('../MobileDayEditor', () => ({ default: ({ day }) => <div>Day editor: {day.name}</div> }));
vi.mock('../../hooks/useWorkoutPrograms', () => ({ useWorkoutPrograms: () => workoutProgramsMock }));

const workoutMutationsMock = vi.hoisted(() => ({
  deleteProgram: vi.fn(),
  createTemplate: vi.fn(),
  updateProgram: vi.fn(),
}));

vi.mock('../../hooks/useWorkoutMutations', () => ({ useWorkoutMutations: () => workoutMutationsMock }));

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current location">{`${location.pathname}${location.search}`}</output>;
}

function renderDashboard(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/workout" element={<><WorkoutDashboard /><LocationDisplay /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('getWorkoutTabFromSearchParams', () => {
  it('opens the canonical exercise library tab from the URL', () => {
    expect(getWorkoutTabFromSearchParams(new URLSearchParams('tab=library'))).toBe(1);
  });

  it('defaults unknown or missing tabs to workouts', () => {
    expect(getWorkoutTabFromSearchParams(new URLSearchParams())).toBe(0);
    expect(getWorkoutTabFromSearchParams(new URLSearchParams('tab=unknown'))).toBe(0);
  });
});

describe('WorkoutDashboard mobile navigation', () => {
  beforeEach(() => {
    useMediaQueryMock.mockReturnValue(false);
    workoutProgramsMock.programs = [];
    workoutMutationsMock.deleteProgram.mockReset();
    workoutMutationsMock.createTemplate.mockReset();
    workoutMutationsMock.updateProgram.mockReset();
  });

  it('selects Programs from the URL and changes to Library through URL state', () => {
    renderDashboard('/workout?tab=programs');

    expect(screen.getByRole('tab', { name: 'Programs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /new program/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Library' }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent('/workout?tab=library');
    expect(screen.getByText('Library panel')).toBeInTheDocument();
  });

  it.each(['/workout?source=home', '/workout?tab=unknown&source=home'])(
    'defaults %s to Workouts without discarding unrelated parameters',
    (entry) => {
      renderDashboard(entry);

      expect(screen.getByRole('tab', { name: 'Workouts' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByLabelText('Current location')).toHaveTextContent('source=home');
    },
  );

  it('opens a selected program and returns to the URL-backed list', () => {
    workoutProgramsMock.programs = [{
      id: 'program-1',
      name: 'Push / Pull / Legs',
      description: 'Three-way split',
      category: 'Hypertrophy',
      difficulty: 'Intermediate',
      frequency: '4x/week',
      duration: '8 weeks',
      days: [{ id: 'day-1', name: 'Push', focus: 'Chest', exercises: [] }],
    }];
    renderDashboard('/workout?tab=programs');

    fireEvent.click(screen.getByRole('button', { name: /open push \/ pull \/ legs/i }));

    expect(screen.getByRole('heading', { name: 'Days' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Workout sections' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Current location')).toHaveTextContent('program=program-1');

    fireEvent.click(screen.getByRole('button', { name: /back to programs/i }));
    expect(screen.getByPlaceholderText('Search programs')).toBeInTheDocument();
    expect(screen.getByLabelText('Current location')).not.toHaveTextContent('program=');
  });

  it('opens a day into the mobile day editor via URL state', () => {
    workoutProgramsMock.programs = [{
      id: 'program-1',
      name: 'Push / Pull / Legs',
      templateIds: ['day-1'],
      days: [{ id: 'day-1', templateId: 'day-1', name: 'Push', focus: 'Chest', exercises: [] }],
    }];
    renderDashboard('/workout?tab=programs&program=program-1');

    fireEvent.click(screen.getByRole('button', { name: /open push day/i }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent('day=day-1');
    expect(screen.getByText('Day editor: Push')).toBeInTheDocument();
  });

  it('creates a new template and adds it to the program when adding a day', async () => {
    workoutMutationsMock.createTemplate.mockResolvedValue({ id: 'new-day-id' });
    workoutProgramsMock.programs = [{
      id: 'program-1',
      name: 'Push / Pull / Legs',
      category: 'Strength',
      difficulty: 'Intermediate',
      templateIds: ['day-1'],
      days: [{ id: 'day-1', templateId: 'day-1', name: 'Push', focus: 'Chest', exercises: [] }],
    }];
    renderDashboard('/workout?tab=programs&program=program-1');

    fireEvent.click(screen.getByRole('button', { name: /add a day/i }));

    await waitFor(() => {
      expect(workoutMutationsMock.createTemplate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Day 2' }));
      expect(workoutMutationsMock.updateProgram).toHaveBeenCalledWith('program-1', { templateIds: ['day-1', 'new-day-id'] });
      expect(workoutProgramsMock.loadPrograms).toHaveBeenCalled();
    });
  });
});
