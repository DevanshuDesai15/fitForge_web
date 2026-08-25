import { describe, expect, it, vi } from 'vitest';
import { createGoogleAuthController, googleRedirectUri } from '../useGoogleAuth';

describe('Google authentication', () => {
  it('uses the registered FitForge OAuth callback', () => {
    const makeRedirectUri = vi.fn().mockReturnValue('fitforge://oauth-callback');
    expect(googleRedirectUri(makeRedirectUri)).toBe('fitforge://oauth-callback');
    expect(makeRedirectUri).toHaveBeenCalledWith({ scheme: 'fitforge', path: 'oauth-callback' });
  });

  it('activates a successfully created Clerk session', async () => {
    const setActive = vi.fn().mockResolvedValue(undefined);
    const startSSOFlow = vi.fn().mockResolvedValue({ createdSessionId: 'sess_123', setActive });
    await expect(createGoogleAuthController(startSSOFlow, () => 'fitforge://oauth-callback')()).resolves.toBe('complete');
    expect(startSSOFlow).toHaveBeenCalledWith({ strategy: 'oauth_google', redirectUrl: 'fitforge://oauth-callback' });
    expect(setActive).toHaveBeenCalledWith({ session: 'sess_123' });
  });

  it('reports missing requirements without creating a fake session', async () => {
    const startSSOFlow = vi.fn().mockResolvedValue({ createdSessionId: null, setActive: vi.fn(), signIn: { status: 'needs_second_factor' } });
    await expect(createGoogleAuthController(startSSOFlow, () => 'fitforge://oauth-callback')()).resolves.toBe('incomplete');
  });

  it('treats provider cancellation as cancellation rather than an auth failure', async () => {
    const startSSOFlow = vi.fn().mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
    await expect(createGoogleAuthController(startSSOFlow, () => 'fitforge://oauth-callback')()).resolves.toBe('cancelled');
  });
});
