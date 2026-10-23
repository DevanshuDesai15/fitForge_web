import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Check, CheckCircle2, Clock, History, KeyRound, Lock, MailCheck, TrendingUp } from 'lucide-react';
import { Box, Button, ButtonBase, CircularProgress, Typography } from '@mui/material';
import MobileHeatmap from '../../../components/mobile/MobileHeatmap';
import { buildActivity } from '../../History/historyActivity';
import logo from '../../../../public/appLogo.svg';
import { AuthShell, CodeInput, ErrorNote, Field, GoogleButton, Headline, LinkButton, OrRule, PasswordField, Strength } from './authControls';
import { parseClerkError } from './clerkErrors';
import { isEmail } from './passwordStrength';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const hexSx = { width: 96, height: 96, mb: 3.25, display: 'grid', placeItems: 'center', clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' };

const Busy = ({ label }) => (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={18} color="inherit" aria-hidden="true" />{label}
  </Box>
);
Busy.propTypes = { label: PropTypes.string.isRequired };

const Primary = ({ children, ...props }) => (
  <Button fullWidth size="large" variant="contained" sx={{ color: 'primary.contrastText', fontWeight: 800, minHeight: 52 }} {...props}>{children}</Button>
);
Primary.propTypes = { children: PropTypes.node };

// One countdown for every "resend in 0:28" and lockout timer.
function useCountdown(initial) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

const fmt = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Runs an async submit, keeping busy state and turning a thrown Clerk error into field/general messages.
function useSubmit() {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const run = async (fn, onError) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      onError(parseClerkError(error), error);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  return [busy, run];
}

/* ───────── 1. WELCOME CAROUSEL ───────── */
// Visuals are built from the same shapes as the product (set rows, AI suggestion cards, the activity heat
// map) so the carousel shows the real thing rather than artwork. Completed sets use the kit's success
// green, not the lime accent — lime is reserved for actions and emphasis.
const SUCCESS = '#4caf50';
const cardSx = { p: 1.75, borderRadius: '18px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'surface.card' };

function Pill({ children, tone = 'neutral', icon: Icon }) {
  const tones = {
    neutral: { bgcolor: 'rgba(255,255,255,0.10)', color: 'text.primary' },
    accent: { bgcolor: 'rgba(221,237,0,0.15)', color: 'primary.main' },
    high: { bgcolor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.30)' },
    low: { bgcolor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.30)' },
  };
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 22, px: 1.5, borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid transparent', ...tones[tone] }}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}{children}
    </Box>
  );
}
Pill.propTypes = { children: PropTypes.node, tone: PropTypes.string, icon: PropTypes.elementType };

const Num = ({ children, done }) => (
  <Box component="span" sx={{ ...mono, fontSize: '1.3rem', fontWeight: 700, color: done ? SUCCESS : 'text.primary' }}>{children}</Box>
);
Num.propTypes = { children: PropTypes.node, done: PropTypes.bool };

const Suffix = ({ children }) => <Box component="span" sx={{ ...mono, ml: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>{children}</Box>;
Suffix.propTypes = { children: PropTypes.node };

function SetLine({ index, weight, reps, done }) {
  const field = (value, suffix) => (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ flex: 1, py: 0.75, px: 1, textAlign: 'center', borderRadius: '8px', border: '1px solid', borderColor: done ? 'transparent' : 'border.main', bgcolor: done ? 'transparent' : '#1c1c1c' }}>
        <Num done={done}>{value}</Num>
      </Box>
      <Suffix>{suffix}</Suffix>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: '12px', border: '1px solid', borderColor: done ? 'rgba(76,175,80,0.30)' : 'border.main', bgcolor: done ? 'rgba(76,175,80,0.15)' : 'transparent' }}>
      <Typography sx={{ width: 24, flexShrink: 0, textAlign: 'center', ...mono, fontWeight: 700, color: 'text.secondary' }}>{index}</Typography>
      {field(weight, 'kg')}
      {field(reps, 'reps')}
      {done
        ? <Box sx={{ width: 40, display: 'grid', placeItems: 'center', color: SUCCESS }}><CheckCircle2 size={22} aria-hidden="true" /></Box>
        : <Box sx={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: '10px', bgcolor: 'rgba(221,237,0,0.15)', color: 'primary.main' }}><Check size={20} aria-hidden="true" /></Box>}
    </Box>
  );
}
SetLine.propTypes = { index: PropTypes.number.isRequired, weight: PropTypes.number.isRequired, reps: PropTypes.number.isRequired, done: PropTypes.bool };

function SuggestionCard({ icon: Icon, title, priority, body, confidence }) {
  return (
    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', gap: 2 }}>
      <Box sx={{ color: 'primary.main', mt: '2px', flexShrink: 0 }}><Icon size={20} aria-hidden="true" /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</Typography>
          <Pill tone={priority}>{priority}</Pill>
        </Box>
        <Typography sx={{ color: 'text.muted', fontSize: '0.95rem', lineHeight: 1.4 }}>{body}</Typography>
        <Typography sx={{ mt: 1.5, ...mono, color: 'text.secondary', fontSize: '0.8rem' }}>{confidence}% confidence</Typography>
      </Box>
    </Box>
  );
}
SuggestionCard.propTypes = { icon: PropTypes.elementType.isRequired, title: PropTypes.string.isRequired, priority: PropTypes.string.isRequired, body: PropTypes.string.isRequired, confidence: PropTypes.number.isRequired };

// A believable training year for the heat map: roughly every other day, with gaps.
const SAMPLE_WORKOUTS = Array.from({ length: 220 }, (_, i) => i).filter((i) => (i * 7) % 5 < 3 && i % 9 !== 0)
  .map((daysAgo) => ({ timestamp: new Date(Date.now() - daysAgo * 86400000).toISOString(), exercises: [] }));

function WelcomeVisual({ index }) {
  if (index === 0) {
    return (
      <Box sx={cardSx}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.25, mb: 0.5 }}>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700 }}>Bench Press</Typography>
          <Typography sx={{ ...mono, color: 'text.secondary', fontSize: '0.875rem' }}>SET 3 / 4</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Pill>Chest</Pill>
          <Pill tone="accent" icon={History}>80 kg last time</Pill>
        </Box>
        <Box sx={{ display: 'grid', gap: 1 }}>
          <SetLine index={1} weight={80} reps={10} done />
          <SetLine index={2} weight={80} reps={9} done />
          <SetLine index={3} weight={82.5} reps={8} />
        </Box>
      </Box>
    );
  }
  if (index === 1) {
    return (
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        <SuggestionCard icon={TrendingUp} title="Increase Weight" priority="high" confidence={87} body="Bench Press — go to 82.5 kg for 8. You cleared 10 at 80 last session." />
        <SuggestionCard icon={Clock} title="Deload Week" priority="low" confidence={54} body="Barbell Row has flattened for three weeks. Drop to 55 kg and rebuild." />
      </Box>
    );
  }
  const activity = buildActivity(SAMPLE_WORKOUTS, 'kg');
  return (
    <MobileHeatmap values={activity.values} months={activity.months} year={activity.year} todayIndex={activity.todayIndex}
      dotSize={7} gap={3} onSelectDay={() => {}} dayLabel={(i) => activity.days[i].label} />
  );
}
WelcomeVisual.propTypes = { index: PropTypes.number.isRequired };

const SLIDES = [
  { eyebrow: 'Log it live', title: 'Every set. On the record.', body: 'Weight and reps go in the moment the bar comes down — not from memory on the drive home.' },
  { eyebrow: 'AI progression', title: 'The plateau has nowhere to hide.', body: 'Six sessions stuck at 80 kg? Your coach says it out loud, with the next load already picked.' },
  { eyebrow: 'Receipts', title: 'Proof, not vibes.', body: 'Streaks, volume and PRs, kept honest. The year fills in one session at a time.' },
];

export function WelcomeCarousel({ onSignUp, onSignIn }) {
  const [i, setI] = useState(0);
  const down = useRef(null);
  const go = (n) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));
  const s = SLIDES[i];

  return (
    // Pinned to the visible viewport (not the page, whose 100vh includes the phone's address bar), so the
    // screen itself never scrolls; it only scrolls internally on a screen too short to fit it.
    <Box sx={{ position: 'fixed', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain', bgcolor: 'background.default' }}>
      <Box
        onPointerDown={(e) => { down.current = e.clientX; }}
        onPointerUp={(e) => {
          if (down.current === null) return;
          const dx = e.clientX - down.current;
          if (Math.abs(dx) > 44) go(i + (dx < 0 ? 1 : -1));
          down.current = null;
        }}
        sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', maxWidth: 520, mx: 'auto', px: 2.5, pt: 1.5, pb: 2.5, touchAction: 'pan-y' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, mb: 1 }}>
          <Box component="img" src={logo} alt="FitForge" sx={{ height: 26 }} />
          <ButtonBase onClick={onSignIn} sx={{ ml: 'auto', minHeight: 44, px: 0.5, py: 1.25, color: 'text.secondary', fontWeight: 600, fontSize: '1rem' }}>Skip</ButtonBase>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <WelcomeVisual index={i} />
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ color: 'primary.main', ...mono, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
              0{i + 1} / 0{SLIDES.length} · {s.eyebrow}
            </Typography>
            <Typography component="h1" sx={{ fontSize: 'clamp(1.7rem, 4.4dvh, 2.2rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em', my: 1 }}>{s.title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 'clamp(0.95rem, 2.3dvh, 1.1rem)', lineHeight: 1.4 }}>{s.body}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.875, justifyContent: 'center', my: 2 }}>
          {SLIDES.map((_, n) => (
            <Box key={n} component="button" type="button" aria-label={`Card ${n + 1}`} onClick={() => go(n)}
              sx={{ width: n === i ? 26 : 7, height: 7, borderRadius: 1, border: 0, p: 0, cursor: 'pointer', bgcolor: n === i ? 'primary.main' : 'border.main', transition: 'width 150ms ease' }} />
          ))}
        </Box>
        <Primary onClick={onSignUp}>Create your account</Primary>
        <LinkButton onClick={onSignIn}>Already training here? Sign in</LinkButton>
      </Box>
    </Box>
  );
}
WelcomeCarousel.propTypes = { onSignUp: PropTypes.func.isRequired, onSignIn: PropTypes.func.isRequired };

/* ───────── 2. SIGN UP ───────── */
export function SignUpScreen({ onBack, onSignIn, onGoogle, onSubmit, offline }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState({});
  const [busy, run] = useSubmit();

  const submit = () => {
    const e = {};
    if (!name.trim()) e.name = 'We need something to call you.';
    if (!email.trim()) e.email = 'Enter your email.';
    else if (!isEmail(email)) e.email = 'That address is missing something.';
    if (pw.length < 8) e.pw = 'Eight characters minimum.';
    setErr(e);
    if (Object.keys(e).length) return;
    run(() => onSubmit({ name: name.trim(), email: email.trim(), password: pw }), ({ code, message }) => {
      if (code === 'form_identifier_exists') setErr({ email: message });
      else if (code.startsWith('form_password')) setErr({ pw: message });
      else setErr({ general: message });
    });
  };

  return (
    <AuthShell onBack={onBack} offline={offline} footer={
      <>
        <Primary disabled={busy || offline} onClick={submit}>{busy ? <Busy label="Creating your account…" /> : 'Create account'}</Primary>
        <LinkButton tone="quiet" onClick={onSignIn}>Already training here? <Box component="span" sx={{ color: 'primary.main', ml: 0.5 }}>Sign in</Box></LinkButton>
      </>
    }>
      <Headline title="Start forging." sub="Two minutes now. Every session after this takes ten seconds." />
      <GoogleButton onClick={onGoogle} disabled={offline} label="Sign up with Google" />
      <OrRule />
      <ErrorNote>{err.general}</ErrorNote>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Field label="Name" placeholder="Devanshu" value={name} error={err.name} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" placeholder="you@example.com" value={email} error={err.email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <Box>
          <PasswordField value={pw} onChange={setPw} error={err.pw} autoComplete="new-password" />
          {!err.pw ? <Strength value={pw} /> : null}
        </Box>
      </Box>
      {/* Clerk mounts its bot-protection challenge here during custom sign-up. */}
      <div id="clerk-captcha" />
      <Typography sx={{ mt: 2.25, color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
        Creating an account accepts the Terms and Privacy Policy. Your training data is yours — export it whenever you want.
      </Typography>
    </AuthShell>
  );
}
SignUpScreen.propTypes = { onBack: PropTypes.func, onSignIn: PropTypes.func.isRequired, onGoogle: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, offline: PropTypes.bool };

/* ───────── 3. SIGN IN ───────── */
export function SignInScreen({ onBack, onSignUp, onGoogle, onSubmit, onEmailCode, onForgot, offline }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState({});
  const [busy, run] = useSubmit();

  const fail = ({ code, message }) => {
    if (code === 'form_identifier_not_found') setErr({ email: message });
    else if (code === 'form_password_incorrect') { setErr({ pw: message }); setPw(''); }
    else setErr({ general: message });
  };

  const submit = () => {
    const e = {};
    if (!email.trim()) e.email = 'Enter your email.';
    if (!pw) e.pw = 'Enter your password.';
    setErr(e);
    if (Object.keys(e).length) return;
    run(() => onSubmit({ email: email.trim(), password: pw }), fail);
  };

  const codeInstead = () => {
    if (!isEmail(email)) { setErr({ email: 'Enter your email first, then we can send a code.' }); return; }
    setErr({});
    run(() => onEmailCode(email.trim()), fail);
  };

  return (
    <AuthShell onBack={onBack} offline={offline} footer={
      <>
        <Primary disabled={busy || offline} onClick={submit}>{busy ? <Busy label="Checking…" /> : 'Sign in'}</Primary>
        <LinkButton tone="quiet" onClick={onSignUp}>New here? <Box component="span" sx={{ color: 'primary.main', ml: 0.5 }}>Create an account</Box></LinkButton>
      </>
    }>
      <Headline title="Back under the bar." sub="Welcome back. Pick up where you left off." />
      <GoogleButton onClick={onGoogle} disabled={offline} />
      <OrRule />
      <ErrorNote>{err.general}</ErrorNote>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Field label="Email" type="email" value={email} error={err.email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
        <PasswordField value={pw} onChange={setPw} error={err.pw} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <LinkButton align="left" onClick={onForgot}>Forgot password?</LinkButton>
          <LinkButton align="right" onClick={codeInstead} disabled={busy || offline}>Email me a code instead</LinkButton>
        </Box>
      </Box>
    </AuthShell>
  );
}
SignInScreen.propTypes = { onBack: PropTypes.func, onSignUp: PropTypes.func.isRequired, onGoogle: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, onEmailCode: PropTypes.func.isRequired, onForgot: PropTypes.func.isRequired, offline: PropTypes.bool };

/* ───────── 4. CODE ENTRY (verify email, email code, reset code, second factor) ───────── */
const CODE_COPY = {
  verify: { title: 'Confirm your email.', icon: MailCheck, action: 'Verify and continue' },
  signin: { title: "Six digits and you're in.", icon: MailCheck, action: 'Verify and continue' },
  reset: { title: 'Check your email.', icon: KeyRound, action: 'Continue' },
};

export function CodeScreen({ purpose = 'signin', target, onBack, onVerify, onResend, offline }) {
  const copy = CODE_COPY[purpose] || CODE_COPY.signin;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, run] = useSubmit();
  const [left, setLeft] = useCountdown(30);

  const verify = (value) => {
    if (value.length < 6) return;
    setError('');
    run(() => onVerify(value), ({ message }) => { setError(message); setCode(''); });
  };

  const resend = () => {
    setError('');
    run(async () => { await onResend(); setLeft(30); setNotice('New code sent.'); }, ({ message }) => setError(message));
  };

  return (
    <AuthShell onBack={onBack} offline={offline} footer={
      <>
        <Primary disabled={busy || code.length < 6 || offline} onClick={() => verify(code)}>{busy ? <Busy label="Verifying…" /> : copy.action}</Primary>
        {left > 0
          ? <Typography sx={{ textAlign: 'center', py: 1.5, color: 'text.secondary', ...mono }}>Resend in {fmt(left)}</Typography>
          : <LinkButton onClick={resend} disabled={busy}>Send a new code</LinkButton>}
      </>
    }>
      <Headline title={copy.title} sub={`We sent a six-digit code to ${target}. It expires in ten minutes.`} />
      <CodeInput value={code} error={Boolean(error)} onChange={(v) => { setCode(v); setError(''); setNotice(''); }} onComplete={verify} />
      <Box sx={{ mt: 2 }} aria-live="polite">
        <ErrorNote>{error}</ErrorNote>
        {notice && !error ? <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{notice}</Typography> : null}
      </Box>
    </AuthShell>
  );
}
CodeScreen.propTypes = { purpose: PropTypes.oneOf(['verify', 'signin', 'reset']), target: PropTypes.string.isRequired, onBack: PropTypes.func, onVerify: PropTypes.func.isRequired, onResend: PropTypes.func.isRequired, offline: PropTypes.bool };

/* ───────── 5. FORGOT → RESET ───────── */
export function ForgotScreen({ onBack, onSubmit, offline }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, run] = useSubmit();

  const submit = () => {
    if (!isEmail(email)) { setErr('Enter the email on your account.'); return; }
    setErr('');
    run(() => onSubmit(email.trim()), ({ message }) => setErr(message));
  };

  return (
    <AuthShell onBack={onBack} offline={offline} footer={
      <Primary disabled={busy || offline} onClick={submit}>{busy ? <Busy label="Sending…" /> : 'Send me a code'}</Primary>
    }>
      <Headline title="Locked out. It happens." sub="Give us the email on your account and we'll send a code to reset your password. Your logged sessions are untouched." />
      <Field label="Email" type="email" placeholder="you@example.com" value={email} error={err} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
    </AuthShell>
  );
}
ForgotScreen.propTypes = { onBack: PropTypes.func, onSubmit: PropTypes.func.isRequired, offline: PropTypes.bool };

export function ResetPasswordScreen({ onBack, onSubmit }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState({});
  const [busy, run] = useSubmit();

  const submit = () => {
    const e = {};
    if (pw.length < 8) e.pw = 'Eight characters minimum.';
    if (confirm !== pw) e.confirm = "These two don't match.";
    setErr(e);
    if (Object.keys(e).length) return;
    run(() => onSubmit(pw), ({ code, message }) => setErr(code.startsWith('form_password') ? { pw: message } : { general: message }));
  };

  return (
    <AuthShell onBack={onBack} footer={<Primary disabled={busy} onClick={submit}>{busy ? <Busy label="Saving…" /> : 'Save and sign in'}</Primary>}>
      <Headline title="Set a new one." sub="Every other device gets signed out. That's the point." />
      <ErrorNote>{err.general}</ErrorNote>
      <Box sx={{ display: 'grid', gap: 2.25 }}>
        <Box>
          <PasswordField label="New password" value={pw} onChange={setPw} error={err.pw} autoComplete="new-password" />
          {!err.pw ? <Strength value={pw} /> : null}
        </Box>
        <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} error={err.confirm} autoComplete="new-password" />
      </Box>
    </AuthShell>
  );
}
ResetPasswordScreen.propTypes = { onBack: PropTypes.func, onSubmit: PropTypes.func.isRequired };

/* ───────── 6. LOCKED OUT ───────── */
export function LockedScreen({ seconds, onBack, onForgot }) {
  const [left] = useCountdown(seconds);
  return (
    <AuthShell onBack={onBack} footer={
      <>
        <Primary disabled={left > 0} onClick={onBack}>{left > 0 ? `Try again in ${fmt(left)}` : 'Try signing in again'}</Primary>
        <LinkButton onClick={onForgot}>Reset your password instead</LinkButton>
      </>
    }>
      <Box sx={{ pt: 4.5 }}>
        <Box sx={{ ...hexSx, bgcolor: 'rgba(239,68,68,0.14)', color: '#f87171' }}><Lock size={36} aria-hidden="true" /></Box>
        <Typography component="h1" sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.06 }}>Too many misses. Cooling off.</Typography>
        <Typography sx={{ mt: 1.5, mb: 2.75, color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.45 }}>
          Sign-in is frozen on this account for a few minutes. Nobody got in — your data hasn&apos;t moved.
        </Typography>
        <Box sx={{ p: '22px 18px', textAlign: 'center', borderRadius: '18px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
          <Typography aria-live="off" sx={{ ...mono, fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: left > 0 ? 'text.primary' : 'primary.main' }}>{fmt(left)}</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            {left > 0 ? 'until you can retry' : 'ready when you are'}
          </Typography>
        </Box>
        <GuessingNote />
      </Box>
    </AuthShell>
  );
}
LockedScreen.propTypes = { seconds: PropTypes.number.isRequired, onBack: PropTypes.func.isRequired, onForgot: PropTypes.func.isRequired };

function GuessingNote() {
  return (
    <Typography role="note" sx={{ mt: 2.25, p: 1.5, borderRadius: '10px', bgcolor: 'rgba(234,179,8,0.12)', color: '#facc15', fontSize: '0.9rem' }}>
      If this wasn&apos;t you, reset your password — someone is guessing.
    </Typography>
  );
}
