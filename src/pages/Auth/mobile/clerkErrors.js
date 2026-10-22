// Clerk reports failures as { errors: [{ code, message, longMessage, meta }] }. These turn them into the
// short coach-voiced lines the screens show, and pull out the lockout countdown when Clerk locks an account.
const MESSAGES = {
  form_identifier_not_found: "We can't find an account with that email.",
  form_password_incorrect: "That password doesn't match.",
  form_password_pwned: 'That password has leaked in a breach. Pick a different one.',
  form_password_length_too_short: 'Eight characters minimum.',
  form_password_not_strong_enough: 'That password is too easy to guess. Add length or a number.',
  form_identifier_exists: 'That email already has an account. Sign in instead.',
  form_code_incorrect: 'Wrong code. Check it and try again.',
  verification_expired: 'That code expired. Send a new one.',
  verification_failed: 'We could not verify that. Send a new code.',
  too_many_requests: 'Too many tries. Give it a minute, then try again.',
  session_exists: "You're already signed in.",
  strategy_for_user_invalid: 'That sign-in method is not set up for this account.',
  client_state_invalid: 'That took too long. Start again.',
};

export const DEFAULT_LOCKOUT_SECONDS = 300;

export function parseClerkError(error) {
  const first = error?.errors?.[0];
  if (!first) {
    return { code: 'unknown', message: 'Something went wrong. Check your connection and try again.', lockoutSeconds: null };
  }
  const code = first.code || 'unknown';
  if (code === 'user_locked') {
    const seconds = Number(first.meta?.lockout_expires_in_seconds);
    return {
      code,
      message: 'Too many wrong attempts. Sign-in is frozen for a few minutes.',
      lockoutSeconds: Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_LOCKOUT_SECONDS,
    };
  }
  return { code, message: MESSAGES[code] || first.longMessage || first.message || 'Something went wrong. Try again.', lockoutSeconds: null };
}
