import 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MobileDayEditor from '../MobileDayEditor';
import { useWorkoutMutations } from '../../hooks/useWorkoutMutations';
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog';
import { useCustomExercises } from '../../../../hooks/useCustomExercises';
import { useSupabase } from '../../../../hooks/useSupabase';

vi.mock('../../hooks/useWorkoutMutations', async () => {
  const actual = await vi.importActual('../../hooks/useWorkoutMutations');
  return { ...actual, useWorkoutMutations: vi.fn() };
});

vi.mock('../../hooks/useExerciseCatalog', () => ({
  useExerciseCatalog: vi.fn(),
}));

vi.mock('../../../../hooks/useCustomExercises', () => ({
  useCustomExercises: vi.fn(),
}));

vi.mock('../../../../hooks/useSupabase', () => ({
  useSupabase: vi.fn(),
}));

const program = { id: 'program-1', name: 'Push Pull Legs', category: 'Strength', difficulty: 'Intermediate', templateIds: ['tmpl-1', 'tmpl-2'] };

const day = {
  id: 'tmpl-1',
  templateId: 'tmpl-1',
  name: 'Push Day',
  focus: 'Chest, Shoulders',
  exercises: [
    { id: 'ex-1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: [{ setNumber: 1, reps: '10' }] },
  ],
};

describe('MobileDayEditor', () => {
  const updateTemplate = vi.fn().mockResolvedValue({});
  const updateProgram = vi.fn().mockResolvedValue({});
  const deleteTemplate = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkoutMutations.mockReturnValue({ updateTemplate, updateProgram, deleteTemplate });
    useSupabase.mockReturnValue({});
    useCustomExercises.mockReturnValue({ customExercises: [] });
    useExerciseCatalog.mockReturnValue({ items: [{ id: 'cat-1', name: 'Incline Press', primaryMuscle: 'Chest', equipmentNeeded: ['Dumbbell'] }], filterOptions: { primaryMuscles: [] }, loading: false, error: '' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders the day name, focus, and existing exercises', () => {
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    expect(screen.getByDisplayValue('Push Day')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chest, Shoulders')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('debounce-saves a day name change via updateTemplate', async () => {
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Day name'), { target: { value: 'Push Day A' } });

    expect(updateTemplate).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalledWith('tmpl-1', expect.objectContaining({ name: 'Push Day A' }));
    }, { timeout: 1000 });
  });

  it('removes an exercise and persists immediately', async () => {
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Bench Press' }));

    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalledWith('tmpl-1', expect.objectContaining({ exercises: [] }));
    });
  });

  it('adds a set to an exercise', async () => {
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add set' }));

    expect(screen.getByLabelText('Set 2 reps')).toBeInTheDocument();
    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalledWith('tmpl-1', expect.objectContaining({
        exercises: [expect.objectContaining({ sets: [{ setNumber: 1, reps: '10' }, { setNumber: 2, reps: '10' }] })],
      }));
    });
  });

  it('opens the exercise picker and adds a new exercise from the catalog', async () => {
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add exercise' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Incline Press' }));

    expect(screen.getByText('Incline Press')).toBeInTheDocument();
    await waitFor(() => {
      expect(updateTemplate).toHaveBeenCalledWith('tmpl-1', expect.objectContaining({
        exercises: expect.arrayContaining([expect.objectContaining({ name: 'Incline Press' })]),
      }));
    });
  });

  it('deletes the day after confirmation: removes it from the program and deletes the template', async () => {
    const onDeleted = vi.fn();
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete day' }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(updateProgram).toHaveBeenCalledWith('program-1', { templateIds: ['tmpl-2'] });
      expect(deleteTemplate).toHaveBeenCalledWith('tmpl-1');
      expect(onDeleted).toHaveBeenCalledOnce();
    });
  });

  it('does not delete when the confirmation is declined', () => {
    window.confirm.mockReturnValue(false);
    render(<MobileDayEditor program={program} day={day} onBack={vi.fn()} onDeleted={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete day' }));

    expect(updateProgram).not.toHaveBeenCalled();
    expect(deleteTemplate).not.toHaveBeenCalled();
  });
});
