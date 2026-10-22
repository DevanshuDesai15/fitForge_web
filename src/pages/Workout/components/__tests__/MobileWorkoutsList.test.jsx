import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MobileWorkoutsList from '../MobileWorkoutsList';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { useWorkoutMutations } from '../../hooks/useWorkoutMutations';
import { useWorkoutState } from '../../hooks/useWorkoutState';

vi.mock('../../hooks/useWorkoutTemplates', () => ({
  useWorkoutTemplates: vi.fn(),
}));

vi.mock('../../hooks/useWorkoutMutations', () => ({
  useWorkoutMutations: vi.fn(),
}));

vi.mock('../../hooks/useWorkoutState', () => ({
  useWorkoutState: vi.fn(),
}));

const idleWorkoutState = {
  workoutStarted: false,
  exercises: [],
  currentTemplate: null,
  selectedDay: null,
  clearWorkoutState: vi.fn(),
};

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current location">{`${location.pathname}${JSON.stringify(location.state || {})}`}</output>;
}

const renderList = () => render(
  <MemoryRouter initialEntries={['/workout']}>
    <Routes>
      <Route path="/workout" element={<><MobileWorkoutsList /><LocationDisplay /></>} />
      <Route path="/workout/start" element={<LocationDisplay />} />
    </Routes>
  </MemoryRouter>
);

describe('MobileWorkoutsList', () => {
  const deleteTemplate = vi.fn();
  const loadTemplates = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkoutMutations.mockReturnValue({ deleteTemplate, loadTemplates });
    useWorkoutState.mockReturnValue({ ...idleWorkoutState });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders a flat list of workout day cards from templates', () => {
    useWorkoutTemplates.mockReturnValue({
      templates: [{
        id: 'tmpl-1',
        name: 'Push Pull Legs',
        workoutDays: [
          { id: 'day-1', name: 'Push Day', exercises: [{ name: 'Bench Press' }, { name: 'OHP' }], difficulty: 'Intermediate' },
        ],
      }],
      loading: false,
      loadTemplates,
    });

    renderList();

    expect(screen.getByText('Push Pull Legs - Push Day')).toBeInTheDocument();
    expect(screen.getByText('2 exercises')).toBeInTheDocument();
  });

  it('shows an empty state when there are no templates and no ongoing workout', () => {
    useWorkoutTemplates.mockReturnValue({ templates: [], loading: false, loadTemplates });

    renderList();

    expect(screen.getByText('No workouts yet')).toBeInTheDocument();
  });

  it('shows a loading state while templates load', () => {
    useWorkoutTemplates.mockReturnValue({ templates: [], loading: true, loadTemplates });

    renderList();

    expect(screen.getByLabelText('Loading workouts')).toBeInTheDocument();
  });

  it('navigates to /workout/start with the built session state when a card is tapped', () => {
    useWorkoutTemplates.mockReturnValue({
      templates: [{
        id: 'tmpl-1',
        name: 'Push Pull Legs',
        workoutDays: [{ id: 'day-1', name: 'Push Day', exercises: [{ name: 'Bench Press' }] }],
      }],
      loading: false,
      loadTemplates,
    });

    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Start Push Pull Legs - Push Day' }));

    expect(screen.getByLabelText('Current location')).toHaveTextContent('/workout/start');
  });

  it('deletes a workout template after confirmation without starting it', async () => {
    useWorkoutTemplates.mockReturnValue({
      templates: [{
        id: 'tmpl-1',
        name: 'Push Pull Legs',
        workoutDays: [{ id: 'day-1', name: 'Push Day', exercises: [] }],
      }],
      loading: false,
      loadTemplates,
    });

    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Push Pull Legs - Push Day' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteTemplate).toHaveBeenCalled();
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/workout{}');
  });

  it('shows an unfinished-session card and resumes into the current session', () => {
    useWorkoutTemplates.mockReturnValue({ templates: [], loading: false, loadTemplates });
    useWorkoutState.mockReturnValue({
      workoutStarted: true,
      exercises: [{ sets: [{ completed: true }, { completed: false }] }],
      currentTemplate: { name: 'Push Day' },
      selectedDay: null,
      clearWorkoutState: vi.fn(),
    });

    renderList();

    expect(screen.getByText('Unfinished session')).toBeInTheDocument();
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('1 sets logged')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByLabelText('Current location')).toHaveTextContent('/workout/start');
  });

  it('discards the unfinished session after confirmation', () => {
    useWorkoutTemplates.mockReturnValue({ templates: [], loading: false, loadTemplates });
    const clearWorkoutState = vi.fn();
    useWorkoutState.mockReturnValue({
      workoutStarted: true,
      exercises: [{ sets: [] }],
      currentTemplate: { name: 'Push Day' },
      selectedDay: null,
      clearWorkoutState,
    });

    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(clearWorkoutState).toHaveBeenCalled();
  });
});
