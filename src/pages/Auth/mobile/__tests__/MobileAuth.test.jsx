import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '../../../../theme/theme';
import MobileAuth from '../MobileAuth';

const clerk = vi.hoisted(() => ({
  signIn: {},
  signUp: {},
  setActive: vi.fn(),
}));

vi.mock('@clerk/clerk-react', () => ({
  useSignIn: () => ({ isLoaded: true, signIn: clerk.signIn, setActive: clerk.setActive }),
  useSignUp: () => ({ isLoaded: true, signUp: clerk.signUp, setActive: clerk.setActive }),
}));

const renderAuth = (start) => render(
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={['/auth']}>
      <Routes>
        <Route path="/auth" element={<MobileAuth start={start} />} />
        <Route path="/" element={<div>landing page</div>} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>,
);
const type = (label, value) => fireEvent.change(screen.getByLabelText(label, { selector: 'input' }), { target: { value } });
const clerkError = (code, meta) => ({ errors: [{ code, meta }] });

beforeEach(() => {
  clerk.setActive.mockReset();
  clerk.signIn = { create: vi.fn(), prepareFirstFactor: vi.fn(), attemptFirstFactor: vi.fn(), prepareSecondFactor: vi.fn(), attemptSecondFactor: vi.fn(), resetPassword: vi.fn(), authenticateWithRedirect: vi.fn() };
  clerk.signUp = { create: vi.fn(), prepareEmailAddressVerification: vi.fn(), attemptEmailAddressVerification: vi.fn() };
});

describe('MobileAuth sign in', () => {
  it('signs in with email and password and activates the session', async () => {
    clerk.signIn.create.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' });
    renderAuth('signin');
    type('Email', 'dev@example.com');
    type('Password', 'benchpress25');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(clerk.setActive).toHaveBeenCalledWith({ session: 'sess_1' }));
    expect(clerk.signIn.create).toHaveBeenCalledWith({ identifier: 'dev@example.com', password: 'benchpress25' });
  });

  it('puts a wrong password on the password field and clears it', async () => {
    clerk.signIn.create.mockRejectedValue(clerkError('form_password_incorrect'));
    renderAuth('signin');
    type('Email', 'dev@example.com');
    type('Password', 'nope');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText("That password doesn't match.")).toBeInTheDocument();
    expect(screen.getByLabelText('Password', { selector: 'input' })).toHaveValue('');
    expect(clerk.setActive).not.toHaveBeenCalled();
  });

  it('shows the lockout countdown when Clerk freezes the account', async () => {
    clerk.signIn.create.mockRejectedValue(clerkError('user_locked', { lockout_expires_in_seconds: 125 }));
    renderAuth('signin');
    type('Email', 'dev@example.com');
    type('Password', 'x');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Too many misses. Cooling off.')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again in 2:05/i })).toBeDisabled();
  });

  it('emails a code instead of using the password', async () => {
    clerk.signIn.create.mockResolvedValue({ supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'idn_1' }] });
    clerk.signIn.attemptFirstFactor.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_2' });
    renderAuth('signin');
    type('Email', 'dev@example.com');
    fireEvent.click(screen.getByRole('button', { name: /email me a code instead/i }));

    await screen.findByText("Six digits and you're in.");
    expect(clerk.signIn.prepareFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', emailAddressId: 'idn_1' });
    fireEvent.change(screen.getByLabelText('Digit 1'), { target: { value: '123456' } });
    await waitFor(() => expect(clerk.signIn.attemptFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', code: '123456' }));
    await waitFor(() => expect(clerk.setActive).toHaveBeenCalledWith({ session: 'sess_2' }));
  });
});

describe('MobileAuth sign up', () => {
  it('creates the account, verifies the emailed code, then activates the session', async () => {
    clerk.signUp.create.mockResolvedValue({});
    clerk.signUp.attemptEmailAddressVerification.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_3' });
    renderAuth('signup');
    type('Name', 'Devanshu');
    type('Email', 'dev@example.com');
    type('Password', 'benchpress25');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('Confirm your email.');
    expect(clerk.signUp.create).toHaveBeenCalledWith({ emailAddress: 'dev@example.com', password: 'benchpress25', firstName: 'Devanshu' });
    expect(clerk.signUp.prepareEmailAddressVerification).toHaveBeenCalledWith({ strategy: 'email_code' });

    fireEvent.change(screen.getByLabelText('Digit 1'), { target: { value: '654321' } });
    await waitFor(() => expect(clerk.setActive).toHaveBeenCalledWith({ session: 'sess_3' }));
  });

  it('validates before calling Clerk and flags an email that already has an account', async () => {
    renderAuth('signup');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('We need something to call you.')).toBeInTheDocument();
    expect(clerk.signUp.create).not.toHaveBeenCalled();

    clerk.signUp.create.mockRejectedValue(clerkError('form_identifier_exists'));
    type('Name', 'Dev');
    type('Email', 'dev@example.com');
    type('Password', 'benchpress25');
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/already has an account/i)).toBeInTheDocument();
  });
});

describe('MobileAuth password reset', () => {
  it('sends a code, accepts it, sets a new password and signs in', async () => {
    clerk.signIn.create.mockResolvedValue({});
    clerk.signIn.attemptFirstFactor.mockResolvedValue({ status: 'needs_new_password' });
    clerk.signIn.resetPassword.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_4' });
    renderAuth('signin');
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    type('Email', 'dev@example.com');
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await screen.findByText('Check your email.');
    expect(clerk.signIn.create).toHaveBeenCalledWith({ strategy: 'reset_password_email_code', identifier: 'dev@example.com' });
    fireEvent.change(screen.getByLabelText('Digit 1'), { target: { value: '111222' } });

    await screen.findByText('Set a new one.');
    type('New password', 'newbench99');
    type('Confirm password', 'newbench99');
    fireEvent.click(screen.getByRole('button', { name: /save and sign in/i }));
    await waitFor(() => expect(clerk.setActive).toHaveBeenCalledWith({ session: 'sess_4' }));
    expect(clerk.signIn.resetPassword).toHaveBeenCalledWith({ password: 'newbench99', signOutOfOtherSessions: true });
  });
});

describe('Welcome carousel', () => {
  it('moves through the cards and into sign up', () => {
    renderAuth('welcome');
    expect(screen.getByText('Every set. On the record.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Card 3' }));
    expect(screen.getByText('Proof, not vibes.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create your account' }));
    expect(screen.getByText('Start forging.')).toBeInTheDocument();
  });
});

describe('Back arrow', () => {
  it('returns to the landing page when sign in was opened from it', () => {
    renderAuth('signin');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('landing page')).toBeInTheDocument();
  });

  it('returns to the carousel when sign up was opened from it', () => {
    renderAuth('welcome');
    fireEvent.click(screen.getByRole('button', { name: 'Create your account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Every set. On the record.')).toBeInTheDocument();
  });
});
