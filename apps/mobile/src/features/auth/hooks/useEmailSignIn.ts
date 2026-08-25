import { useSignIn } from '@clerk/expo';
import { normalizeEmail } from '../model/auth-errors';

type Result = { error?: unknown };
type SignInFuture = {
  status: string | null;
  supportedSecondFactors?: { strategy: string }[];
  password(input: { emailAddress: string; password: string }): Promise<Result>;
  create(input: { identifier: string }): Promise<Result>;
  emailCode: { sendCode(input: { emailAddress: string }): Promise<Result>; verifyCode(input: { code: string }): Promise<Result> };
  mfa: { sendEmailCode(): Promise<Result>; verifyEmailCode(input: { code: string }): Promise<Result> };
  finalize(): Promise<unknown>;
};

const requireSuccess = (result: Result) => { if (result.error) throw result.error; };
export function createEmailSignInController(signIn: SignInFuture) {
  const finalizeIfComplete = async () => { if (signIn.status === 'complete') { await signIn.finalize(); return 'complete' as const; } return null; };
  return {
    async password(email: string, password: string) {
      requireSuccess(await signIn.password({ emailAddress: normalizeEmail(email), password }));
      const complete = await finalizeIfComplete(); if (complete) return complete;
      if (signIn.status === 'needs_client_trust' && signIn.supportedSecondFactors?.some((factor) => factor.strategy === 'email_code')) { requireSuccess(await signIn.mfa.sendEmailCode()); return 'device-trust' as const; }
      return 'incomplete' as const;
    },
    async sendCode(email: string) { const normalized = normalizeEmail(email); requireSuccess(await signIn.create({ identifier: normalized })); requireSuccess(await signIn.emailCode.sendCode({ emailAddress: normalized })); return 'verification' as const; },
    async verifyCode(code: string) { requireSuccess(await signIn.emailCode.verifyCode({ code })); return (await finalizeIfComplete()) ?? 'incomplete' as const; },
    async verifyDeviceTrust(code: string) { requireSuccess(await signIn.mfa.verifyEmailCode({ code })); return (await finalizeIfComplete()) ?? 'incomplete' as const; },
    async resendCode(mode: 'email-code' | 'device-trust', email?: string) { if (mode === 'device-trust') requireSuccess(await signIn.mfa.sendEmailCode()); else if (email) requireSuccess(await signIn.emailCode.sendCode({ emailAddress: normalizeEmail(email) })); },
  };
}

export function useEmailSignIn() {
  const state = useSignIn();
  return { ...state, controller: state.signIn ? createEmailSignInController(state.signIn as unknown as SignInFuture) : null };
}
