import 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MobileExerciseDetail from '../MobileExerciseDetail';
import { useAuth } from '../../../../contexts/AuthContext';
import { useWorkoutReader } from '../../../../hooks/useWorkouts';

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../hooks/useWorkouts', () => ({
  useWorkoutReader: vi.fn(),
}));

const sparseExercise = { name: 'My Custom Curl', isCustom: true };

const richExercise = {
  name: 'Barbell Bench Press',
  description: 'A compound chest press.',
  primaryMuscle: 'Chest',
  secondaryMuscles: ['Triceps'],
  equipmentNeeded: ['Barbell'],
  steps: ['Lie on the bench', 'Lower the bar', 'Press up'],
  proTips: ['Keep your shoulder blades pinned'],
  commonMistakes: ['Flaring elbows too wide'],
};

describe('MobileExerciseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user-1' } });
    useWorkoutReader.mockReturnValue(vi.fn().mockResolvedValue([]));
  });

  it('shows only Overview and a sparse-data notice for an exercise with no catalog content', async () => {
    render(<MobileExerciseDetail exercise={sparseExercise} onBack={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'My Custom Curl' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(await screen.findByText(/custom exercises never have them/i)).toBeInTheDocument();
  });

  it('renders Steps and Tips tabs only when the exercise has that content', async () => {
    render(<MobileExerciseDetail exercise={richExercise} onBack={vi.fn()} />);

    expect(await screen.findByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Steps' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tips' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Demo' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Steps' }));
    expect(screen.getByText('Lower the bar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Tips' }));
    expect(screen.getByText('Keep your shoulder blades pinned')).toBeInTheDocument();
    expect(screen.getByText('Flaring elbows too wide')).toBeInTheDocument();
  });

  it('calls onBack when the back button is pressed', async () => {
    const onBack = vi.fn();
    render(<MobileExerciseDetail exercise={richExercise} onBack={onBack} />);

    await screen.findByText(/haven't logged this one yet/i);

    fireEvent.click(screen.getByRole('button', { name: 'Back to library' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows an empty-history message when there are no logged sessions', async () => {
    render(<MobileExerciseDetail exercise={richExercise} onBack={vi.fn()} />);

    expect(await screen.findByText(/haven't logged this one yet/i)).toBeInTheDocument();
  });

  it('lists recent sessions with the heaviest weight tagged as a PR', async () => {
    useWorkoutReader.mockReturnValue(vi.fn().mockResolvedValue([
      {
        timestamp: '2026-08-20T00:00:00Z',
        exercises: [{ name: 'Barbell Bench Press', sets: [{ reps: '8', weight: '185', weightUnit: 'lbs', completed: true }] }],
      },
      {
        timestamp: '2026-08-13T00:00:00Z',
        exercises: [{ name: 'Barbell Bench Press', sets: [{ reps: '8', weight: '175', weightUnit: 'lbs', completed: true }] }],
      },
    ]));

    render(<MobileExerciseDetail exercise={richExercise} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/185lbs/)).toBeInTheDocument();
    });
    expect(screen.getByText('PR')).toBeInTheDocument();
  });
});
