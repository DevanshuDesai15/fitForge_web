import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../theme/theme';
import StartWorkoutSheet from '../StartWorkoutSheet';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import { useWorkoutTemplates } from '../../../pages/Workout/hooks/useWorkoutTemplates';
import { useWorkoutState } from '../../../pages/Workout/hooks/useWorkoutState';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => ({ ...(await vi.importActual('react-router-dom')), useNavigate: () => navigateMock }));
vi.mock('../../../hooks/useDashboardStats', () => ({ useDashboardStats: vi.fn() }));
vi.mock('../../../pages/Workout/hooks/useWorkoutTemplates', () => ({ useWorkoutTemplates: vi.fn() }));
vi.mock('../../../pages/Workout/hooks/useWorkoutState', () => ({ useWorkoutState: vi.fn() }));

const onClose = vi.fn();
const pull = { id: 'd1', name: 'Pull Day', focus: 'Back and biceps', programId: 'p1', programName: 'PPL', exercises: [{}, {}, {}] };
const templates = [{
  id: 'p1', name: 'PPL', workoutDays: [
    { id: 'd1', name: 'Pull Day', exercises: [{}, {}, {}] },
    { id: 'd2', name: 'Leg Day', exercises: [{}, {}] },
  ],
}];

const setup = ({ stats = { nextWorkout: pull }, tpl = templates, state = {} } = {}) => {
  useDashboardStats.mockReturnValue({ data: stats, isLoading: false });
  useWorkoutTemplates.mockReturnValue({ templates: tpl, loading: false });
  useWorkoutState.mockReturnValue({ workoutStarted: false, exercises: [], currentTemplate: null, selectedDay: null, ...state });
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter><StartWorkoutSheet onClose={onClose} /></MemoryRouter>
    </ThemeProvider>
  );
};

describe('StartWorkoutSheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers today's programmed focus first and starts it with the program day state", () => {
    setup();
    expect(screen.getByText('Today · PPL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start pull day/i }));
    expect(onClose).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/workout/start', { state: expect.objectContaining({ templateId: 'p1', dayId: 'd1' }) });
  });

  it('lists the other workouts without repeating the focus and starts one', () => {
    setup();
    expect(screen.getAllByText('Pull Day')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /PPL - Leg Day/ }));
    expect(navigateMock).toHaveBeenCalledWith('/workout/start', { state: expect.objectContaining({ dayId: 'd2' }) });
  });

  it('starts an empty workout with no state', () => {
    setup({ stats: {}, tpl: [] });
    fireEvent.click(screen.getByRole('button', { name: /empty workout/i }));
    expect(navigateMock).toHaveBeenCalledWith('/workout/start', undefined);
  });

  it('puts an unfinished session first', () => {
    setup({ state: { workoutStarted: true, selectedDay: { name: 'Push Day' }, exercises: [{ sets: [{ completed: true }, { completed: false }] }] } });
    expect(screen.getByText('Unfinished session')).toBeInTheDocument();
    expect(screen.getByText('1 sets logged')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(navigateMock).toHaveBeenCalledWith('/workout/start', undefined);
  });
});
