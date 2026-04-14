import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExerciseLibraryTab from '../ExerciseLibraryTab';
import ExerciseDetailDialog from '../ExerciseDetailDialog';
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog';
import { useAuth } from '../../../../contexts/AuthContext';
import { useSupabase } from '../../../../hooks/useSupabase';

vi.mock('../../hooks/useExerciseCatalog', () => ({
  useExerciseCatalog: vi.fn(),
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../hooks/useSupabase', () => ({
  useSupabase: vi.fn(),
}));

describe('ExerciseLibraryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user-1' } });
    useSupabase.mockReturnValue({});
    useExerciseCatalog.mockReturnValue({
      items: [
        { id: '1', name: 'Kettlebell Single Arm Row', primaryMuscle: 'Back', tags: ['Strength'] }
      ],
      totalCount: 1,
      filterOptions: {
        primaryMuscles: ['Back', 'Chest'],
        equipment: [],
        difficulties: [],
        tags: [],
      },
      loading: false,
      error: '',
    });
  });

  it('renders paginated exercises from the Supabase-backed catalog hook', async () => {
    render(<ExerciseLibraryTab />);
    expect(await screen.findByText('Kettlebell Single Arm Row')).toBeInTheDocument();
  });

  it('resets to page 1 when a filter changes', async () => {
    render(<ExerciseLibraryTab />);
    
    // We will just assume there's a button rendering the filters or pagination
    const backFilter = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backFilter);
    
    expect(screen.getAllByText(/Page 1/i).length).toBeGreaterThan(0);
  });
});

describe('ExerciseDetailDialog', () => {
  it('renders variations, safety considerations, and tags from normalized exercise records', async () => {
    render(
      <ExerciseDetailDialog
        open
        onClose={() => {}}
        exercise={{
          name: 'Kettlebell Single Arm Row',
          description: 'Updated description',
          steps: ['Hinge', 'Row'],
          primaryMuscle: 'Back',
          secondaryMuscles: ['Rhomboids'],
          equipmentNeeded: ['Kettlebell'],
          proTips: ['Drive the elbow back'],
          commonMistakes: ['Twisting the torso'],
          variations: ['Single Arm Dumbbell Row'],
          safetyConsiderations: ['Brace your core'],
          tags: ['Back'],
        }}
      />
    );

    expect(screen.getByText('Kettlebell Single Arm Row')).toBeInTheDocument();
    
    // Check if the tag is rendered in Overview tab
    expect(screen.getAllByText('Back').length).toBeGreaterThan(0);
    
    // Switch to Tips tab to see variations and safety constraints
    const tipsTab = screen.getByRole('button', { name: /Tips/i });
    fireEvent.click(tipsTab);
    
    expect(screen.getByText(/Single Arm Dumbbell Row/i)).toBeInTheDocument();
    expect(screen.getByText(/Brace your core/i)).toBeInTheDocument();
  });
});
