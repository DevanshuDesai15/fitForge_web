import { describe, expect, it, vi } from 'vitest';
import { createEmailSignInController } from '../useEmailSignIn';

function future(status = 'complete') {
  return { status, password: vi.fn().mockResolvedValue({ error: null }), create: vi.fn().mockResolvedValue({ error: null }), emailCode: { sendCode: vi.fn().mockResolvedValue({ error: null }), verifyCode: vi.fn().mockResolvedValue({ error: null }) }, mfa: { sendEmailCode: vi.fn().mockResolvedValue({ error: null }), verifyEmailCode: vi.fn().mockResolvedValue({ error: null }) }, supportedSecondFactors: [{ strategy: 'email_code' }], finalize: vi.fn().mockResolvedValue(undefined) };
}

describe('email sign-in controller', () => {
  it('signs in with a normalized email and password then finalizes', async () => {
    const signIn = future(); const controller = createEmailSignInController(signIn);
    await expect(controller.password(' Devanshu@Example.com ', 'secret')).resolves.toBe('complete');
    expect(signIn.password).toHaveBeenCalledWith({ emailAddress: 'devanshu@example.com', password: 'secret' });
    expect(signIn.finalize).toHaveBeenCalledOnce();
  });

  it('sends and verifies an email code', async () => {
    const signIn = future('needs_first_factor'); const controller = createEmailSignInController(signIn);
    await expect(controller.sendCode('devanshu@example.com')).resolves.toBe('verification');
    expect(signIn.create).toHaveBeenCalledWith({ identifier: 'devanshu@example.com' });
    expect(signIn.emailCode.sendCode).toHaveBeenCalledWith({ emailAddress: 'devanshu@example.com' });
    signIn.status = 'complete';
    await controller.verifyCode('123456');
    expect(signIn.emailCode.verifyCode).toHaveBeenCalledWith({ code: '123456' });
    expect(signIn.finalize).toHaveBeenCalledOnce();
  });

  it('requests Clerk device-trust verification when password sign-in requires it', async () => {
    const signIn = future('needs_client_trust'); const controller = createEmailSignInController(signIn);
    await expect(controller.password('d@example.com', 'secret')).resolves.toBe('device-trust');
    expect(signIn.mfa.sendEmailCode).toHaveBeenCalledOnce();
  });

  it('throws the exact Clerk response for presentation', async () => {
    const response = { errors: [{ code: 'too_many_requests', message: 'Try again later.' }] };
    const signIn = future(); signIn.password.mockResolvedValue({ error: response });
    await expect(createEmailSignInController(signIn).password('d@example.com', 'bad')).rejects.toBe(response);
  });
});
