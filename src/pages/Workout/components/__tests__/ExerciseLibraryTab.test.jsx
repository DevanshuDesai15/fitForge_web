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

vi.mock('../../../../utils/weightUnit', () => ({
  getWeightUnit: vi.fn(() => 'kg'),
}));

const createSupabaseMock = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
});

describe('ExerciseLibraryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user-1' } });
    useSupabase.mockReturnValue(createSupabaseMock());
    useExerciseCatalog.mockImplementation(({ filters }) => {
      const pageItems = filters.page === 2
        ? [{ id: '2', name: 'Barbell Bench Press', primaryMuscle: 'Chest', tags: ['Strength'] }]
        : [{ id: '1', name: 'Kettlebell Single Arm Row', primaryMuscle: 'Back', tags: ['Strength'] }];

      return {
        items: pageItems,
        totalCount: 25,
        filterOptions: {
          primaryMuscles: ['Back', 'Chest'],
          equipment: [],
          difficulties: [],
          tags: [],
        },
        loading: false,
        error: '',
      };
    });
  });

  it('renders paginated exercises from the Supabase-backed catalog hook', async () => {
    render(<ExerciseLibraryTab />);
    expect(await screen.findByText('Kettlebell Single Arm Row')).toBeInTheDocument();
  });

  it('moves to the next page when pagination is clicked', async () => {
    render(<ExerciseLibraryTab />);

    expect(await screen.findByText('Kettlebell Single Arm Row')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.getByText(/^Page 2$/i)).toBeInTheDocument();
  });

  it('renders pagination controls before the performance insights section', async () => {
    render(<ExerciseLibraryTab />);

    const paginationLabel = await screen.findByText(/^Page 1$/i);
    const performanceInsightsHeading = screen.getByText(/Performance Insights/i);

    expect(
      paginationLabel.compareDocumentPosition(performanceInsightsHeading)
        & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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
