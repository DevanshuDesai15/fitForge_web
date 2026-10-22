import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useUnits } from '../../../contexts/UnitsContext';
import { useProfile } from '../../../hooks/useProfile';
import { useWorkoutMutations, syncProgramTemplateIds } from '../../Workout/hooks/useWorkoutMutations';
import { AuthShell, ErrorNote, Field, Headline, LinkButton } from './authControls';
import { buildOnboardingPayload, buildStarterProgram } from './onboarding';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STEPS = 5;

const TITLES = [
  ['How do you count?', 'Weights, plates, bodyweight — one unit everywhere, changeable later.'],
  ['Where are you starting?', 'This sets your first suggested loads. The AI corrects itself after three sessions.'],
  ['How often are you in?', 'Your weekly target drives the streak and the nudges. Be honest, not ambitious.'],
  ['Pick your first program.', 'Start with something proven. You can build your own the moment you want to.'],
  ['Should we tap you on the shoulder?', 'One buzz: your rest is up. Nothing else — no streak nagging, no marketing.'],
];

function OptionRow({ title, sub, selected, onClick }) {
  return (
    <ButtonBase onClick={onClick} aria-pressed={selected} sx={{ width: '100%', justifyContent: 'space-between', gap: 1.5, textAlign: 'left', minHeight: 64, px: 2, py: 1.5, borderRadius: '14px', border: '1px solid', borderColor: selected ? 'primary.main' : 'border.main', bgcolor: selected ? 'rgba(221,237,0,0.08)' : 'background.paper' }}>
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        {sub ? <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}>{sub}</Typography> : null}
      </Box>
      {selected ? <Check size={18} color="#dded00" aria-hidden="true" /> : null}
    </ButtonBase>
  );
}
OptionRow.propTypes = { title: PropTypes.string.isRequired, sub: PropTypes.string, selected: PropTypes.bool, onClick: PropTypes.func.isRequired };

const Label = ({ children }) => (
  <Typography sx={{ mb: 1.25, color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{children}</Typography>
);
Label.propTypes = { children: PropTypes.node };

// Five steps, all skippable. Only the steps the user presses Continue on are saved, so skipping never
// writes a default the user did not choose. Nothing here blocks the app.
export default function SetupWizard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { updateUnitPreference } = useUnits();
  const { createTemplate, updateTemplate, deleteTemplate, createProgram } = useWorkoutMutations();

  const [step, setStep] = useState(0);
  const [units, setUnits] = useState('metric');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [level, setLevel] = useState('returning');
  const [target, setTarget] = useState(4);
  const [days, setDays] = useState([]);
  const [program, setProgram] = useState('starter');
  const [alerts, setAlerts] = useState(true);
  const [answered, setAnswered] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const createdProgramId = useRef(null);

  const toggleDay = (d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);

  const collect = (steps) => {
    const answers = {};
    if (steps.has(0)) Object.assign(answers, { units, weight, height });
    if (steps.has(1)) answers.level = level;
    if (steps.has(2)) Object.assign(answers, { target, days });
    if (steps.has(4)) answers.alerts = alerts;
    return answers;
  };

  const finish = async (steps) => {
    setSaving(true);
    setError('');
    try {
      const answers = collect(steps);
      if (steps.has(3) && program === 'starter') {
        // Create once: a retry after a failed profile save must not make a second program.
        if (!createdProgramId.current) {
          const starter = buildStarterProgram();
          const synced = await syncProgramTemplateIds({ days: starter.days, createTemplate, updateTemplate, deleteTemplate, defaults: starter.defaults });
          const created = await createProgram({ ...starter.program, templateIds: synced.templateIds });
          createdProgramId.current = created.id;
        }
        answers.firstProgram = createdProgramId.current;
      }
      if (answers.units) await updateUnitPreference(answers.units);
      await updateProfile(buildOnboardingPayload({ answers, profile, currentUser }));
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Setup could not be saved:', e);
      setError('We could not save that. Check your connection and try again, or skip for now.');
      setSaving(false);
    }
  };

  const next = () => {
    const steps = new Set(answered).add(step);
    setAnswered(steps);
    if (step === STEPS - 1) finish(steps); else setStep(step + 1);
  };
  const skip = () => (step === STEPS - 1 ? finish(answered) : setStep(step + 1));
  const back = () => (step === 0 ? null : setStep(step - 1));

  const bodies = [
    <Box key="0" sx={{ display: 'grid', gap: 2.75 }}>
      <Box sx={{ display: 'flex', gap: 0.5, p: '5px', borderRadius: '50px', bgcolor: '#1e1e1e' }} role="group" aria-label="Units">
        {[['metric', 'Kilograms'], ['imperial', 'Pounds']].map(([id, label]) => (
          <ButtonBase key={id} aria-pressed={units === id} onClick={() => setUnits(id)} sx={{ flex: 1, minHeight: 44, borderRadius: '50px', fontWeight: 700, color: units === id ? '#fff' : 'rgba(255,255,255,0.45)', bgcolor: units === id ? '#2e2e2e' : 'transparent' }}>{label}</ButtonBase>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Field label="Bodyweight" value={weight} inputProps={{ inputMode: 'decimal', style: { textAlign: 'center', ...mono } }} InputProps={{ endAdornment: <Typography sx={{ color: 'text.secondary' }}>{units === 'metric' ? 'kg' : 'lb'}</Typography> }} onChange={(e) => setWeight(e.target.value)} />
        <Field label="Height" value={height} inputProps={{ inputMode: 'decimal', style: { textAlign: 'center', ...mono } }} InputProps={{ endAdornment: <Typography sx={{ color: 'text.secondary' }}>{units === 'metric' ? 'cm' : 'in'}</Typography> }} onChange={(e) => setHeight(e.target.value)} />
      </Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Bodyweight and height are optional — they only power relative-strength stats.</Typography>
    </Box>,
    <Box key="1" sx={{ display: 'grid', gap: 1.25 }}>
      <OptionRow title="First time under a bar" sub="We start light and teach the movement patterns." selected={level === 'new'} onClick={() => setLevel('new')} />
      <OptionRow title="Been lifting, took a break" sub="Conservative loads for two weeks, then push." selected={level === 'returning'} onClick={() => setLevel('returning')} />
      <OptionRow title="Training hard already" sub="Straight to progressive overload and plateau watch." selected={level === 'advanced'} onClick={() => setLevel('advanced')} />
    </Box>,
    <Box key="2" sx={{ display: 'grid', gap: 3 }}>
      <Box>
        <Label>Sessions per week</Label>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {[3, 4, 5, 6].map((n) => (
            <ButtonBase key={n} aria-pressed={target === n} aria-label={`${n} sessions per week`} onClick={() => setTarget(n)} sx={{ minHeight: 72, borderRadius: '14px', border: '1px solid', borderColor: target === n ? 'primary.main' : 'border.main', bgcolor: target === n ? 'primary.main' : 'background.paper', color: target === n ? 'primary.contrastText' : 'text.primary', ...mono, fontSize: '1.6rem', fontWeight: 800 }}>{n}</ButtonBase>
          ))}
        </Box>
      </Box>
      <Box>
        <Label>Which days? <Box component="span" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>Optional</Box></Label>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {DAYS.map((d) => (
            <ButtonBase key={d} aria-pressed={days.includes(d)} onClick={() => toggleDay(d)} sx={{ minWidth: 46, minHeight: 44, px: 1.5, borderRadius: '50px', fontWeight: 700, border: '1px solid', borderColor: days.includes(d) ? 'primary.main' : 'border.main', bgcolor: days.includes(d) ? 'rgba(221,237,0,0.15)' : 'transparent', color: days.includes(d) ? 'primary.main' : 'text.secondary' }}>{d}</ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>,
    <Box key="3" sx={{ display: 'grid', gap: 1.25 }}>
      <OptionRow title="Beginner Foundations" sub="Strength · Beginner · 3 sessions with real exercises already in" selected={program === 'starter'} onClick={() => setProgram('starter')} />
      <OptionRow title="I'll build my own" sub="Start empty and add exercises as you go." selected={program === 'own'} onClick={() => setProgram('own')} />
    </Box>,
    <Box key="4" sx={{ display: 'grid', gap: 2 }}>
      <OptionRow title="Yes, buzz me when rest is up" sub="Your phone vibrates at the end of each rest period while FitForge is open." selected={alerts} onClick={() => setAlerts(true)} />
      <OptionRow title="No alerts" sub="The in-app timer still counts down on screen." selected={!alerts} onClick={() => setAlerts(false)} />
      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>You can change this any time in Profile → Preferences.</Typography>
    </Box>,
  ];

  return (
    <AuthShell onBack={step > 0 ? back : undefined} step={`STEP ${step + 1} OF ${STEPS}`} footer={
      <>
        <Button fullWidth size="large" variant="contained" disabled={saving} onClick={next} sx={{ color: 'primary.contrastText', fontWeight: 800, minHeight: 52 }}>
          {saving ? <CircularProgress size={20} color="inherit" aria-label="Saving" /> : step === STEPS - 1 ? 'Enter the forge' : 'Continue'}
        </Button>
        <LinkButton tone="quiet" disabled={saving} onClick={skip}>Skip for now</LinkButton>
      </>
    }>
      <LinearProgress variant="determinate" value={((step + 1) / STEPS) * 100} aria-label="Setup progress" sx={{ mb: 3.25 }} />
      <Headline title={TITLES[step][0]} sub={TITLES[step][1]} />
      <ErrorNote>{error}</ErrorNote>
      {bodies[step]}
    </AuthShell>
  );
}
