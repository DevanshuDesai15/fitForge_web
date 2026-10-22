import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Eye, EyeOff, WifiOff } from 'lucide-react';
import { Alert, Box, ButtonBase, IconButton, TextField, Typography } from '@mui/material';
import logo from '../../../../public/logo.svg';
import { passwordStrength } from './passwordStrength';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

// Every auth screen: logo row, optional back arrow, offline strip, and a bottom-anchored footer so the
// primary action always lands in the same place.
export function AuthShell({ children, onBack, footer, offline, step }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', width: '100%', maxWidth: 520, mx: 'auto', px: 2.5, pt: 2.25, pb: 3, backgroundColor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 40, mb: 2.25 }}>
        {onBack ? (
          <IconButton aria-label="Back" onClick={onBack} sx={{ width: 44, height: 44, ml: -1 }}>
            <ArrowLeft size={22} />
          </IconButton>
        ) : null}
        <Box component="img" src={logo} alt="FitForge" sx={{ height: 26, opacity: onBack ? 0.55 : 1 }} />
        {step ? <Typography sx={{ ml: 'auto', ...mono, fontSize: '0.75rem', color: 'text.secondary', letterSpacing: '0.08em' }}>{step}</Typography> : null}
      </Box>
      {offline ? (
        <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2, p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
          <WifiOff size={16} aria-hidden="true" />
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>No connection. Sign-in needs one — your logged sets are safe offline.</Typography>
        </Box>
      ) : null}
      <Box sx={{ flex: 1 }}>{children}</Box>
      {footer ? <Box sx={{ mt: 3 }}>{footer}</Box> : null}
    </Box>
  );
}

export function Headline({ title, sub }) {
  return (
    <Box sx={{ mb: 3.25 }}>
      <Typography component="h1" sx={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em' }}>{title}</Typography>
      {sub ? <Typography sx={{ mt: 1.25, color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.45 }}>{sub}</Typography> : null}
    </Box>
  );
}

// Reads as a link but keeps a 44px target — the "do it the other way" escape hatch on every screen.
export function LinkButton({ children, onClick, align = 'center', tone = 'accent', disabled }) {
  return (
    <ButtonBase onClick={onClick} disabled={disabled} sx={{ width: align === 'center' ? '100%' : 'auto', minHeight: 44, px: 0.5, py: 1.25, justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center', fontWeight: 600, fontSize: '1rem', color: tone === 'accent' ? 'primary.main' : 'text.secondary' }}>
      {children}
    </ButtonBase>
  );
}

export function GoogleButton({ onClick, disabled, label = 'Continue with Google' }) {
  return (
    <ButtonBase onClick={onClick} disabled={disabled} sx={{ width: '100%', minHeight: 52, gap: 1.5, borderRadius: '10px', bgcolor: '#fff', color: '#1a1a1a', fontWeight: 700, fontSize: '1.05rem', opacity: disabled ? 0.42 : 1 }}>
      <Box component="span" aria-hidden="true" sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#f1f3f4', color: '#4285f4', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15 }}>G</Box>
      {label}
    </ButtonBase>
  );
}

export function OrRule({ children = 'or' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5 }} aria-hidden="true">
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'border.main' }} />
      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{children}</Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'border.main' }} />
    </Box>
  );
}

export function Strength({ value }) {
  const { score, word } = passwordStrength(value);
  return (
    <Box sx={{ mt: 1.25 }}>
      <Box sx={{ display: 'flex', gap: 0.5 }} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <Box key={i} sx={{ flex: 1, height: 3, borderRadius: 1, bgcolor: i < score ? 'primary.main' : 'border.main' }} />)}
      </Box>
      <Typography sx={{ mt: 0.75, color: 'text.secondary', fontSize: '0.85rem' }}>{word} · 8+ characters, one number</Typography>
    </Box>
  );
}

export function PasswordField({ label = 'Password', value, onChange, error, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(error)}
      helperText={error && error.trim() ? error : undefined}
      autoComplete={autoComplete}
      InputProps={{
        endAdornment: (
          <IconButton aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} edge="end" sx={{ width: 44, height: 44 }}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </IconButton>
        ),
      }}
    />
  );
}

export function Field({ label, error, ...props }) {
  return <TextField fullWidth label={label} error={Boolean(error)} helperText={error || undefined} {...props} />;
}

export function ErrorNote({ children }) {
  return children ? <Alert severity="error" sx={{ mb: 2 }}>{children}</Alert> : null;
}

// Six boxes, one hidden-feeling input each: typing advances, backspace retreats, a pasted code fills all.
export function CodeInput({ value, onChange, onComplete, error, length = 6 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const commit = (next) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const onInput = (i, raw) => {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    const next = (value.slice(0, i) + typed).slice(0, length);
    commit(next);
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    const at = digits[i] ? i : i - 1;
    if (at < 0) return;
    onChange(value.slice(0, at) + value.slice(at + 1));
    refs.current[at]?.focus();
  };

  const onPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <Box role="group" aria-label="Verification code" sx={{ display: 'grid', gridTemplateColumns: `repeat(${length}, 1fr)`, gap: 1 }}>
      {digits.map((digit, i) => (
        <Box
          key={i}
          component="input"
          ref={(el) => { refs.current[i] = el; }}
          value={digit}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={error ? 'true' : undefined}
          maxLength={length}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          sx={{ minWidth: 0, height: 60, textAlign: 'center', borderRadius: '12px', border: '1px solid', borderColor: error ? 'error.main' : digit ? 'primary.main' : 'border.main', backgroundColor: 'background.paper', color: 'text.primary', ...mono, fontSize: '1.6rem', fontWeight: 700, outline: 'none', '&:focus': { borderColor: 'primary.main' } }}
        />
      ))}
    </Box>
  );
}

AuthShell.propTypes = { children: PropTypes.node, onBack: PropTypes.func, footer: PropTypes.node, offline: PropTypes.bool, step: PropTypes.string };
Headline.propTypes = { title: PropTypes.string.isRequired, sub: PropTypes.string };
LinkButton.propTypes = { children: PropTypes.node, onClick: PropTypes.func, align: PropTypes.oneOf(['center', 'left', 'right']), tone: PropTypes.oneOf(['accent', 'quiet']), disabled: PropTypes.bool };
GoogleButton.propTypes = { onClick: PropTypes.func, disabled: PropTypes.bool, label: PropTypes.string };
OrRule.propTypes = { children: PropTypes.node };
Strength.propTypes = { value: PropTypes.string };
PasswordField.propTypes = { label: PropTypes.string, value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, error: PropTypes.string, autoComplete: PropTypes.string };
Field.propTypes = { label: PropTypes.string.isRequired, error: PropTypes.string };
ErrorNote.propTypes = { children: PropTypes.node };
CodeInput.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, onComplete: PropTypes.func, error: PropTypes.bool, length: PropTypes.number };
