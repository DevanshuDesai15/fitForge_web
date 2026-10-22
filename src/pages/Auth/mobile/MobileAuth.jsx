import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import useOnlineStatus from '../../../hooks/useOnlineStatus';
import { parseClerkError } from './clerkErrors';
import { CodeScreen, ForgotScreen, LockedScreen, ResetPasswordScreen, SignInScreen, SignUpScreen, WelcomeCarousel } from './authScreens';

const SSO_CALLBACK = '/sso-callback';

// The kit's auth screens on top of Clerk's custom-flow hooks. Clerk stays the engine (accounts, passwords,
// codes, Google, sessions); this only decides which screen is showing and what to ask Clerk for.
//
//   welcome → signup → code(verify) → app          welcome → signin → app
//                                                   signin → code(signin) → app   (email me a code)
//   signin → forgot → code(reset) → reset → app     any → locked (Clerk says the account is frozen)
export default function MobileAuth({ start = 'welcome' }) {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const [step, setStep] = useState(start);
  const [ctx, setCtx] = useState({ purpose: 'signin', target: '', factor: null });
  const [lockSeconds, setLockSeconds] = useState(300);

  if (!signInLoaded || !signUpLoaded) return null;

  const finish = async (result) => {
    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
      return;
    }
    throw { errors: [{ code: 'unsupported_step', message: 'This account needs a sign-in step this app cannot do yet. Use the web sign-in.' }] };
  };

  // Clerk reports a frozen account as an error; every screen funnels it to the countdown.
  const guard = (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const parsed = parseClerkError(error);
      if (parsed.code === 'user_locked') {
        setLockSeconds(parsed.lockoutSeconds);
        setStep('locked');
        return undefined;
      }
      throw error;
    }
  };

  const google = () => signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: SSO_CALLBACK, redirectUrlComplete: '/' });

  const sendEmailCode = async (email) => {
    const attempt = await signIn.create({ identifier: email });
    const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
    if (!factor) throw { errors: [{ code: 'strategy_for_user_invalid' }] };
    await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    setCtx({ purpose: 'signin', target: email, factor: 'first' });
    setStep('code');
  };

  const signInWithPassword = guard(async ({ email, password }) => {
    const result = await signIn.create({ identifier: email, password });
    if (result.status === 'needs_second_factor' || result.status === 'needs_client_trust') {
      const second = result.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
      if (!second) return finish(result);
      await signIn.prepareSecondFactor({ strategy: 'email_code' });
      setCtx({ purpose: 'signin', target: email, factor: 'second' });
      setStep('code');
      return undefined;
    }
    return finish(result);
  });

  const createAccount = guard(async ({ name, email, password }) => {
    await signUp.create({ emailAddress: email, password, firstName: name });
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setCtx({ purpose: 'verify', target: email, factor: null });
    setStep('code');
  });

  const sendResetCode = guard(async (email) => {
    await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
    setCtx({ purpose: 'reset', target: email, factor: null });
    setStep('code');
  });

  const verifyCode = guard(async (code) => {
    if (ctx.purpose === 'verify') return finish(await signUp.attemptEmailAddressVerification({ code }));
    if (ctx.purpose === 'reset') {
      const result = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code });
      if (result.status === 'needs_new_password') { setStep('reset'); return undefined; }
      return finish(result);
    }
    if (ctx.factor === 'second') return finish(await signIn.attemptSecondFactor({ strategy: 'email_code', code }));
    return finish(await signIn.attemptFirstFactor({ strategy: 'email_code', code }));
  });

  const resendCode = async () => {
    if (ctx.purpose === 'verify') return signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    if (ctx.purpose === 'reset') return signIn.create({ strategy: 'reset_password_email_code', identifier: ctx.target });
    if (ctx.factor === 'second') return signIn.prepareSecondFactor({ strategy: 'email_code' });
    const factor = signIn.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
    return signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor?.emailAddressId });
  };

  const savePassword = guard(async (password) => finish(await signIn.resetPassword({ password, signOutOfOtherSessions: true })));

  const offline = !online;
  // Sign in / sign up reached from the carousel go back to it; reached from the landing page they go back there.
  const leave = () => (start === 'welcome' ? setStep('welcome') : navigate('/'));
  if (step === 'signup') return <SignUpScreen offline={offline} onBack={leave} onSignIn={() => setStep('signin')} onGoogle={google} onSubmit={createAccount} />;
  if (step === 'signin') return <SignInScreen offline={offline} onBack={leave} onSignUp={() => setStep('signup')} onGoogle={google} onSubmit={signInWithPassword} onEmailCode={guard(sendEmailCode)} onForgot={() => setStep('forgot')} />;
  if (step === 'code') return <CodeScreen offline={offline} purpose={ctx.purpose} target={ctx.target} onBack={() => setStep(ctx.purpose === 'verify' ? 'signup' : ctx.purpose === 'reset' ? 'forgot' : 'signin')} onVerify={verifyCode} onResend={resendCode} />;
  if (step === 'forgot') return <ForgotScreen offline={offline} onBack={() => setStep('signin')} onSubmit={sendResetCode} />;
  if (step === 'reset') return <ResetPasswordScreen onBack={() => setStep('signin')} onSubmit={savePassword} />;
  if (step === 'locked') return <LockedScreen seconds={lockSeconds} onBack={() => setStep('signin')} onForgot={() => setStep('forgot')} />;
  return <WelcomeCarousel onSignUp={() => setStep('signup')} onSignIn={() => setStep('signin')} />;
}

MobileAuth.propTypes = { start: PropTypes.oneOf(['welcome', 'signin', 'signup']) };
