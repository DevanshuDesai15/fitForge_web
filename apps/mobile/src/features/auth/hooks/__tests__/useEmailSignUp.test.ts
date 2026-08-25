import { describe, expect, it, vi } from 'vitest';
import { createEmailSignUpController } from '../useEmailSignUp';

function future() { return { status: 'missing_requirements', password: vi.fn().mockResolvedValue({ error: null }), update: vi.fn().mockResolvedValue({ error: null }), verifications: { sendEmailCode: vi.fn().mockResolvedValue({ error: null }), verifyEmailCode: vi.fn().mockResolvedValue({ error: null }) }, finalize: vi.fn().mockResolvedValue(undefined) }; }

describe('email sign-up controller', () => {
  it('creates a password account, records the name, and sends a code', async () => {
    const signUp = future(); const controller = createEmailSignUpController(signUp);
    await controller.start({ email: ' Devanshu@Example.com ', password: 'secret123', firstName: ' Devanshu ', lastName: ' Desai ' });
    expect(signUp.password).toHaveBeenCalledWith({ emailAddress: 'devanshu@example.com', password: 'secret123' });
    expect(signUp.update).toHaveBeenCalledWith({ firstName: 'Devanshu', lastName: 'Desai' });
    expect(signUp.verifications.sendEmailCode).toHaveBeenCalledOnce();
  });

  it('verifies and finalizes the account', async () => {
    const signUp = future(); signUp.status = 'complete';
    await createEmailSignUpController(signUp).verifyCode('123456');
    expect(signUp.verifications.verifyEmailCode).toHaveBeenCalledWith({ code: '123456' });
    expect(signUp.finalize).toHaveBeenCalledOnce();
  });

  it('throws Clerk field errors unchanged', async () => {
    const response = { errors: [{ code: 'form_password_pwned', longMessage: 'Choose another password.' }] };
    const signUp = future(); signUp.password.mockResolvedValue({ error: response });
    await expect(createEmailSignUpController(signUp).start({ email: 'd@example.com', password: 'bad', firstName: 'D', lastName: '' })).rejects.toBe(response);
  });
});
