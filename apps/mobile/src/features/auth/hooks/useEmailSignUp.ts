import { useSignUp } from '@clerk/expo';
import { normalizeEmail } from '../model/auth-errors';

type Result = { error?: unknown };
type SignUpFuture = {
  status: string | null;
  password(input: { emailAddress: string; password: string }): Promise<Result>;
  update(input: { firstName: string; lastName?: string }): Promise<Result>;
  verifications: { sendEmailCode(): Promise<Result>; verifyEmailCode(input: { code: string }): Promise<Result> };
  finalize(): Promise<unknown>;
};
const requireSuccess = (result: Result) => { if (result.error) throw result.error; };

export function createEmailSignUpController(signUp: SignUpFuture) {
  return {
    async start({ email, password, firstName, lastName }: { email: string; password: string; firstName: string; lastName: string }) { requireSuccess(await signUp.password({ emailAddress: normalizeEmail(email), password })); const cleanLastName = lastName.trim(); requireSuccess(await signUp.update({ firstName: firstName.trim(), ...(cleanLastName ? { lastName: cleanLastName } : {}) })); requireSuccess(await signUp.verifications.sendEmailCode()); return 'verification' as const; },
    async verifyCode(code: string) { requireSuccess(await signUp.verifications.verifyEmailCode({ code })); if (signUp.status === 'complete') { await signUp.finalize(); return 'complete' as const; } return 'incomplete' as const; },
    async resendCode() { requireSuccess(await signUp.verifications.sendEmailCode()); },
  };
}

export function useEmailSignUp() { const state = useSignUp(); return { ...state, controller: state.signUp ? createEmailSignUpController(state.signUp as unknown as SignUpFuture) : null }; }
