import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Progress from './Progress';

vi.mock('recharts', () => ({
    LineChart: ({ children }) => <div>{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../contexts/UnitsContext', () => ({
    useUnits: () => ({ weightUnit: 'lbs' }),
}));

vi.mock('./hooks/useProgressData', () => ({
    useProgressData: () => ({
        exercises: [],
        goals: [],
        loading: false,
        error: '',
        progressData: {},
        personalRecords: [],
        availableExercises: [],
        loadGoals: vi.fn(),
        setError: vi.fn(),
    }),
}));

vi.mock('./hooks/useAIInsights', () => ({
    useAIInsights: () => ({
        aiInsights: [],
        progressionAnalyses: [],
        loadAIInsights: vi.fn(),
    }),
}));

vi.mock('./hooks/usePlateauDetection', () => ({
    usePlateauDetection: () => ({
        plateauAlerts: [],
        appliedInterventions: [],
        dismissedAlerts: [],
        loadPlateauAlerts: vi.fn(),
        handleInterventionApply: vi.fn(),
        handleAlertDismiss: vi.fn(),
    }),
}));

describe('Progress navigation', () => {
    it('constrains the tabs to the page width so they cannot overflow the viewport', () => {
        render(<Progress />);

        const navigation = screen.getByRole('tablist', { name: 'Progress sections' });
        expect(navigation).toHaveStyle({
            display: 'flex',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
        });

        screen.getAllByRole('tab').forEach((tab) => {
            expect(tab).toHaveStyle({ minWidth: '0', flex: '1 1 0' });
        });
    });
});
