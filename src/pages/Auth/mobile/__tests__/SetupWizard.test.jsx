import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../../theme/theme';
import SetupWizard from '../SetupWizard';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateProfile: vi.fn(),
  updateUnitPreference: vi.fn(),
  createTemplate: vi.fn(),
  createProgram: vi.fn(),
}));

vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => mocks.navigate }));
vi.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { uid: 'user_1', email: 'dev@example.com' } }) }));
vi.mock('../../../../contexts/UnitsContext', () => ({ useUnits: () => ({ updateUnitPreference: mocks.updateUnitPreference }) }));
vi.mock('../../../../hooks/useProfile', () => ({ useProfile: () => ({ profile: { display_name: 'Dev', preferences: { units: 'imperial', theme: 'dark' } }, updateProfile: mocks.updateProfile }) }));
vi.mock('../../../Workout/hooks/useWorkoutMutations', async () => ({
  ...(await vi.importActual('../../../Workout/hooks/useWorkoutMutations')),
  useWorkoutMutations: () => ({ createTemplate: mocks.createTemplate, updateTemplate: vi.fn(), deleteTemplate: vi.fn(), createProgram: mocks.createProgram }),
}));

const renderWizard = () => render(<ThemeProvider theme={theme}><MemoryRouter><SetupWizard /></MemoryRouter></ThemeProvider>);
const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.updateProfile.mockResolvedValue({});
  mocks.updateUnitPreference.mockResolvedValue();
  let n = 0;
  mocks.createTemplate.mockImplementation(async () => ({ id: `tpl_${++n}` }));
  mocks.createProgram.mockResolvedValue({ id: 'prog_1' });
});

describe('SetupWizard', () => {
  it('skipping every step saves only the completed flag and goes home', async () => {
    renderWizard();
    for (let i = 0; i < 5; i += 1) press('Skip for now');

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true }));
    const payload = mocks.updateProfile.mock.calls[0][0];
    expect(payload.preferences).toMatchObject({ theme: 'dark', onboarding: { completed: true, skipped: true } });
    expect(payload.preferences.units).toBe('imperial');
    expect(payload.preferences.trainingDays).toBeUndefined();
    expect(payload.preferences.firstProgram).toBeUndefined();
    expect(mocks.updateUnitPreference).not.toHaveBeenCalled();
    expect(mocks.createProgram).not.toHaveBeenCalled();
  });

  it('saves answered steps, creates the starter program once, and sets the unit', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Bodyweight', { selector: 'input' }), { target: { value: '74' } });
    press('Continue'); // units + body
    press(/Training hard already/); press('Continue'); // level
    press('5 sessions per week'); press('Wed'); press('Continue'); // target + days
    press('Continue'); // starter program (default)
    press(/^No alerts/); press('Enter the forge'); // alerts

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(mocks.createTemplate).toHaveBeenCalledTimes(3);
    expect(mocks.createProgram).toHaveBeenCalledWith(expect.objectContaining({ name: 'Beginner Foundations', templateIds: ['tpl_1', 'tpl_2', 'tpl_3'] }));
    expect(mocks.updateUnitPreference).toHaveBeenCalledWith('metric');
    const { preferences, bodyweight_kg: kg } = mocks.updateProfile.mock.calls[0][0];
    expect(kg).toBe(74);
    expect(preferences).toMatchObject({ units: 'metric', weeklyGoal: 5, trainingDays: ['Wed'], restTimerAlerts: false, firstProgram: 'prog_1', onboarding: { completed: true, skipped: false } });
    expect(preferences.profile.experienceLevel).toBe('Advanced');
  });

  it('keeps the user on the last step with a message when saving fails, without making a second program on retry', async () => {
    mocks.updateProfile.mockRejectedValueOnce(new Error('offline'));
    renderWizard();
    for (let i = 0; i < 3; i += 1) press('Continue');
    press('Continue'); // starter program
    press('Enter the forge');

    expect(await screen.findByText(/could not save that/i)).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();

    press('Enter the forge');
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.createProgram).toHaveBeenCalledTimes(1);
  });
});
